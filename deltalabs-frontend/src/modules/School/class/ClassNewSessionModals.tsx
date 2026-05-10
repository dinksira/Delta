"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { Presentation, X } from "lucide-react";
import { createPortal } from "react-dom";

import { Button, DialogOverlay, DialogPanel } from "@/components/theme";
import type { ClassSessionDto, ClassSessionTypeDto } from "@/modules/School/api";

type CreateSessionMutation = UseMutationResult<ClassSessionDto, Error, void>;

export type ClassNewSessionFormState = Readonly<{
  formTitle: string;
  setFormTitle: (v: string) => void;
  formWeight: string;
  setFormWeight: (v: string) => void;
  formDescription: string;
  setFormDescription: (v: string) => void;
  formDuration: string;
  setFormDuration: (v: string) => void;
  formSessionType: ClassSessionTypeDto;
  setFormSessionType: (v: ClassSessionTypeDto) => void;
  formScheduledAt: string;
  setFormScheduledAt: (v: string) => void;
  formError: string | null;
}>;

export function ClassNewSessionModals({
  formOpen,
  onCloseForm,
  form,
  createSessionMutation,
  onSubmitCreate,
}: Readonly<{
  formOpen: boolean;
  onCloseForm: () => void;
  form: ClassNewSessionFormState;
  createSessionMutation: CreateSessionMutation;
  onSubmitCreate: () => void;
}>) {
  if (!formOpen || typeof document === "undefined") return null;

  return createPortal(
    <>
      <DialogOverlay onClick={() => !createSessionMutation.isPending && onCloseForm()} />
      <div className="fixed inset-0 z-[1310] flex items-center justify-center overflow-y-auto p-4 py-10">
        <DialogPanel className="w-full max-w-xl px-5 py-4 sm:px-7 sm:py-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-800">
              <Presentation className="size-5" aria-hidden />
            </span>
            <h3 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">New Session</h3>
            <button
              type="button"
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary hover:bg-surface-muted"
              onClick={() => !createSessionMutation.isPending && onCloseForm()}
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-text-primary">Session Name</span>
              <input
                value={form.formTitle}
                onChange={(e) => form.setFormTitle(e.target.value)}
                className="h-11 w-full rounded-md border border-border-default bg-surface-default px-3 text-sm text-text-primary outline-none focus:border-primary-400"
                placeholder="Introduction Session"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-text-primary">Session Weight</span>
              <input
                value={form.formWeight}
                onChange={(e) => form.setFormWeight(e.target.value)}
                className="h-11 w-full rounded-md border border-border-default bg-surface-default px-3 text-sm text-text-primary outline-none focus:border-primary-400"
                placeholder="e.g. 10"
                inputMode="decimal"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-text-primary">Session Duration (min)</span>
              <input
                value={form.formDuration}
                onChange={(e) => form.setFormDuration(e.target.value)}
                className="h-11 w-full rounded-md border border-border-default bg-surface-default px-3 text-sm text-text-primary outline-none focus:border-primary-400"
                placeholder="20"
                inputMode="numeric"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-text-primary">Scheduled start</span>
              <input
                type="datetime-local"
                value={form.formScheduledAt}
                onChange={(e) => form.setFormScheduledAt(e.target.value)}
                className="h-11 w-full rounded-md border border-border-default bg-surface-default px-3 text-sm text-text-primary outline-none focus:border-primary-400"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-text-primary">Session Description</span>
              <textarea
                value={form.formDescription}
                onChange={(e) => form.setFormDescription(e.target.value)}
                rows={4}
                className="w-full resize-y rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-400"
                placeholder="Notes for instructors and students"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-text-primary">Session Type</span>
              <select
                value={form.formSessionType}
                onChange={(e) => form.setFormSessionType(e.target.value as ClassSessionTypeDto)}
                className="h-11 w-full rounded-md border border-border-default bg-surface-default px-3 text-sm text-text-primary outline-none focus:border-primary-400"
              >
                <option value="virtual">Virtual</option>
                <option value="in_person">In person</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
          </div>
          {form.formError ? <p className="mt-3 text-sm text-red-600">{form.formError}</p> : null}
          <div className="mt-7 flex items-center justify-end gap-3 border-t border-border-default pt-4">
            <Button
              type="button"
              variant="secondary"
              className="min-w-[6.5rem]"
              onClick={() => !createSessionMutation.isPending && onCloseForm()}
              disabled={createSessionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="min-w-[6.5rem]"
              onClick={onSubmitCreate}
              disabled={createSessionMutation.isPending}
            >
              {createSessionMutation.isPending ? "Saving…" : "Done"}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </>,
    document.body,
  );
}
