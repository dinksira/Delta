/**
 * CustomParametersModal
 * Organism: dialog for adding custom name/value parameters to a tutor request.
 *
 * Row state, validation, and the row markup live in sibling modules so this
 * file stays a thin composition over the shared `Modal`, `Field`, and `Input`.
 *
 * @example
 * ```tsx
 * <CustomParametersModal
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   onAdd={(parameters) => setCustomParameters(parameters)}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, shared primitives, and local building blocks. */
import React from "react";

import { Plus, Minus, X } from "lucide-react";

import { Modal } from "@/components/atoms/Modal/Modal";
import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import { cn } from "@/lib/utils";
import type { CustomParametersModalProps } from "./CustomParametersModal.types";
import { ParameterRow } from "./ParameterRow";
import { useParameterRows } from "./useParameterRows";
import {
  closeButtonClasses,
  contentClasses,
  controlButtonClasses,
  controlsClasses,
  controlsDividerClasses,
  dividerClasses,
  emptyClasses,
  eyebrowClasses,
  footerClasses,
  headerClasses,
  listClasses,
  removeControlButtonClasses,
  subtitleClasses,
  titleClasses,
} from "./variants";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/** Props for {@link ParametersHeader}. */
export interface ParametersHeaderProps {
  /** Adds an empty row. */
  onAddRow: () => void;
  /** Removes the last row, if any. */
  onRemoveLastRow: () => void;
  /** Whether any rows remain. */
  hasRows: boolean;
  /** Dismisses the dialog. */
  onClose: () => void;
}

/** Heading block, add/remove controls, and an explicit close button. */
function ParametersHeader({
  onAddRow,
  onRemoveLastRow,
  hasRows,
  onClose,
}: Readonly<ParametersHeaderProps>) {
  return (
    <div className={headerClasses}>
      <div>
        <Typography className={eyebrowClasses}>Custom parameters</Typography>
        <Typography className={titleClasses}>Add the details your tutor should know</Typography>
        <Typography className={subtitleClasses}>
          Optional. Each row is a name and a value, for example “Session length” and “90 minutes”.
        </Typography>
      </div>

      <div className={controlsClasses}>
        <button type="button" onClick={onAddRow} aria-label="Add a parameter row" className={controlButtonClasses}>
          <Plus className="size-5" aria-hidden="true" />
        </button>
        <span aria-hidden="true" className={controlsDividerClasses} />
        <button
          type="button"
          onClick={onRemoveLastRow}
          disabled={!hasRows}
          aria-label="Remove the last parameter row"
          className={removeControlButtonClasses}
        >
          <Minus className="size-5" aria-hidden="true" />
        </button>
        <span aria-hidden="true" className={controlsDividerClasses} />
        <button type="button" onClick={onClose} aria-label="Close dialog" className={closeButtonClasses}>
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Props for {@link ParametersFooter}. */
export interface ParametersFooterProps {
  /** Whether the current rows can be submitted. */
  canSubmit: boolean;
  /** Submits the rows and closes the dialog. */
  onSubmit: () => void;
}

/** Footer holding the single submit action. */
function ParametersFooter({ canSubmit, onSubmit }: Readonly<ParametersFooterProps>) {
  return (
    <div className={footerClasses}>
      <Button size="lg" disabled={!canSubmit} onClick={onSubmit}>
        Add parameters
      </Button>
    </div>
  );
}

/** Lets the user add arbitrary name/value parameters before sending a request. */
export function CustomParametersModal({
  isOpen,
  onClose,
  onAdd,
  ariaLabel = "Custom parameters",
  className,
}: Readonly<CustomParametersModalProps>) {
  const { rows, errors, canSubmit, addRow, removeRow, updateRow, submit } = useParameterRows();
  const lastRowId = rows.at(-1)?.id;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} ariaLabel={ariaLabel} noPadding>
      <div className={cn(contentClasses, className)}>
        <ParametersHeader
          onAddRow={addRow}
          onRemoveLastRow={() => lastRowId && removeRow(lastRowId)}
          hasRows={rows.length > 0}
          onClose={onClose}
        />

        <div className={dividerClasses} />

        {rows.length === 0 ? (
          <p className={emptyClasses}>No parameters yet. Use + to add one.</p>
        ) : (
          <div className={listClasses}>
            {rows.map((row) => (
              <ParameterRow
                key={row.id}
                row={row}
                error={errors[row.id]}
                onChange={updateRow}
                onRemove={removeRow}
              />
            ))}
          </div>
        )}

        <ParametersFooter
          canSubmit={canSubmit}
          onSubmit={() => {
            onAdd(submit());
            onClose();
          }}
        />
      </div>
    </Modal>
  );
}

CustomParametersModal.displayName = "CustomParametersModal";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default CustomParametersModal;
/** ################################ /EXPORTS ############################# */
