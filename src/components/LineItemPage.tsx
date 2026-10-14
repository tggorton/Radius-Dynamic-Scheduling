import { Stack } from "@mui/material";
import type { Campaign, LineItem } from "../types";
import { useApp } from "../state/AppContext";
import { LineItemHeader } from "./LineItemHeader";
import { LineItemDetails } from "./LineItemDetails";
import { CreativesSection } from "./CreativesSection";
import { DistrosSection } from "./DistrosSection";
import { PixelsStub } from "./PixelsStub";

interface Props {
  lineItem: LineItem;
  campaign: Campaign;
}

/**
 * The baseline's single line-item screen, now for whichever line item is open.
 * Creatives are per line item, with schedules and weighting. Distributions and
 * Pixels are the baseline sections unchanged — still shared demo data.
 */
export const LineItemPage = ({ lineItem, campaign }: Props) => {
  const { setView } = useApp();
  return (
    <>
      <LineItemHeader
        name={lineItem.name}
        campaignName={campaign.name}
        onBackToCampaign={() => setView({ page: "campaign", campaignId: campaign.id })}
      />
      <Stack spacing={5}>
        <LineItemDetails lineItem={lineItem} campaign={campaign} />
        <CreativesSection key={lineItem.id} lineItem={lineItem} campaign={campaign} />
        <DistrosSection />
        <PixelsStub />
      </Stack>
    </>
  );
};
