import {
  Award,
  Battery,
  Compass,
  Gauge,
  Leaf,
  Shield,
  Snowflake,
  Sparkles,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

export function pickHighlightIcon(text: string): LucideIcon {
  const t = text.toLowerCase();
  if (/(safety|airbag|assist|warranty|secure|crash)/.test(t)) return Shield;
  if (/(electric|kw|range|charging|battery)/.test(t)) return Battery;
  if (/(performance|hp|horsepower|0\s*[-–]\s*100|sport|track|turbo)/.test(t)) return Zap;
  if (/(connect|wireless|tech|carplay|android|infotain|app|ota)/.test(t)) return Wifi;
  if (/(km\/l|hybrid|economy|efficien|consumption|fuel)/.test(t)) return Leaf;
  if (/(gauge|speed)/.test(t)) return Gauge;
  if (/(climate|cabin|quiet|comfort|seat)/.test(t)) return Snowflake;
  if (/(navigation|gps|map|road)/.test(t)) return Compass;
  if (/(craft|premium|hand|stitch|leather|heritage|finish|paint|bespoke|nappa)/.test(t))
    return Sparkles;
  return Award;
}
