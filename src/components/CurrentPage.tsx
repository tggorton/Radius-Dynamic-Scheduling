import { useEffect } from "react";
import { useApp } from "../state/AppContext";
import { AdvertiserPage } from "./AdvertiserPage";
import { CampaignPage } from "./CampaignPage";
import { LineItemPage } from "./LineItemPage";

/**
 * Picks the page from `state.view` — the prototype has no router.
 * Advertiser → campaign → line item; anything missing falls back to the advertiser.
 */
export const CurrentPage = () => {
  const { state } = useApp();
  const { view } = state;
  const viewKey =
    view.page === "lineItem"
      ? `li-${view.lineItemId}`
      : view.page === "campaign"
        ? `c-${view.campaignId}`
        : "advertiser";

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [viewKey, state.mode]);

  if (view.page === "lineItem") {
    const lineItem = state.lineItems.find((li) => li.id === view.lineItemId);
    const campaign = lineItem && state.campaigns.find((c) => c.id === lineItem.campaignId);
    if (lineItem && campaign) return <LineItemPage lineItem={lineItem} campaign={campaign} />;
  }
  if (view.page === "campaign") {
    const campaign = state.campaigns.find((c) => c.id === view.campaignId);
    if (campaign) return <CampaignPage campaign={campaign} />;
  }
  return <AdvertiserPage />;
};
