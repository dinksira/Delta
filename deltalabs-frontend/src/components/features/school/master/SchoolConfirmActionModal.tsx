"use client";

import { Button, DialogOverlay, DialogPanel, Typography } from "@/components/theme";

type SchoolConfirmActionModalProps = Readonly<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmTone?: "danger" | "primary";
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}>;

export function SchoolConfirmActionModal({
  open,
  title,
  description,
  confirmLabel,
  confirmTone = "primary",
  pending = false,
  onCancel,
  onConfirm,
}: SchoolConfirmActionModalProps) {
  if (!open) return null;

  return (
    <>
      <DialogOverlay onClose={onCancel} />
      <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
          <Typography as="h3" className="text-lg font-semibold text-text-primary">
            {title}
          </Typography>
          <Typography className="mt-2 text-sm text-text-secondary">{description}</Typography>
          <div className="mt-5 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="button"
              className={confirmTone === "danger" ? "bg-error-600 text-white hover:bg-error-700" : undefined}
              onClick={onConfirm}
              disabled={pending}
            >
              {pending ? "Please wait..." : confirmLabel}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </>
  );
}

