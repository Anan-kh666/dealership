"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { BrandButton } from "@dealership/ui/components/brand-button";
import {
  FilterDrawer,
  FilterDrawerContent,
  FilterDrawerTrigger,
} from "@dealership/ui/components/filter-drawer";
import { FilterSidebar, type FacetCounts } from "./filter-sidebar";

export function MobileFilterTrigger({
  facets,
  totalAvailable,
}: {
  facets: FacetCounts;
  totalAvailable: number;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <FilterDrawer open={open} onOpenChange={setOpen}>
      <FilterDrawerTrigger asChild>
        <BrandButton type="button" variant="ghost-dark" size="md">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </BrandButton>
      </FilterDrawerTrigger>
      <FilterDrawerContent>
        <FilterSidebar facets={facets} totalAvailable={totalAvailable} />
      </FilterDrawerContent>
    </FilterDrawer>
  );
}
