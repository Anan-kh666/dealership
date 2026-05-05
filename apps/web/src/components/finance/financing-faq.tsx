"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@dealership/ui/components/accordion";

const faqs: { q: string; a: string }[] = [
  {
    q: "Am I eligible for car financing?",
    a: "Most banks require Malaysian citizens or permanent residents aged 18–65 with a steady monthly income — typically a minimum of RM 2,000 for hire-purchase loans. Foreign nationals can also apply, usually with a higher down payment and a Malaysian guarantor.",
  },
  {
    q: "What documents will I need?",
    a: "You'll usually need a copy of your IC (front and back), the latest 3 months of payslips, and the latest 3 months of bank statements. Self-employed applicants should also prepare an SSM/business registration extract and the last two years of EA forms or BE forms.",
  },
  {
    q: "How long does approval take?",
    a: "Indicative offers typically come back within 1–3 business days once we've sent your application to our partner banks. Final approval and the bank's letter of offer usually follow within 5–7 business days, assuming all documents are in order.",
  },
  {
    q: "Can I apply with a joint applicant?",
    a: "Yes. Adding a joint applicant — usually a spouse or close family member — can improve your debt service ratio and increase the loan amount you qualify for. We'll request the joint applicant's documents alongside your own at the document-collection step.",
  },
  {
    q: "Can I refinance an existing car loan with you?",
    a: "We help customers explore refinancing options when there's a clear benefit (lower monthly payment or shorter remaining tenure). Send us your existing loan account number and we'll review what's available across our partner banks.",
  },
];

export function FinancingFaq(): React.ReactElement {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((f, i) => (
        <AccordionItem key={f.q} value={`item-${i}`}>
          <AccordionTrigger>{f.q}</AccordionTrigger>
          <AccordionContent>
            <p className="max-w-2xl text-base leading-relaxed text-[var(--color-neutral-700)]">
              {f.a}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
