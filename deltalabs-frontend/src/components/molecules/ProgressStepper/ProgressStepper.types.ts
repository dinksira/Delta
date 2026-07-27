export interface ProgressStepperProps {
  steps: {
    id: string;
    label: string;
    description?: string;
  }[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
}
