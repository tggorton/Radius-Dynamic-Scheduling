import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useEffect, useRef, useState } from "react";
import type { CustomKeyValue } from "../types";
import { newId } from "../lib/ids";

interface Props {
  items: CustomKeyValue[];
  onChange: (items: CustomKeyValue[]) => void;
}

export const CustomFieldsSection = ({ items, onChange }: Props) => {
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);
  const lastRowRef = useRef<HTMLDivElement | null>(null);
  const lastKeyInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!pendingScrollId) return;
    lastRowRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    lastKeyInputRef.current?.focus({ preventScroll: true });
    setPendingScrollId(null);
  }, [pendingScrollId]);

  const handleAdd = () => {
    const id = newId();
    onChange([...items, { id, key: "", value: "" }]);
    setPendingScrollId(id);
  };

  const handleUpdate = (id: string, field: "key" | "value", value: string) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={handleAdd}
        sx={{ borderRadius: 1 }}
      >
        + Add Key Value / Macro
      </Button>
      {items.length > 0 && (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <Stack
                key={item.id}
                direction="row"
                spacing={1}
                alignItems="center"
                ref={isLast ? lastRowRef : undefined}
              >
                <TextField
                  size="small"
                  label="Key"
                  value={item.key}
                  onChange={(e) => handleUpdate(item.id, "key", e.target.value)}
                  fullWidth
                  inputRef={isLast ? lastKeyInputRef : undefined}
                />
                <TextField
                  size="small"
                  label="Value"
                  value={item.value}
                  onChange={(e) =>
                    handleUpdate(item.id, "value", e.target.value)
                  }
                  fullWidth
                />
                <Tooltip title="Remove">
                  <IconButton
                    onClick={() => handleDelete(item.id)}
                    sx={{ color: "text.secondary" }}
                    size="small"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};
