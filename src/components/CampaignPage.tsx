import { Stack } from "@mui/material";
import type { Campaign } from "../types";
import { useApp } from "../state/AppContext";
import { CampaignHeader } from "./CampaignHeader";
import { CampaignDetails } from "./CampaignDetails";
import { CampaignLineItemsTable } from "./CampaignLineItemsTable";
import { CampaignPixelsStub } from "./CampaignPixelsStub";

interface Props {
  campaign: Campaign;
}

/** The campaign view — between the advertiser and its line items. */
export const CampaignPage = ({ campaign }: Props) => {
  const { setView } = useApp();
  return (
    <>
      <CampaignHeader name={campaign.name} onBackToAdvertiser={() => setView({ page: "advertiser" })} />
      <Stack spacing={5}>
        <CampaignDetails campaign={campaign} />
        <CampaignLineItemsTable campaign={campaign} />
        <CampaignPixelsStub />
      </Stack>
    </>
  );
};
