"""Measure active AI Work / Prompting per user message from a Claude Code transcript.

Usage: python3 measure_active.py ~/.claude/projects/<project-path>/<session-id>.jsonl

Rule (user, 2026-10-02): a 15m+ gap with no response is idle, not work.
- AI Work: user message -> last AI/tool event before the next user message; any
  single gap of 15m+ inside it is dropped.
- Prompting: AI's last event -> next user message; under 15m counts in full, 15m+
  credits only 5m (reading + typing). AskUserQuestion waits count as Prompting.
Output times are ET (UTC-4); adjust ET below outside daylight time.
"""
import json,sys
from datetime import datetime, timezone, timedelta
IDLE=15*60; CAP=5*60
ET=timezone(timedelta(hours=-4))
def kind(e):
    if e.get("isSidechain") or e.get("type") not in ("user","assistant"): return None
    c=e.get("message",{}).get("content")
    if e["type"]=="assistant":
        if isinstance(c,list) and any(x.get("type")=="tool_use" and x.get("name")=="AskUserQuestion" for x in c): return "ASK"
        return "A"
    if e.get("isMeta"): return None
    if isinstance(c,list) and any(x.get("type")=="tool_result" for x in c): return "R"
    if isinstance(c,str): return None if c.startswith("<") else "P"
    if isinstance(c,list) and any(x.get("type")=="text" and not x["text"].startswith("<") for x in c): return "P"
    if isinstance(c,list) and any(x.get("type")=="image" for x in c): return "R"
    return None
ev=[]
for line in open(sys.argv[1]):
    try: e=json.loads(line)
    except: continue
    k=kind(e)
    if k and e.get("timestamp"): ev.append((datetime.fromisoformat(e["timestamp"].replace("Z","+00:00")).timestamp(),k))
ev.sort()
rows=[]; cur=None
def user_gap(g): return g if g<IDLE else CAP
for i in range(len(ev)):
    t,k=ev[i]
    if k=="P":
        prev_gap = user_gap(t-ev[i-1][0]) if i>0 else 0
        cur={"t":t,"ai":0,"user":prev_gap,"idle":max(0,(t-ev[i-1][0])-prev_gap) if i>0 else 0}
        rows.append(cur)
    elif cur is not None and i>0:
        d=t-ev[i-1][0]
        if ev[i-1][1]=="ASK":
            u=user_gap(d); cur["user"]+=u; cur["idle"]+=d-u
        else:
            cur["ai"]+=min(d,IDLE); cur["idle"]+=max(0,d-IDLE)
for r in rows:
    print(datetime.fromtimestamp(r["t"],ET).strftime("%m-%d %H:%M"), f'AI {r["ai"]/60:5.1f}m  you {r["user"]/60:5.1f}m  idle {r["idle"]/60:6.1f}m')
