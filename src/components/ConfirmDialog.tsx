import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useCallback, useRef, useState, type ReactNode } from "react";

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  /** Label on the affirmative button. Defaults to "Delete". */
  confirmLabel?: string;
  cancelLabel?: string;
}

interface Props extends Partial<ConfirmOptions> {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: Props) => (
  <Dialog
    open={open}
    onClose={onCancel}
    maxWidth="xs"
    fullWidth
    PaperProps={{
      sx: { backgroundColor: "background.paper", borderRadius: 1 },
    }}
  >
    <DialogTitle sx={{ py: 2 }}>
      <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
    </DialogTitle>
    <DialogContent sx={{ px: 3, pb: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 2, py: 1.5 }}>
      <Button onClick={onCancel} sx={{ color: "text.secondary" }}>
        {cancelLabel}
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        color="primary"
        autoFocus
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

/**
 * Promise-based replacement for `window.confirm` that renders inside the app's
 * theme instead of a native browser modal.
 *
 *   const { confirm, confirmDialog } = useConfirm();
 *   const handleDelete = async () => {
 *     const ok = await confirm({ title: "Delete X?", message: "..." });
 *     if (!ok) return;
 *     ...
 *   };
 *   return (<>...{confirmDialog}</>);
 *
 * Render `confirmDialog` once, anywhere in the component's tree.
 */
export const useConfirm = () => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setOptions(opts);
      }),
    [],
  );

  const settle = (ok: boolean) => {
    resolveRef.current?.(ok);
    resolveRef.current = null;
    setOptions(null);
  };

  const confirmDialog = (
    <ConfirmDialog
      open={Boolean(options)}
      {...options}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );

  return { confirm, confirmDialog };
};
