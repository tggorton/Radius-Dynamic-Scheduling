import { useState } from "react";
import { IconButton, ListSubheader, Menu, MenuItem, Tooltip } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface Props {
  /** "Advertiser", "Campaign" — the menu heading and tooltip. */
  kind: string;
  name: string;
  onSelect: () => void;
}

/**
 * The chevron left of a page title. Rather than a breadcrumb that exposes the
 * parent's name, it opens a menu listing the parent; picking it navigates up.
 */
export const ParentMenuButton = ({ kind, name, onSelect }: Props) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Tooltip title={kind}>
        <IconButton
          size="small"
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchor)}
          aria-label={`Go to ${kind.toLowerCase()}`}
          sx={{ color: "text.secondary" }}
        >
          <KeyboardArrowDownIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <ListSubheader sx={{ lineHeight: "32px", backgroundColor: "transparent" }}>{kind}</ListSubheader>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onSelect();
          }}
        >
          {name}
        </MenuItem>
      </Menu>
    </>
  );
};
