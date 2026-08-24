import type { QuestionCardProps } from '@/components/molecules/QuestionCard';

export interface DuplicateVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmUnique: () => void;
  similarQuestions: QuestionCardProps[];
}
