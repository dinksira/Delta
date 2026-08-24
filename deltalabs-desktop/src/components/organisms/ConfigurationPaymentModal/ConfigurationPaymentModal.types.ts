export interface ConfigurationPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: QuestionConfiguration) => void;
}

export interface QuestionConfiguration {
  isAnonymous: boolean;
  identity: 'person' | 'school';
  isPaid: boolean;
  bountyAmount?: number;
  paymentMethodId?: string;
}
