import type { QuoteQuestionnaireData, BrokerSplit } from '../types';

export const validateCompanyName = (name: string): string | null => {
  if (!name.trim()) {
    return 'Company name is required';
  }
  if (name.trim().length < 2) {
    return 'Company name must be at least 2 characters';
  }
  if (name.trim().length > 100) {
    return 'Company name must be less than 100 characters';
  }
  return null;
};

export const validatePlanManagementFee = (fee: number | null): string | null => {
  if (fee === null || fee === undefined) {
    return 'Plan management fee is required';
  }
  if (fee < 0) {
    return 'Plan management fee cannot be negative';
  }
  if (fee > 100) {
    return 'Plan management fee cannot exceed 100%';
  }
  return null;
};

export const validateBrokerSplits = (splits: BrokerSplit[]): string | null => {
  if (splits.length === 0) {
    return 'At least one broker is required for joint cases';
  }

  // Check for empty names
  const emptyNames = splits.some(split => !split.name.trim());
  if (emptyNames) {
    return 'All broker names are required';
  }

  // Check for duplicate names
  const names = splits.map(split => split.name.trim().toLowerCase());
  const uniqueNames = new Set(names);
  if (names.length !== uniqueNames.size) {
    return 'Broker names must be unique';
  }

  // Check total percentage
  const totalPercentage = splits.reduce((sum, split) => sum + split.splitPercentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) { // Allow for small floating point errors
    return 'Broker split percentages must total exactly 100%';
  }

  // Check individual percentages
  const invalidPercentages = splits.some(split => split.splitPercentage <= 0 || split.splitPercentage > 100);
  if (invalidPercentages) {
    return 'Each broker split percentage must be between 0.01% and 100%';
  }

  return null;
};

export const validateStep = (step: number, data: QuoteQuestionnaireData): boolean => {
  switch (step) {
    case 1: // Client Type
      return data.clientType !== null;
    
    case 2: // Opportunity Type
      return data.opportunityType !== null;
    
    case 3: // Company Details
      return validateCompanyName(data.companyName) === null && 
             validatePlanManagementFee(data.planManagementFee) === null;
    
    case 4: // Joint Case
      if (data.isJointCase === null) return false;
      if (data.isJointCase === true) {
        return validateBrokerSplits(data.brokerSplits) === null;
      }
      return true;
    
    case 5: // Quote Origin
      return data.quoteRequestOrigin !== null;
    
    default:
      return false;
  }
};

export const getCompletedSteps = (data: QuoteQuestionnaireData): number[] => {
  const completed: number[] = [];
  
  for (let i = 1; i <= 5; i++) {
    if (validateStep(i, data)) {
      completed.push(i);
    }
  }
  
  return completed;
};

export const isQuestionnaireComplete = (data: QuoteQuestionnaireData): boolean => {
  return getCompletedSteps(data).length === 5;
};