export interface BrokerSplit {
  id: string;
  name: string;
  splitPercentage: number;
}

export interface QuoteQuestionnaireData {
  clientType: 'new' | 'existing' | null;
  opportunityType: 'renewal' | 'gtm' | null;
  companyName: string;
  planManagementFee: number | null;
  isJointCase: boolean | null;
  brokerSplits: BrokerSplit[];
  quoteRequestOrigin: 'paid-advertising' | 'organic-inbound' | 'outbound-direct' | 'referrals-partnerships' | 'authority-building' | 'events-workshops' | null;
  quoteRequestOriginSubcategory?: string | null;
  includesHSA: boolean | null;
  hsaCarrierName: string;
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