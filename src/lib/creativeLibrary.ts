/**
 * The creative library the Add Creatives dialog searches. Prototype stand-in
 * for the platform's creative catalog: the names in the production picker
 * plus the seeded demo creatives. Ids are the Creative Id shown in the table.
 */
export interface LibraryCreative {
  id: number;
  name: string;
}

export const CREATIVE_LIBRARY: LibraryCreative[] = [
  { id: 150, name: "Kerv_Test_Carhartt_Example" },
  { id: 155, name: "Bill Mateo Test" },
  { id: 161, name: "Kerv_TEST_DO_NOT_USE" },
  { id: 172, name: "DicksSportingGoods - COPY - TEST SCENE DETECT_Sales Demo" },
  { id: 184, name: "GE_Cafe_CAFD_Test" },
  { id: 190, name: "Bargain_Supply_Cafe_2019" },
  { id: 203, name: "FandP_DCS Grill" },
  { id: 217, name: "Cadillac_XT5 - Condensed_Sales Demo" },
  { id: 226, name: "TEST-DO-NOT-TRAFFIC" },
  { id: 8421, name: "Stratos_Hero_30s" },
  { id: 8422, name: "Stratos_Cutdown_15s" },
  { id: 8423, name: "Stratos_Holiday_15s" },
  { id: 8424, name: "Stratos_Teaser_06s" },
  { id: 8431, name: "Kooth_Hulu_30s" },
  { id: 8432, name: "Kooth_Hulu_15s" },
  { id: 8441, name: "DogProbs_Disney_30s" },
  { id: 8442, name: "DogProbs_Disney_Promo_15s" },
  { id: 8451, name: "DogProbs_Hulu_30s" },
];
