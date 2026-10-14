import type { Distro, ParamsCatalog, RegionDef } from "../types";
import { buildDistroUrl } from "./tagBuilder";

const escapeCsv = (value: string): string => {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const buildCsv = (
  distros: Distro[],
  catalog: ParamsCatalog,
  regions: RegionDef[],
): string => {
  const header = "Name,Url";
  const rows = distros.map(
    (d) =>
      `${escapeCsv(d.name)},${escapeCsv(buildDistroUrl(d, catalog, regions))}`,
  );
  return [header, ...rows].join("\n");
};

export const downloadCsv = (
  distros: Distro[],
  catalog: ParamsCatalog,
  regions: RegionDef[],
  filename = "distros.csv",
) => {
  const csv = buildCsv(distros, catalog, regions);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
