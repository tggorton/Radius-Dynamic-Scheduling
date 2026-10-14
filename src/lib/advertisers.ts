/**
 * Advertiser scoping for templates.
 *
 * The line-item page we're rendering belongs to a single advertiser; in a real
 * deployment this would come from the campaign / segment hierarchy. For the
 * prototype we hardcode it to "advertiser-01". Templates with a different
 * advertiserId set are hidden from the main Tag Template dropdown but remain
 * visible to admins in the Save/Update and Delete-Templates flows.
 */
export const CURRENT_ADVERTISER_ID = "advertiser-01";

export const ADVERTISER_OPTIONS: string[] = Array.from(
  { length: 12 },
  (_, i) => `advertiser-${String(i + 1).padStart(2, "0")}`,
);

export const isVisibleForCurrentAdvertiser = (
  templateAdvertiserId: string | undefined,
): boolean =>
  !templateAdvertiserId || templateAdvertiserId === CURRENT_ADVERTISER_ID;
