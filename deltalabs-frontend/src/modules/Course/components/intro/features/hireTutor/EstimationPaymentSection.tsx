/** ################################ COMPONENT ############################# */
/**
 * EstimationPaymentSection
 * Right column of the Hire a Tutor form: the scheduled session, the payment
 * option, and the resulting total.
 *
 * Both pickers are popovers that render only their panel, so each field supplies
 * its own trigger inside a relatively-positioned wrapper.
 *
 * @example
 * ```tsx
 * <EstimationPaymentSection {...handlers} estimatedAmount={90} sessionHours={2} />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, shared primitives, and local building blocks. */
import React from "react";

import { CalendarDays, ChevronDown } from "lucide-react";

import { PaymentOptionDropdown } from "@/components/organisms/PaymentOptionDropdown";
import { TimeSelectionModal } from "@/components/organisms/TimeSelectionModal";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { cn } from "@/lib/utils";
import type { EstimationPaymentSectionProps, PaymentOption } from "./types";
import {
  columnHeadingClasses,
  fieldStackClasses,
  popoverAnchorClasses,
  scheduleClasses,
  scheduleIconClasses,
  schedulePlaceholderClasses,
  scheduleValueClasses,
  sectionClasses,
  totalClasses,
  totalLabelClasses,
  totalValueClasses,
  triggerClasses,
} from "./variants";
/** ################################ /IMPORT ############################# */

/** Builds the text shown on the schedule trigger. */
function scheduleText(date: string, time: string): string {
  if (date === "") {
    return "Pick a date";
  }
  return time === "" ? date : `${date} at ${time}`;
}

/** Formats the estimate with a currency symbol. */
function formatAmount(amount: number, symbol: string): string {
  return `${symbol}${amount.toFixed(2)}`;
}

/** Props for {@link ScheduleField}. */
export interface ScheduleFieldProps {
  /** Chosen date, or `""`. */
  date: string;
  /** Chosen time slot, or `""`. */
  time: string;
  /** Whether the schedule popover is open. */
  isOpen: boolean;
  /** Opens the schedule popover. */
  onOpen: () => void;
  /** Closes it. */
  onClose: () => void;
  /** Chooses the date. */
  onDateSelect: (isoDate: string) => void;
  /** Chooses the time slot. */
  onTimeSelect: (time: string) => void;
}

/** The date and time picker row. */
export function ScheduleField({
  date,
  time,
  isOpen,
  onOpen,
  onClose,
  onDateSelect,
  onTimeSelect,
}: Readonly<ScheduleFieldProps>) {
  return (
    <Field id="hire-tutor-schedule" label="Estimate tutor time" labelClassName="text-xs font-semibold">
      <div className={popoverAnchorClasses}>
        <button
          type="button"
          onClick={onOpen}
          aria-label="Choose a date and time"
          aria-expanded={isOpen}
          className={cn(scheduleClasses, triggerClasses)}
        >
          <CalendarDays className={cn("size-5", scheduleIconClasses)} aria-hidden="true" />
          <span className={cn(scheduleValueClasses, date === "" && schedulePlaceholderClasses)}>
            {scheduleText(date, time)}
          </span>
          <ChevronDown className={scheduleIconClasses} aria-hidden="true" />
        </button>

        <TimeSelectionModal
          isOpen={isOpen}
          onClose={onClose}
          onSelect={onDateSelect}
          selectedDate={date === "" ? undefined : date}
          showTimeSlots
          selectedTime={time === "" ? undefined : time}
          onTimeSelect={onTimeSelect}
        />
      </div>
    </Field>
  );
}

/** Props for {@link PaymentOptionField}. */
export interface PaymentOptionFieldProps {
  /** The selected option, or `null`. */
  selected: PaymentOption | null;
  /** Options offered. */
  options: readonly PaymentOption[];
  /** Whether the popover is open. */
  isOpen: boolean;
  /** Opens the popover. */
  onOpen: () => void;
  /** Closes it. */
  onClose: () => void;
  /** Chooses an option. */
  onSelect: (option: PaymentOption) => void;
}

/** The payment method row. */
export function PaymentOptionField({
  selected,
  options,
  isOpen,
  onOpen,
  onClose,
  onSelect,
}: Readonly<PaymentOptionFieldProps>) {
  return (
    <Field id="hire-tutor-payment-option" label="Payment option" labelClassName="text-xs font-semibold">
      <div className={popoverAnchorClasses}>
        <button
          type="button"
          onClick={onOpen}
          aria-label="Choose a payment option"
          aria-expanded={isOpen}
          className={cn(scheduleClasses, triggerClasses)}
        >
          <span className={cn(scheduleValueClasses, !selected && schedulePlaceholderClasses)}>
            {selected?.name ?? "Select an option"}
          </span>
          <ChevronDown className={scheduleIconClasses} aria-hidden="true" />
        </button>

        <PaymentOptionDropdown
          isOpen={isOpen}
          onClose={onClose}
          onSelect={onSelect}
          selectedId={selected?.id}
          options={options}
        />
      </div>
    </Field>
  );
}

/** Props for {@link AmountField}. */
export interface AmountFieldProps {
  /** Typed amount. */
  value: string;
  /** Placeholder, the derived estimate. */
  placeholder: string;
  /** Validation message, or `undefined`. */
  errorMessage?: string;
  /** Updates the amount. */
  onChange: (amount: string) => void;
}

/** The editable amount row. */
export function AmountField({ value, placeholder, errorMessage, onChange }: Readonly<AmountFieldProps>) {
  return (
    <Field
      id="hire-tutor-amount"
      label="Payment amount"
      labelClassName="text-xs font-semibold"
      errorMessage={errorMessage}
    >
      <Input
        id="hire-tutor-amount"
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

/** Props for {@link EstimateTotal}. */
export interface EstimateTotalProps {
  /** Total to charge. */
  amount: number;
  /** Hours the estimate covers. */
  hours: number;
  /** Currency symbol. */
  symbol: string;
}

/** The running total, shown under the payment fields. */
export function EstimateTotal({ amount, hours, symbol }: Readonly<EstimateTotalProps>) {
  return (
    <div className={totalClasses}>
      <span className={totalLabelClasses}>Estimated total</span>
      <span className={totalValueClasses}>
        {formatAmount(amount, symbol)} · {hours}h
      </span>
    </div>
  );
}

/** The schedule, payment option, and total. */
export function EstimationPaymentSection({
  form,
  openDialog,
  onOpenDialog,
  onCloseDialog,
  onDateSelect,
  onTimeSelect,
  onPaymentOptionSelect,
  onAmountChange,
  paymentOptions,
  selectedPaymentOption,
  estimatedAmount,
  sessionHours,
  currencySymbol = "$",
}: Readonly<EstimationPaymentSectionProps>) {
  const amountError =
    form.amount !== "" && estimatedAmount === 0 ? "Enter a valid amount" : undefined;

  return (
    <section className={cn(sectionClasses)} aria-labelledby="hire-tutor-estimation-label">
      <h3 id="hire-tutor-estimation-label" className={columnHeadingClasses}>
        Session and payment
      </h3>

      <div className={fieldStackClasses}>
        <ScheduleField
          date={form.scheduledDate}
          time={form.scheduledTime}
          isOpen={openDialog === "time"}
          onOpen={() => onOpenDialog("time")}
          onClose={onCloseDialog}
          onDateSelect={onDateSelect}
          onTimeSelect={onTimeSelect}
        />

        <PaymentOptionField
          selected={selectedPaymentOption}
          options={paymentOptions}
          isOpen={openDialog === "payment"}
          onOpen={() => onOpenDialog("payment")}
          onClose={onCloseDialog}
          onSelect={onPaymentOptionSelect}
        />

        <AmountField
          value={form.amount}
          placeholder={formatAmount(estimatedAmount, currencySymbol)}
          errorMessage={amountError}
          onChange={onAmountChange}
        />

        <EstimateTotal
          amount={estimatedAmount}
          hours={sessionHours}
          symbol={currencySymbol}
        />
      </div>
    </section>
  );
}

EstimationPaymentSection.displayName = "EstimationPaymentSection";
/** ################################ /COMPONENT ############################# */
