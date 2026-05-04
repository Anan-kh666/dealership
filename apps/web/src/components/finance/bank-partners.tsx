import * as React from "react";

interface BankPartner {
  slug: string;
  name: string;
}

const bankPartners: BankPartner[] = [
  { slug: "maybank", name: "Maybank" },
  { slug: "cimb", name: "CIMB Bank" },
  { slug: "public-bank", name: "Public Bank" },
  { slug: "rhb", name: "RHB Bank" },
  { slug: "hong-leong", name: "Hong Leong Bank" },
  { slug: "ambank", name: "AmBank" },
];

export function BankPartners(): React.ReactElement {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {bankPartners.map((bank) => (
        <li
          key={bank.slug}
          className="flex aspect-[3/2] items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-white p-4 text-center"
        >
          {/* TODO: replace with licensed logo asset at /logos/banks/{bank.slug}.svg */}
          <span className="font-[family-name:var(--font-display)] text-base tracking-[-0.01em] text-[var(--color-graphite)] sm:text-lg">
            {bank.name}
          </span>
        </li>
      ))}
    </ul>
  );
}
