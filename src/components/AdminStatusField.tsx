import { ButtonBase, Menu, MenuItem, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useState } from "react";
import type { AdminStatus } from "../types";

interface Props {
  status: AdminStatus;
  onChange: (status: AdminStatus) => void;
}

const LABEL: Record<AdminStatus, string> = { active: "Active", inactive: "Inactive" };

/**
 * The administrative status value + pencil, as in the existing details strip —
 * now actually switchable. This is the manual switch; the clock never flips it
 * (PRD R11). Whether it's serving is the separate Run State.
 */
export const AdminStatusField = ({ status, onChange }: Props) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label="Change status"
        sx={{ borderRadius: 0.5, "&:hover .MuiSvgIcon-root": { color: "primary.main" } }}
      >
        <Typography variant="body2" sx={{ fontSize: 14 }}>
          {LABEL[status]}
        </Typography>
        <EditIcon sx={{ fontSize: 14, color: "text.secondary", ml: 0.5 }} />
      </ButtonBase>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {(Object.keys(LABEL) as AdminStatus[]).map((s) => (
          <MenuItem
            key={s}
            selected={s === status}
            onClick={() => {
              setAnchor(null);
              if (s !== status) onChange(s);
            }}
          >
            {LABEL[s]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
