import { Hero } from "@/components/home/hero";
import { Lineup } from "@/components/home/lineup";
import { FindMatch } from "@/components/home/find-match";
import { AvailableNow } from "@/components/home/available-now";
import { Financing } from "@/components/home/financing";
import { TrustStrip } from "@/components/home/trust-strip";
import { BlogTeaser } from "@/components/home/blog-teaser";

export default function HomePage(): React.ReactElement {
  return (
    <>
      <Hero />
      <Lineup />
      <FindMatch />
      <AvailableNow />
      <Financing />
      <TrustStrip />
      <BlogTeaser />
    </>
  );
}
