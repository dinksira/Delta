/** ################################ TYPES ############################# */
/** Types for the Hire a Tutor feature. */

import type { RoadmapSection, RoadmapSelection } from "@/components/organisms/RoadmapSelectionModal/RoadmapSelectionModal.types";
import type { PaymentOption } from "@/components/organisms/PaymentOptionDropdown/PaymentOptionDropdown.types";
import type { CustomParameter } from "@/components/organisms/CustomParametersModal/CustomParametersModal.types";
/** ################################ /TYPES ############################# */

/** What the user has chosen so far. */
export interface HireTutorFormState {
  /** Free-text description of what they need help with. */
  description: string;
  /** Name/value pairs added through the custom-parameters dialog. */
  customParameters: CustomParameter[];
  /** Selected roadmap section ids. */
  roadmapSectionIds: string[];
  /** Selected roadmap resource ids. */
  roadmapResourceIds: string[];
  /** Invited tutor ids. */
  tutorIds: string[];
  /** Chosen date as `yyyy-mm-dd`. */
  scheduledDate: string;
  /** Chosen time slot, e.g. `"09:00"`. */
  scheduledTime: string;
  /** Chosen payment option id. */
  paymentOptionId: string;
  /** Payment amount in the major unit, e.g. `120`. */
  amount: string;
  /** Whether the tutor should be auto-matched instead of chosen. */
  autoMatch: boolean;
}

/** Which picker dialog is open. */
export type HireTutorDialog = "parameters" | "roadmap" | "tutors" | "time" | "payment" | null;

/** Opens one of the picker dialogs. */
export type OpenHireTutorDialog = (dialog: Exclude<HireTutorDialog, null>) => void;

/** Props for {@link DescriptionSection}. */
export interface DescriptionSectionProps {
  /** The live form state. */
  form: HireTutorFormState;
  /** Currently open dialog, or `null`. */
  openDialog: HireTutorDialog;
  /** Opens one of the picker dialogs. */
  onOpenDialog: OpenHireTutorDialog;
  /** Closes the open dialog. */
  onCloseDialog: () => void;
  /** Updates the description. */
  onDescriptionChange: (description: string) => void;
  /** Stores the completed custom parameters. */
  onAddParameters: (parameters: CustomParameter[]) => void;
  /** Toggles a tutor by id. */
  onToggleTutor: (tutorId: string) => void;
  /** Applies a whole roadmap selection, replacing both id lists. */
  onApplyRoadmap: (selection: RoadmapSelection) => void;
  /** Toggles a roadmap section by id. */
  onToggleRoadmapSection: (sectionId: string) => void;
  /** Toggles a roadmap resource by id. */
  onToggleRoadmapResource: (resourceId: string) => void;
  /** Replaces the invited tutor ids when the tutor dialog is confirmed. */
  onConfirmTutors: (tutorIds: string[]) => void;
  /** Toggles auto-match. */
  onAutoMatchChange: (autoMatch: boolean) => void;
}

/** Props for {@link EstimationPaymentSection}. */
export interface EstimationPaymentSectionProps {
  /** The live form state. */
  form: HireTutorFormState;
  /** Currently open dialog, or `null`. */
  openDialog: HireTutorDialog;
  /** Opens one of the picker dialogs. */
  onOpenDialog: OpenHireTutorDialog;
  /** Closes the open dialog. */
  onCloseDialog: () => void;
  /** Chooses the date. */
  onDateSelect: (isoDate: string) => void;
  /** Chooses the time slot. */
  onTimeSelect: (time: string) => void;
  /** Chooses the payment option. */
  onPaymentOptionSelect: (option: PaymentOption) => void;
  /** Updates the typed amount. */
  onAmountChange: (amount: string) => void;
  /** Options offered in the payment picker. */
  paymentOptions: readonly PaymentOption[];
  /** The currently selected payment option, or `null`. */
  selectedPaymentOption: PaymentOption | null;
  /** Total to charge, derived from the amount or the rate. */
  estimatedAmount: number;
  /** Hours the estimate is based on. */
  sessionHours: number;
  /** Currency symbol shown next to the amount. */
  currencySymbol?: string;
}

/** Props for {@link HireTutorLayout}. */
export interface HireTutorLayoutProps {
  /** Heading shown above the form. */
  title?: string;
  /** Supporting copy under the heading. */
  description?: string;
  /** The left-hand description column. */
  descriptionSection: React.ReactNode;
  /** The right-hand estimation and payment column. */
  estimationSection: React.ReactNode;
  /** Footer actions, usually the submit button. */
  footer?: React.ReactNode;
  /** Extra classes merged onto the section wrapper. */
  className?: string;
}

export type { PaymentOption, CustomParameter, RoadmapSection, RoadmapSelection };
