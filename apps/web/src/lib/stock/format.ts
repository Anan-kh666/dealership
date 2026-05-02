import { BodyType, FuelType, type StockStatus } from "@dealership/db";

export function formatBodyType(b: BodyType): string {
  switch (b) {
    case BodyType.SEDAN:
      return "Sedan";
    case BodyType.SUV:
      return "Family SUV";
    case BodyType.HATCHBACK:
      return "Crossover";
    case BodyType.COUPE:
      return "Coupe";
    case BodyType.CONVERTIBLE:
      return "Convertible";
    case BodyType.TRUCK:
      return "Truck";
    case BodyType.VAN:
      return "Van";
    case BodyType.WAGON:
      return "Wagon";
    default:
      return b;
  }
}

export function formatFuel(f: FuelType): string {
  switch (f) {
    case FuelType.PETROL:
      return "Petrol";
    case FuelType.DIESEL:
      return "Diesel";
    case FuelType.HYBRID:
      return "Hybrid";
    case FuelType.PLUGIN_HYBRID:
      return "Plug-in Hybrid";
    case FuelType.ELECTRIC:
      return "Electric";
    default:
      return f;
  }
}

/** Stable slug used in URLs for color filter values. */
export function colorSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function statusToCardBadge(
  status: StockStatus,
): "available" | "in-transit" | "arriving-soon" {
  switch (status) {
    case "AVAILABLE":
      return "available";
    case "IN_TRANSIT":
      return "in-transit";
    case "RESERVED":
    case "SOLD":
    default:
      return "arriving-soon";
  }
}

export function daysUntil(date: Date | null | undefined): number | undefined {
  if (!date) return undefined;
  const ms = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
