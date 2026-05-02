import {
  PrismaClient,
  BodyType,
  ColorType,
  Drivetrain,
  FuelType,
  ImageType,
  OptionCategory,
  Transmission,
} from "@prisma/client";

const prisma = new PrismaClient();

// All Unsplash URLs below are reused from existing verified placeholders to
// avoid surprises with deleted/broken IDs in production.
const IMG = {
  meridianExterior:
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1600&q=85&auto=format&fit=crop",
  auroraExterior:
    "https://images.unsplash.com/photo-1583870996815-55daf7122b08?w=1600&q=85&auto=format&fit=crop",
  halcyonExterior:
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&q=85&auto=format&fit=crop",
  lumenExterior:
    "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600&q=85&auto=format&fit=crop",
  continentalExterior:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&q=85&auto=format&fit=crop",
  evCharging:
    "https://images.unsplash.com/photo-1671785253964-bdb43087ed99?w=1600&q=85&auto=format&fit=crop",
  suvOnRoad:
    "https://images.unsplash.com/photo-1562705841-c4934bb2b31b?w=1600&q=85&auto=format&fit=crop",
  servicing:
    "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1600&q=85&auto=format&fit=crop",
  financing:
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1600&q=85&auto=format&fit=crop",
} as const;

type ImageSeed = { url: string; alt: string; type: ImageType; order: number };

type TrimSeed = {
  name: string;
  price: string;
  engineSize: number | null;
  horsepower: number | null;
  torque: number | null;
  transmission: Transmission;
  fuelType: FuelType;
  drivetrain: Drivetrain;
  fuelEconomy: number | null;
  zeroToHundred: number | null;
  topSpeed: number | null;
  seats: number;
  doors: number;
  cargoCapacity: number | null;
  features: string[];
  displayOrder: number;
  options: { name: string; isStandard: boolean }[];
};

type ModelSeed = {
  slug: string;
  make: string;
  name: string;
  year: number;
  bodyType: BodyType;
  description: string;
  startingPrice: string;
  heroImage: string;
  isFeatured: boolean;
  displayOrder: number;
  highlights: string[];
  metaTitle: string;
  metaDescription: string;
  images: ImageSeed[];
  trims: TrimSeed[];
  exteriorColorNames: string[];
  accentColor: { name: string; hex: string };
};

type OptionSeed = {
  name: string;
  description: string;
  category: OptionCategory;
  price: string;
};

const SHARED_OPTIONS: OptionSeed[] = [
  {
    name: "Adaptive Cruise Control",
    description: "Stop-and-go adaptive cruise with lane-centring assist.",
    category: OptionCategory.SAFETY,
    price: "0",
  },
  {
    name: "360° Camera System",
    description: "Surround-view monitor with parking guidance.",
    category: OptionCategory.SAFETY,
    price: "3500",
  },
  {
    name: "Blind-Spot Monitoring",
    description: "Visual and haptic warnings with rear cross-traffic alert.",
    category: OptionCategory.SAFETY,
    price: "0",
  },
  {
    name: "Heated & Ventilated Seats",
    description: "Three-stage heating and cooling on front row.",
    category: OptionCategory.COMFORT,
    price: "4200",
  },
  {
    name: "Panoramic Sunroof",
    description: "Full-length glass roof with electric sunshade.",
    category: OptionCategory.COMFORT,
    price: "5800",
  },
  {
    name: "Premium Audio (12 Speakers)",
    description: "Mid-channel ambience tuning with subwoofer.",
    category: OptionCategory.TECH,
    price: "3800",
  },
  {
    name: "Wireless Charging Pad",
    description: "Qi pad in centre console with cooling.",
    category: OptionCategory.TECH,
    price: "0",
  },
  {
    name: "Head-Up Display",
    description: "Full-colour windscreen projection with navigation cues.",
    category: OptionCategory.TECH,
    price: "2800",
  },
  {
    name: "Sport Suspension",
    description: "Adaptive dampers with three drive modes.",
    category: OptionCategory.PERFORMANCE,
    price: "6500",
  },
  {
    name: "20\" Alloy Wheels",
    description: "Diamond-cut machined finish.",
    category: OptionCategory.EXTERIOR,
    price: "4500",
  },
  {
    name: "Nappa Leather Upholstery",
    description: "Hand-stitched semi-aniline leather seating.",
    category: OptionCategory.INTERIOR,
    price: "8900",
  },
  {
    name: "Tow Package",
    description: "Trailer hitch with integrated brake controller.",
    category: OptionCategory.PERFORMANCE,
    price: "3200",
  },
];

const SHARED_COLORS: { name: string; hexCode: string; type: ColorType; isMetallic: boolean }[] = [
  { name: "Pearl White", hexCode: "#EEEAE1", type: ColorType.EXTERIOR, isMetallic: false },
  { name: "Graphite Metallic", hexCode: "#2A2A2A", type: ColorType.EXTERIOR, isMetallic: true },
  { name: "Deep Marine", hexCode: "#1F2C3A", type: ColorType.EXTERIOR, isMetallic: true },
  { name: "Sienna Bronze", hexCode: "#B08D57", type: ColorType.EXTERIOR, isMetallic: true },
  { name: "Glacier Silver", hexCode: "#C9CCCE", type: ColorType.EXTERIOR, isMetallic: true },
  { name: "Crimson Pearl", hexCode: "#7A1F1F", type: ColorType.EXTERIOR, isMetallic: true },
  { name: "Forest Green", hexCode: "#2E4A36", type: ColorType.EXTERIOR, isMetallic: true },
  { name: "Charcoal", hexCode: "#262626", type: ColorType.INTERIOR, isMetallic: false },
  { name: "Caramel", hexCode: "#7B5430", type: ColorType.INTERIOR, isMetallic: false },
];

const MODELS: ModelSeed[] = [
  {
    slug: "meridian-1-5",
    make: "Meridian",
    name: "Meridian 1.5",
    year: 2026,
    bodyType: BodyType.SEDAN,
    description:
      "An everyday sedan with composed manners and a cabin that wears well. Built for daily Klang Valley traffic and the long quiet stretches between cities.",
    startingPrice: "96800",
    heroImage: IMG.meridianExterior,
    isFeatured: true,
    displayOrder: 1,
    highlights: [
      "Driver assist suite as standard",
      "18.2 km/L combined economy",
      "Five-year warranty, no asterisks",
      "Cabin tuned for highway quiet",
    ],
    metaTitle: "Meridian 1.5 — Composed daily sedan",
    metaDescription:
      "The Meridian 1.5 is a composed daily sedan with driver assist as standard, an honest five-year warranty, and a cabin tuned for the long road.",
    images: [
      { url: IMG.meridianExterior, alt: "Meridian 1.5 in graphite, three-quarter front", type: ImageType.EXTERIOR, order: 1 },
      { url: IMG.meridianExterior, alt: "Meridian 1.5 side profile", type: ImageType.EXTERIOR, order: 2 },
      { url: IMG.meridianExterior, alt: "Meridian 1.5 rear three-quarter", type: ImageType.EXTERIOR, order: 3 },
      { url: IMG.meridianExterior, alt: "Meridian 1.5 cabin and infotainment", type: ImageType.INTERIOR, order: 4 },
      { url: IMG.servicing, alt: "Meridian 1.5 service detail", type: ImageType.DETAIL, order: 5 },
      { url: IMG.suvOnRoad, alt: "Meridian 1.5 on a quiet country highway", type: ImageType.LIFESTYLE, order: 6 },
    ],
    trims: [
      {
        name: "Standard",
        price: "96800",
        engineSize: 1.5,
        horsepower: 121,
        torque: 145,
        transmission: Transmission.CVT,
        fuelType: FuelType.PETROL,
        drivetrain: Drivetrain.FWD,
        fuelEconomy: 18.2,
        zeroToHundred: 11.4,
        topSpeed: 185,
        seats: 5,
        doors: 4,
        cargoCapacity: 510,
        features: [
          "Forward collision warning",
          "Lane departure assist",
          "Apple CarPlay & Android Auto",
          "LED headlights",
          "Cruise control",
        ],
        displayOrder: 1,
        options: [
          { name: "Adaptive Cruise Control", isStandard: false },
          { name: "Blind-Spot Monitoring", isStandard: false },
          { name: "Wireless Charging Pad", isStandard: true },
          { name: "Heated & Ventilated Seats", isStandard: false },
        ],
      },
      {
        name: "Executive",
        price: "108400",
        engineSize: 1.5,
        horsepower: 121,
        torque: 145,
        transmission: Transmission.CVT,
        fuelType: FuelType.PETROL,
        drivetrain: Drivetrain.FWD,
        fuelEconomy: 17.8,
        zeroToHundred: 11.2,
        topSpeed: 185,
        seats: 5,
        doors: 4,
        cargoCapacity: 510,
        features: [
          "Adaptive cruise control with lane-centring",
          "Blind-spot monitoring",
          "Heated front seats",
          "Wireless phone charging",
          "Premium audio (8 speakers)",
          "Leather steering wheel",
        ],
        displayOrder: 2,
        options: [
          { name: "Adaptive Cruise Control", isStandard: true },
          { name: "Blind-Spot Monitoring", isStandard: true },
          { name: "Wireless Charging Pad", isStandard: true },
          { name: "Heated & Ventilated Seats", isStandard: true },
          { name: "Panoramic Sunroof", isStandard: false },
        ],
      },
    ],
    exteriorColorNames: ["Pearl White", "Graphite Metallic", "Deep Marine"],
    accentColor: { name: "Crimson Pearl", hex: "#7A1F1F" },
  },
  {
    slug: "aurora-suv",
    make: "Aurora",
    name: "Aurora SUV",
    year: 2026,
    bodyType: BodyType.SUV,
    description:
      "A seven-seat family SUV with a hybrid powertrain that genuinely sips, third-row seats adults can sit in, and a quiet cabin that handles a Penang weekend without complaint.",
    startingPrice: "168000",
    heroImage: IMG.auroraExterior,
    isFeatured: true,
    displayOrder: 2,
    highlights: [
      "True 7-seat layout — adults fit",
      "Hybrid range up to 950 km",
      "Eight airbags + Level 2 driver assist",
      "Quiet cabin tuned for highway long-haul",
    ],
    metaTitle: "Aurora SUV — Hybrid 7-seat family SUV",
    metaDescription:
      "The Aurora SUV is a hybrid 7-seater with a true third row, 950km range, and a quiet cabin tuned for the long road. From RM 168,000.",
    images: [
      { url: IMG.auroraExterior, alt: "Aurora SUV in graphite, low-light gallery", type: ImageType.EXTERIOR, order: 1 },
      { url: IMG.auroraExterior, alt: "Aurora SUV three-quarter front", type: ImageType.EXTERIOR, order: 2 },
      { url: IMG.auroraExterior, alt: "Aurora SUV rear three-quarter", type: ImageType.EXTERIOR, order: 3 },
      { url: IMG.auroraExterior, alt: "Aurora SUV side profile", type: ImageType.EXTERIOR, order: 4 },
      { url: IMG.auroraExterior, alt: "Aurora SUV second-row cabin", type: ImageType.INTERIOR, order: 5 },
      { url: IMG.suvOnRoad, alt: "Aurora SUV on an open dirt road at first light", type: ImageType.LIFESTYLE, order: 6 },
      { url: IMG.servicing, alt: "Aurora SUV service detail", type: ImageType.DETAIL, order: 7 },
    ],
    trims: [
      {
        name: "Comfort",
        price: "168000",
        engineSize: 2.5,
        horsepower: 215,
        torque: 240,
        transmission: Transmission.CVT,
        fuelType: FuelType.HYBRID,
        drivetrain: Drivetrain.FWD,
        fuelEconomy: 16.4,
        zeroToHundred: 8.6,
        topSpeed: 200,
        seats: 7,
        doors: 5,
        cargoCapacity: 580,
        features: [
          "Hybrid synergy drive",
          "Adaptive cruise control",
          "Blind-spot monitoring",
          "Tri-zone climate control",
          "Apple CarPlay & Android Auto",
          "LED headlights",
        ],
        displayOrder: 1,
        options: [
          { name: "Adaptive Cruise Control", isStandard: true },
          { name: "Blind-Spot Monitoring", isStandard: true },
          { name: "Heated & Ventilated Seats", isStandard: false },
          { name: "Panoramic Sunroof", isStandard: false },
        ],
      },
      {
        name: "Premium",
        price: "188000",
        engineSize: 2.5,
        horsepower: 215,
        torque: 240,
        transmission: Transmission.CVT,
        fuelType: FuelType.HYBRID,
        drivetrain: Drivetrain.AWD,
        fuelEconomy: 15.8,
        zeroToHundred: 8.2,
        topSpeed: 205,
        seats: 7,
        doors: 5,
        cargoCapacity: 580,
        features: [
          "All-wheel drive (e-AWD)",
          "Heated and ventilated front seats",
          "Panoramic sunroof",
          "360° camera system",
          "Premium audio (12 speakers)",
          "Hands-free power tailgate",
        ],
        displayOrder: 2,
        options: [
          { name: "Adaptive Cruise Control", isStandard: true },
          { name: "Blind-Spot Monitoring", isStandard: true },
          { name: "Heated & Ventilated Seats", isStandard: true },
          { name: "Panoramic Sunroof", isStandard: true },
          { name: "360° Camera System", isStandard: true },
          { name: "Premium Audio (12 Speakers)", isStandard: true },
        ],
      },
      {
        name: "Reserve",
        price: "208000",
        engineSize: 2.5,
        horsepower: 230,
        torque: 250,
        transmission: Transmission.CVT,
        fuelType: FuelType.HYBRID,
        drivetrain: Drivetrain.AWD,
        fuelEconomy: 15.2,
        zeroToHundred: 7.9,
        topSpeed: 210,
        seats: 7,
        doors: 5,
        cargoCapacity: 580,
        features: [
          "Nappa leather upholstery",
          "Head-up display",
          "Adaptive air suspension",
          "Massage front seats",
          "Acoustic-laminated side glass",
          "20\" alloy wheels",
        ],
        displayOrder: 3,
        options: [
          { name: "Adaptive Cruise Control", isStandard: true },
          { name: "Blind-Spot Monitoring", isStandard: true },
          { name: "Heated & Ventilated Seats", isStandard: true },
          { name: "Panoramic Sunroof", isStandard: true },
          { name: "360° Camera System", isStandard: true },
          { name: "Premium Audio (12 Speakers)", isStandard: true },
          { name: "Nappa Leather Upholstery", isStandard: true },
          { name: "Head-Up Display", isStandard: true },
          { name: "20\" Alloy Wheels", isStandard: true },
          { name: "Tow Package", isStandard: false },
        ],
      },
    ],
    exteriorColorNames: ["Pearl White", "Graphite Metallic", "Deep Marine"],
    accentColor: { name: "Forest Green", hex: "#2E4A36" },
  },
  {
    slug: "halcyon-cx",
    make: "Halcyon",
    name: "Halcyon CX",
    year: 2026,
    bodyType: BodyType.HATCHBACK,
    description:
      "A compact crossover sized for tight Klang Valley parking lots that doesn't make you choose between drive feel and daily comfort. Mild-hybrid efficiency, thoughtful tech, and a cabin you can live with.",
    startingPrice: "142500",
    heroImage: IMG.halcyonExterior,
    isFeatured: false,
    displayOrder: 3,
    highlights: [
      "Mild-hybrid: 17.0 km/L combined",
      "Tight 5.2m turning radius",
      "Adaptive cruise as standard",
      "Cargo area swallows a stroller plus weekly groceries",
    ],
    metaTitle: "Halcyon CX — Compact crossover with daily ease",
    metaDescription:
      "The Halcyon CX is a mild-hybrid compact crossover with adaptive cruise as standard, a tight 5.2m turning radius, and honest 17 km/L economy.",
    images: [
      { url: IMG.halcyonExterior, alt: "Halcyon CX parked in covered urban garage", type: ImageType.EXTERIOR, order: 1 },
      { url: IMG.halcyonExterior, alt: "Halcyon CX three-quarter rear", type: ImageType.EXTERIOR, order: 2 },
      { url: IMG.halcyonExterior, alt: "Halcyon CX side profile", type: ImageType.EXTERIOR, order: 3 },
      { url: IMG.halcyonExterior, alt: "Halcyon CX cabin and dashboard", type: ImageType.INTERIOR, order: 4 },
      { url: IMG.servicing, alt: "Halcyon CX detail shot", type: ImageType.DETAIL, order: 5 },
      { url: IMG.suvOnRoad, alt: "Halcyon CX on a coastal road", type: ImageType.LIFESTYLE, order: 6 },
    ],
    trims: [
      {
        name: "Active",
        price: "142500",
        engineSize: 1.5,
        horsepower: 158,
        torque: 220,
        transmission: Transmission.DCT,
        fuelType: FuelType.HYBRID,
        drivetrain: Drivetrain.FWD,
        fuelEconomy: 17.0,
        zeroToHundred: 9.4,
        topSpeed: 200,
        seats: 5,
        doors: 5,
        cargoCapacity: 460,
        features: [
          "Adaptive cruise with stop-and-go",
          "Lane-centring assist",
          "Wireless phone charging",
          "Apple CarPlay & Android Auto",
          "LED projector headlights",
        ],
        displayOrder: 1,
        options: [
          { name: "Adaptive Cruise Control", isStandard: true },
          { name: "Wireless Charging Pad", isStandard: true },
          { name: "Blind-Spot Monitoring", isStandard: true },
          { name: "Panoramic Sunroof", isStandard: false },
          { name: "20\" Alloy Wheels", isStandard: false },
        ],
      },
      {
        name: "Sport",
        price: "157000",
        engineSize: 1.5,
        horsepower: 168,
        torque: 240,
        transmission: Transmission.DCT,
        fuelType: FuelType.HYBRID,
        drivetrain: Drivetrain.FWD,
        fuelEconomy: 16.4,
        zeroToHundred: 8.7,
        topSpeed: 210,
        seats: 5,
        doors: 5,
        cargoCapacity: 460,
        features: [
          "Sport suspension",
          "Heated front seats",
          "Panoramic sunroof",
          "Head-up display",
          "20\" alloy wheels",
          "Premium audio (10 speakers)",
        ],
        displayOrder: 2,
        options: [
          { name: "Adaptive Cruise Control", isStandard: true },
          { name: "Wireless Charging Pad", isStandard: true },
          { name: "Blind-Spot Monitoring", isStandard: true },
          { name: "Panoramic Sunroof", isStandard: true },
          { name: "Sport Suspension", isStandard: true },
          { name: "20\" Alloy Wheels", isStandard: true },
          { name: "Head-Up Display", isStandard: true },
        ],
      },
    ],
    exteriorColorNames: ["Pearl White", "Graphite Metallic", "Deep Marine"],
    accentColor: { name: "Sienna Bronze", hex: "#B08D57" },
  },
  {
    slug: "lumen-ev",
    make: "Lumen",
    name: "Lumen EV",
    year: 2026,
    bodyType: BodyType.SEDAN,
    description:
      "A long-range electric sedan engineered for Malaysian conditions. Heat-tolerant battery thermal management, 11kW AC home charging, and 180kW DC fast-charge on the road.",
    startingPrice: "218000",
    heroImage: IMG.lumenExterior,
    isFeatured: true,
    displayOrder: 4,
    highlights: [
      "WLTP range: 520 km on Long Range",
      "180kW DC charging — 10–80% in 27 minutes",
      "Heat-pump cabin climate",
      "Frunk + boot total 511L",
    ],
    metaTitle: "Lumen EV — Long-range electric sedan",
    metaDescription:
      "The Lumen EV is a long-range electric sedan with 520km WLTP range, 180kW DC fast charging, and battery thermal management built for Malaysian conditions.",
    images: [
      { url: IMG.lumenExterior, alt: "Lumen EV charging at a roadside station", type: ImageType.EXTERIOR, order: 1 },
      { url: IMG.lumenExterior, alt: "Lumen EV three-quarter view", type: ImageType.EXTERIOR, order: 2 },
      { url: IMG.evCharging, alt: "Lumen EV plugged in at a fast charger", type: ImageType.EXTERIOR, order: 3 },
      { url: IMG.lumenExterior, alt: "Lumen EV minimalist cabin", type: ImageType.INTERIOR, order: 4 },
      { url: IMG.servicing, alt: "Lumen EV charging port detail", type: ImageType.DETAIL, order: 5 },
      { url: IMG.evCharging, alt: "Lumen EV roadside charging at night", type: ImageType.LIFESTYLE, order: 6 },
    ],
    trims: [
      {
        name: "Standard Range",
        price: "218000",
        engineSize: null,
        horsepower: 220,
        torque: 340,
        transmission: Transmission.AUTOMATIC,
        fuelType: FuelType.ELECTRIC,
        drivetrain: Drivetrain.RWD,
        fuelEconomy: 6.4,
        zeroToHundred: 7.1,
        topSpeed: 200,
        seats: 5,
        doors: 4,
        cargoCapacity: 511,
        features: [
          "440 km WLTP range",
          "150kW DC fast charging",
          "Heat-pump climate system",
          "12.3\" centre display",
          "Over-the-air updates",
        ],
        displayOrder: 1,
        options: [
          { name: "Adaptive Cruise Control", isStandard: true },
          { name: "Blind-Spot Monitoring", isStandard: true },
          { name: "Wireless Charging Pad", isStandard: true },
          { name: "Heated & Ventilated Seats", isStandard: false },
          { name: "Panoramic Sunroof", isStandard: false },
        ],
      },
      {
        name: "Long Range",
        price: "238000",
        engineSize: null,
        horsepower: 260,
        torque: 380,
        transmission: Transmission.AUTOMATIC,
        fuelType: FuelType.ELECTRIC,
        drivetrain: Drivetrain.RWD,
        fuelEconomy: 6.1,
        zeroToHundred: 6.4,
        topSpeed: 210,
        seats: 5,
        doors: 4,
        cargoCapacity: 511,
        features: [
          "520 km WLTP range",
          "180kW DC fast charging",
          "Heat-pump climate with cabin pre-conditioning",
          "Heated and ventilated front seats",
          "Panoramic glass roof",
          "11-speaker premium audio",
        ],
        displayOrder: 2,
        options: [
          { name: "Adaptive Cruise Control", isStandard: true },
          { name: "Blind-Spot Monitoring", isStandard: true },
          { name: "Wireless Charging Pad", isStandard: true },
          { name: "Heated & Ventilated Seats", isStandard: true },
          { name: "Panoramic Sunroof", isStandard: true },
          { name: "Premium Audio (12 Speakers)", isStandard: true },
          { name: "Head-Up Display", isStandard: false },
        ],
      },
      {
        name: "Performance",
        price: "278000",
        engineSize: null,
        horsepower: 410,
        torque: 660,
        transmission: Transmission.AUTOMATIC,
        fuelType: FuelType.ELECTRIC,
        drivetrain: Drivetrain.AWD,
        fuelEconomy: 6.8,
        zeroToHundred: 3.9,
        topSpeed: 240,
        seats: 5,
        doors: 4,
        cargoCapacity: 511,
        features: [
          "Dual-motor all-wheel drive",
          "0–100 in 3.9 seconds",
          "Adaptive air suspension",
          "Track Mode with telemetry",
          "20\" performance alloys",
          "Carbon-fibre interior accents",
        ],
        displayOrder: 3,
        options: [
          { name: "Adaptive Cruise Control", isStandard: true },
          { name: "Blind-Spot Monitoring", isStandard: true },
          { name: "Wireless Charging Pad", isStandard: true },
          { name: "Heated & Ventilated Seats", isStandard: true },
          { name: "Panoramic Sunroof", isStandard: true },
          { name: "Premium Audio (12 Speakers)", isStandard: true },
          { name: "Head-Up Display", isStandard: true },
          { name: "Sport Suspension", isStandard: true },
          { name: "20\" Alloy Wheels", isStandard: true },
          { name: "Nappa Leather Upholstery", isStandard: true },
        ],
      },
    ],
    exteriorColorNames: ["Pearl White", "Graphite Metallic", "Deep Marine"],
    accentColor: { name: "Sienna Bronze", hex: "#B08D57" },
  },
  {
    slug: "continental-gt-2026",
    make: "Continental",
    name: "Continental GT 2026",
    year: 2026,
    bodyType: BodyType.COUPE,
    description:
      "The flagship grand tourer. A 4.0L twin-turbo V8 with 48V mild-hybrid assist, hand-finished cabin, and adaptive air suspension that smooths a Genting climb into something effortless.",
    startingPrice: "488000",
    heroImage: IMG.continentalExterior,
    isFeatured: true,
    displayOrder: 5,
    highlights: [
      "4.0L twin-turbo V8 — 542 hp",
      "Hand-stitched Nappa cabin",
      "Adaptive air suspension with three drive modes",
      "Bespoke programme: 14 paint, 8 leather options",
    ],
    metaTitle: "Continental GT 2026 — Flagship grand tourer",
    metaDescription:
      "The Continental GT 2026 is our flagship grand tourer with a 542 hp twin-turbo V8, hand-stitched Nappa cabin, and adaptive air suspension.",
    images: [
      { url: IMG.continentalExterior, alt: "Continental GT in low-light studio", type: ImageType.EXTERIOR, order: 1 },
      { url: IMG.continentalExterior, alt: "Continental GT three-quarter front", type: ImageType.EXTERIOR, order: 2 },
      { url: IMG.continentalExterior, alt: "Continental GT side profile", type: ImageType.EXTERIOR, order: 3 },
      { url: IMG.continentalExterior, alt: "Continental GT rear three-quarter", type: ImageType.EXTERIOR, order: 4 },
      { url: IMG.continentalExterior, alt: "Continental GT hand-stitched cabin", type: ImageType.INTERIOR, order: 5 },
      { url: IMG.continentalExterior, alt: "Continental GT engine bay detail", type: ImageType.DETAIL, order: 6 },
      { url: IMG.suvOnRoad, alt: "Continental GT on a mountain road", type: ImageType.LIFESTYLE, order: 7 },
    ],
    trims: [
      {
        name: "GT V8",
        price: "488000",
        engineSize: 4.0,
        horsepower: 542,
        torque: 770,
        transmission: Transmission.DCT,
        fuelType: FuelType.PLUGIN_HYBRID,
        drivetrain: Drivetrain.AWD,
        fuelEconomy: 11.6,
        zeroToHundred: 4.0,
        topSpeed: 318,
        seats: 4,
        doors: 2,
        cargoCapacity: 358,
        features: [
          "Hand-stitched Nappa leather",
          "Adaptive air suspension",
          "Naim 18-speaker audio",
          "22-way adjustable seats with massage",
          "Rotating display fascia",
          "20\" forged alloys",
        ],
        displayOrder: 1,
        options: [
          { name: "Adaptive Cruise Control", isStandard: true },
          { name: "Blind-Spot Monitoring", isStandard: true },
          { name: "Heated & Ventilated Seats", isStandard: true },
          { name: "Panoramic Sunroof", isStandard: true },
          { name: "Premium Audio (12 Speakers)", isStandard: true },
          { name: "Sport Suspension", isStandard: true },
          { name: "20\" Alloy Wheels", isStandard: true },
          { name: "Nappa Leather Upholstery", isStandard: true },
          { name: "Head-Up Display", isStandard: true },
        ],
      },
      {
        name: "GT Speed",
        price: "568000",
        engineSize: 4.0,
        horsepower: 626,
        torque: 820,
        transmission: Transmission.DCT,
        fuelType: FuelType.PLUGIN_HYBRID,
        drivetrain: Drivetrain.AWD,
        fuelEconomy: 11.0,
        zeroToHundred: 3.6,
        topSpeed: 335,
        seats: 4,
        doors: 2,
        cargoCapacity: 358,
        features: [
          "Performance-tuned air suspension",
          "Carbon ceramic brakes",
          "Diamond-quilted Nappa upholstery",
          "Naim 18-speaker audio",
          "22\" forged sport alloys",
          "Akrapovič sport exhaust",
        ],
        displayOrder: 2,
        options: [
          { name: "Adaptive Cruise Control", isStandard: true },
          { name: "Blind-Spot Monitoring", isStandard: true },
          { name: "Heated & Ventilated Seats", isStandard: true },
          { name: "Panoramic Sunroof", isStandard: true },
          { name: "Premium Audio (12 Speakers)", isStandard: true },
          { name: "Sport Suspension", isStandard: true },
          { name: "20\" Alloy Wheels", isStandard: true },
          { name: "Nappa Leather Upholstery", isStandard: true },
          { name: "Head-Up Display", isStandard: true },
          { name: "360° Camera System", isStandard: true },
        ],
      },
    ],
    exteriorColorNames: ["Pearl White", "Graphite Metallic", "Deep Marine"],
    accentColor: { name: "Crimson Pearl", hex: "#7A1F1F" },
  },
];

const upchargeFor = (colorName: string): string => {
  const lower = colorName.toLowerCase();
  if (lower === "pearl white") return "0";
  if (lower.includes("metallic") || lower === "deep marine") return "1500";
  // Premium / accent / pearl finishes
  return "3500";
};

async function main(): Promise<void> {
  // Wipe global tables; cascade clears the join tables.
  await prisma.color.deleteMany();
  await prisma.option.deleteMany();

  // Wipe each model up-front so the create call below can use nested
  // create without unique-constraint conflicts. Cascade removes Trims,
  // ModelImages, OptionOnTrim, TrimColor.
  for (const md of MODELS) {
    await prisma.model.deleteMany({ where: { slug: md.slug } });
  }

  // Create global colors and options once.
  const colorsByName = new Map<string, string>();
  for (const c of SHARED_COLORS) {
    const created = await prisma.color.create({ data: c });
    colorsByName.set(c.name, created.id);
  }

  const optionsByName = new Map<string, string>();
  for (const o of SHARED_OPTIONS) {
    const created = await prisma.option.create({ data: o });
    optionsByName.set(o.name, created.id);
  }

  let trimCount = 0;
  let optionLinkCount = 0;
  let trimColorCount = 0;
  let imageCount = 0;

  for (const md of MODELS) {
    // Make sure each model's accent color exists in the colors table.
    if (!colorsByName.has(md.accentColor.name)) {
      const created = await prisma.color.create({
        data: {
          name: md.accentColor.name,
          hexCode: md.accentColor.hex,
          type: ColorType.EXTERIOR,
          isMetallic: true,
        },
      });
      colorsByName.set(md.accentColor.name, created.id);
    }

    const exteriorColorNames = [...md.exteriorColorNames, md.accentColor.name];
    const interiorColorNames = ["Charcoal", "Caramel"];

    const created = await prisma.model.create({
      data: {
        slug: md.slug,
        make: md.make,
        name: md.name,
        year: md.year,
        bodyType: md.bodyType,
        description: md.description,
        startingPrice: md.startingPrice,
        heroImage: md.heroImage,
        isFeatured: md.isFeatured,
        displayOrder: md.displayOrder,
        highlights: md.highlights,
        metaTitle: md.metaTitle,
        metaDescription: md.metaDescription,
        images: {
          create: md.images.map((img) => ({
            url: img.url,
            altText: img.alt,
            type: img.type,
            order: img.order,
          })),
        },
        trims: {
          create: md.trims.map((t) => ({
            name: t.name,
            price: t.price,
            engineSize: t.engineSize,
            horsepower: t.horsepower,
            torque: t.torque,
            transmission: t.transmission,
            fuelType: t.fuelType,
            drivetrain: t.drivetrain,
            fuelEconomy: t.fuelEconomy,
            zeroToHundred: t.zeroToHundred,
            topSpeed: t.topSpeed,
            seats: t.seats,
            doors: t.doors,
            cargoCapacity: t.cargoCapacity,
            features: t.features,
            displayOrder: t.displayOrder,
          })),
        },
      },
      include: { trims: true, images: true },
    });

    imageCount += created.images.length;
    trimCount += created.trims.length;

    // Link options and colors per trim.
    for (const trim of created.trims) {
      const seedTrim = md.trims.find((t) => t.name === trim.name);
      if (!seedTrim) continue;
      for (const opt of seedTrim.options) {
        const optionId = optionsByName.get(opt.name);
        if (!optionId) continue;
        await prisma.optionOnTrim.create({
          data: { trimId: trim.id, optionId, isStandard: opt.isStandard },
        });
        optionLinkCount += 1;
      }
      for (const colorName of [...exteriorColorNames, ...interiorColorNames]) {
        const colorId = colorsByName.get(colorName);
        if (!colorId) continue;
        await prisma.trimColor.create({
          data: {
            trimId: trim.id,
            colorId,
            upcharge: upchargeFor(colorName),
          },
        });
        trimColorCount += 1;
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seed complete — ${MODELS.length} models, ${trimCount} trims, ${imageCount} images, ${optionLinkCount} option links, ${trimColorCount} trim-color links.`,
  );
}

main()
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
