/**
 * RoadmapSelectionModal
 * Organism: dialog for picking roadmap sections and their resources.
 *
 * Fully data-driven. The previous version hardcoded two sections, three
 * resources, and their ids in JSX, duplicated the resource card markup three
 * times, and drew its progress spine with fixed `top`/`bottom` offsets.
 *
 * @example
 * ```tsx
 * <RoadmapSelectionModal
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   sections={sections}
 *   selectedSectionIds={sectionIds}
 *   selectedResourceIds={resourceIds}
 *   onToggleSection={toggleSection}
 *   onToggleResource={toggleResource}
 *   onConfirm={({ sectionIds, resourceIds }) => applySelection(sectionIds, resourceIds)}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, shared primitives, and local building blocks. */
import React, { useMemo } from "react";

import { Modal } from "@/components/atoms/Modal/Modal";
import { Button } from "@/components/theme/Button";
import { cn } from "@/lib/utils";
import type { RoadmapSelectionModalProps } from "./RoadmapSelectionModal.types";
import { RoadmapSectionBlock } from "./RoadmapSectionBlock";
import { contentClasses, emptyClasses, footerClasses, listClasses, modalClasses } from "./variants";
/** ################################ /IMPORT ############################# */

/** ################################ HOOK ############################# */
/**
 * Works out which sections count as "reached" for spine tinting: a section is
 * reached once it, or any section before it, is selected.
 */
function useReachedSections(sections: readonly { id: string }[], selectedSectionIds: ReadonlySet<string>) {
  return useMemo(() => {
    const reached = new Set<string>();
    let found = false;
    for (const section of sections) {
      if (selectedSectionIds.has(section.id)) {
        found = true;
      }
      if (found) {
        reached.add(section.id);
      }
    }
    return reached;
  }, [sections, selectedSectionIds]);
}
/** ################################ /HOOK ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/** Props for {@link RoadmapFooter}. */
export interface RoadmapFooterProps {
  /** Combined number of selected sections and resources. */
  totalSelected: number;
  /** Applies the selection and closes the dialog. */
  onConfirm: () => void;
}

/** Fixed footer holding the single confirm action. */
function RoadmapFooter({ totalSelected, onConfirm }: Readonly<RoadmapFooterProps>) {
  return (
    <div className={footerClasses}>
      <Button size="lg" onClick={onConfirm}>
        Done{totalSelected > 0 ? ` (${totalSelected})` : ""}
      </Button>
    </div>
  );
}

/** Lets the user pick roadmap sections and the resources inside them. */
export function RoadmapSelectionModal({
  isOpen,
  onClose,
  sections,
  selectedSectionIds = [],
  selectedResourceIds = [],
  onToggleSection,
  onToggleResource,
  onConfirm,
  emptyMessage = "This roadmap has no sections yet.",
  className,
}: Readonly<RoadmapSelectionModalProps>) {
  const sectionSet = useMemo(() => new Set(selectedSectionIds), [selectedSectionIds]);
  const resourceSet = useMemo(() => new Set(selectedResourceIds), [selectedResourceIds]);
  const reached = useReachedSections(sections, sectionSet);
  const totalSelected = sectionSet.size + resourceSet.size;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} noPadding ariaLabel="Select roadmap items" className={modalClasses}>
      <div className={cn(contentClasses, className)}>
        {sections.length === 0 ? (
          <p className={emptyClasses}>{emptyMessage}</p>
        ) : (
          <ol className={listClasses}>
            {sections.map((section) => (
              <RoadmapSectionBlock
                key={section.id}
                section={section}
                isSelected={sectionSet.has(section.id)}
                isReached={reached.has(section.id)}
                selectedResourceIds={resourceSet}
                onToggleSection={(id) => onToggleSection?.(id)}
                onToggleResource={(id) => onToggleResource?.(id)}
              />
            ))}
          </ol>
        )}

        <RoadmapFooter
          totalSelected={totalSelected}
          onConfirm={() => {
            onConfirm?.({ sectionIds: [...sectionSet], resourceIds: [...resourceSet] });
            onClose();
          }}
        />
      </div>
    </Modal>
  );
}

RoadmapSelectionModal.displayName = "RoadmapSelectionModal";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default RoadmapSelectionModal;
/** ################################ /EXPORTS ############################# */
