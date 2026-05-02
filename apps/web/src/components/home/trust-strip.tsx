import { Award, ShieldCheck, Star, Wrench } from "lucide-react";
import { Container } from "@dealership/ui/components/container";

const ITEMS = [
  { icon: ShieldCheck, label: "Authorised Dealer" },
  { icon: Award, label: "25 Years Established" },
  { icon: Star, label: "4.8 Google Rating" },
  { icon: Wrench, label: "After-Sales Service" },
] as const;

export function TrustStrip(): React.ReactElement {
  return (
    <section className="border-y border-[var(--color-neutral-200)] py-16">
      <Container>
        <ul className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {ITEMS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex flex-col items-center gap-3 text-center">
              <Icon className="h-8 w-8 text-[var(--color-accent)]" strokeWidth={1.5} />
              <span className="text-sm text-[var(--color-neutral-700)]">{label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
