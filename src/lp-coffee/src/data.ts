export type Origin = {
  id: string;
  country: string;
  farm: string;
  region: string;
  process: string;
  altitude: string;
  varietal: string;
  notes: string[];
  price: string;
  blurb: string;
};

export const ORIGINS: Origin[] = [
  {
    id: "kiangoi",
    country: "Kenya",
    farm: "Kiangoi AB",
    region: "Kirinyaga",
    process: "Washed",
    altitude: "1,750 m",
    varietal: "SL28 · SL34",
    notes: ["Blackcurrant", "Hibiscus", "Cane syrup"],
    price: "$23",
    blurb:
      "Fermented under shade for eighteen hours, then soaked in cold mountain water. The acidity arrives first and stays late.",
  },
  {
    id: "chelbesa",
    country: "Ethiopia",
    farm: "Chelbesa",
    region: "Gedeb, Gedeo",
    process: "Natural",
    altitude: "2,050 m",
    varietal: "Heirloom landrace",
    notes: ["Strawberry jam", "Jasmine", "Apricot"],
    price: "$25",
    blurb:
      "Dried whole on raised beds for twenty-one days and turned by hand every hour of daylight. Our most perfumed lot of the year.",
  },
  {
    id: "el-mirador",
    country: "Colombia",
    farm: "El Mirador",
    region: "Huila, Pitalito",
    process: "Washed",
    altitude: "1,850 m",
    varietal: "Caturra · Pink Bourbon",
    notes: ["Red apple", "Panela", "Cocoa nib"],
    price: "$20",
    blurb:
      "Grown by Nelson and Adriana Ospina on four hectares above the Magdalena valley. The one we reach for on a Monday.",
  },
  {
    id: "la-soledad",
    country: "Guatemala",
    farm: "Finca La Soledad",
    region: "Acatenango",
    process: "Honey",
    altitude: "1,600 m",
    varietal: "Bourbon",
    notes: ["Toffee", "Toasted walnut", "Orange peel"],
    price: "$21",
    blurb:
      "Volcanic soil, half the mucilage left on the seed. Sweet and heavy enough to hold its own against milk.",
  },
];

export const STEPS = [
  {
    n: "01",
    title: "We buy the whole lot",
    body: "Twice a year we travel — February to East Africa, August to Central America — and we buy entire day-lots rather than cherry-picking scores. If a farm has a hard season, we are still there the following one.",
  },
  {
    n: "02",
    title: "Everything is cupped blind",
    body: "Samples land on the Friday table with numbers instead of names. Five of us score them, nobody talks until the sheets are down, and a lot needs three yeses from five to make the shelf.",
  },
  {
    n: "03",
    title: "Twelve kilos at a time",
    body: "A 1962 Probat UG22, drum-heated and read by ear. Charge at 196 °C, first crack around 8:40, and we pull between eighteen and twenty-two percent development depending on what the cup asks for.",
  },
  {
    n: "04",
    title: "Rested, then gone",
    body: "Beans degas five days in open hoppers before they touch a bag. Everything ships within forty-eight hours of that, valve-sealed, with the roast date stamped rather than a best-before.",
  },
];

export const ROAST_LABELS = [
  {
    name: "Green",
    detail: "Unroasted seed, 11% moisture. Grassy, dense, inert.",
  },
  {
    name: "Cinnamon",
    detail: "Just past first crack. Sharp, bready, far too bright to brew.",
  },
  {
    name: "City",
    detail: "Where our Kenyans land. Acidity intact, sugars just browned.",
  },
  {
    name: "Full City",
    detail: "Our Colombia and Guatemala. Caramel forward, body doubled.",
  },
  {
    name: "French",
    detail: "Second crack, oil on the surface. Roast flavour, not origin.",
  },
];

export const PLANS = [
  {
    name: "The Weekender",
    price: "$21",
    cadence: "every other Friday",
    detail: "One 340 g bag, rotating single origin, ground to order.",
    features: ["1 × 340 g", "Rotating origin", "Skip any delivery"],
    featured: false,
  },
  {
    name: "The Household",
    price: "$38",
    cadence: "every Friday",
    detail:
      "Two 340 g bags a week — one bright, one sweet — so there is always a choice on the counter.",
    features: ["2 × 340 g", "One bright, one sweet", "Free shipping"],
    featured: true,
  },
  {
    name: "The Roaster's Table",
    price: "$32",
    cadence: "first of the month",
    detail:
      "A 500 g micro-lot we could only buy a few bags of, with the cupping sheet in the box.",
    features: ["500 g micro-lot", "Cupping notes enclosed", "Limited to 90 seats"],
    featured: false,
  },
];
