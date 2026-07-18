"use client";

import { Accordion } from "@base-ui/react/accordion";
import { useBundleStore, useCatalog } from "../../store/bundle-store-provider";
import { StepItem } from "./step-item";

export function BuilderAccordion() {
  const openStep = useBundleStore((s) => s.openStep);
  const setOpenStep = useBundleStore((s) => s.setOpenStep);
  const catalog = useCatalog();

  return (
    <Accordion.Root
      // Controlled off the store. Base UI speaks in arrays even in single-open mode,
      // so the whole mapping is: null -> [], n -> [n], and back out again.
      value={openStep === null ? [] : [openStep]}
      onValueChange={(value) => setOpenStep(value[0] ?? null)}
      className="flex flex-col"
    >
      {catalog.map((category, i) => (
        <StepItem
          key={category.id}
          category={category}
          nextCategory={catalog[i + 1]}
        />
      ))}
    </Accordion.Root>
  );
}
