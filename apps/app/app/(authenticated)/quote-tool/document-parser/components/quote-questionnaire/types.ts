export interface BrokerSplit {
  id: string;
  name: string;
  splitPercentage: number;
}

export interface QuoteQuestionnaireData {
  clientType: 'new' | 'existing' | null;
  opportunityType: 'renewal' | 'go-to-market' | null;
  companyName: string;
  planManagementFee: number | null;
  isJointCase: boolean | null;
  brokerSplits: BrokerSplit[];
  quoteRequestOrigin: 'internal' | 'partner-referral' | 'online-form' | 'sales-outreach' | 'other' | null;
  completedAt?: string;
}

export interface QuestionnaireStep {
  id: string;
  title: string;
  isValid: boolean;
  isCompleted: boolean;
}

export interface QuoteQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: QuoteQuestionnaireData) => void;
  isProcessingComplete: boolean;
  processingError?: string | null;
}