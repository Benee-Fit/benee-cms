import type { FormFieldConfig } from '@/lib/types/enrolment';
import { z } from 'zod';

export const questionnaireFields: FormFieldConfig<any>[] = [
  // Section: Member Information
  {
    id: 'sectionMemberInfo',
    label: 'Member Information',
    type: 'section',
    validation: z.any(),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'firstName',
    label: 'First Name',
    type: 'text',
    placeholder: 'e.g., Jane',
    validation: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'lastName',
    label: 'Last Name',
    type: 'text',
    placeholder: 'e.g., Doe',
    validation: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'personalPhone',
    label: 'Personal Phone Number',
    type: 'tel',
    placeholder: 'e.g., 555-123-4567',
    validation: z.string().min(10, 'Please enter a valid phone number'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'workEmail',
    label: 'Work Email',
    type: 'email',
    placeholder: 'e.g., jane.doe@company.com',
    validation: z.string().email('Invalid email address'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'personalEmail',
    label: 'Personal Email',
    type: 'email',
    placeholder: 'e.g., jane.doe@example.com',
    validation: z.string().email('Invalid email address'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'streetAddress',
    label: 'Street Address',
    type: 'text',
    placeholder: 'e.g., 123 Main St',
    validation: z.string().min(1, 'Street address is required'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'city',
    label: 'City',
    type: 'text',
    placeholder: 'e.g., Toronto',
    validation: z.string().min(1, 'City is required'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'province',
    label: 'Province',
    type: 'select',
    options: [
      'Alberta',
      'British Columbia',
      'Manitoba',
      'New Brunswick',
      'Newfoundland and Labrador',
      'Northwest Territories',
      'Nova Scotia',
      'Nunavut',
      'Ontario',
      'Prince Edward Island',
      'Quebec',
      'Saskatchewan',
      'Yukon'
    ],
    validation: z.string().min(1, 'Province/Territory is required'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'postalCode',
    label: 'Postal Code',
    type: 'text',
    placeholder: 'e.g., A1B 2C3',
    validation: z.string().min(6, 'Please enter a valid postal code').max(7, 'Please enter a valid postal code'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'dateOfBirth',
    label: 'Date of Birth',
    type: 'date',
    validation: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date',
    }),
    defaultValue: '',
    wrapperClass: '',
  },
  {
    id: 'gender',
    label: 'Gender',
    type: 'select',
    options: ['Male', 'Female', 'Prefer not to say'],
    validation: z.string().min(1, 'Please select a gender'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'maritalStatus',
    label: 'Are you married or in a common-law relationship?',
    type: 'select',
    options: ['Single', 'Married', 'Common-law', 'Separated', 'Divorced', 'Widowed'],
    validation: z.string().min(1, 'Please select your marital status'),
    defaultValue: 'Single',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'cohabitationDate',
    label: 'Date of common-law cohabitation',
    type: 'date',
    validation: z.string().optional(),
    defaultValue: '',
    conditionalDisplay: { field: 'maritalStatus', value: 'Common-law' },
    wrapperClass: 'md:col-span-2',
  },
  
  // Spouse Information
  {
    id: 'sectionSpouse',
    label: 'Spouse Information (if applicable)',
    type: 'section',
    validation: z.any(),
    defaultValue: '',
    conditionalDisplay: [
      { field: 'maritalStatus', value: 'Married' },
    ],
    wrapperClass: '',
  },
  {
    id: 'spouseFirstName',
    label: 'Spouse First Name',
    type: 'text',
    placeholder: 'e.g., Jane',
    validation: z.string().optional(),
    defaultValue: '',
    conditionalDisplay: [
      { field: 'maritalStatus', value: 'Married' },
    ],
    wrapperClass: '',
  },

  {
    id: 'spouseLastName',
    label: 'Spouse Last Name',
    type: 'text',
    placeholder: 'e.g., Doe',
    validation: z.string().optional(),
    defaultValue: '',
    conditionalDisplay: [
      { field: 'maritalStatus', value: 'Married' },
    ],
    wrapperClass: '',
  },
  {
    id: 'spouseGender',
    label: 'Spouse Gender',
    type: 'select',
    options: ['Male', 'Female', 'Prefer not to say'],
    validation: z.string().optional(),
    defaultValue: '',
    conditionalDisplay: [
      { field: 'maritalStatus', value: 'Married' },
    ],
    wrapperClass: '',
  },
  {
    id: 'spouseDateOfBirth',
    label: 'Spouse Date of Birth',
    type: 'date',
    validation: z.string().optional(),
    defaultValue: '',
    conditionalDisplay: [
      { field: 'maritalStatus', value: 'Married' },
    ],
    wrapperClass: '',
  },
  {
    id: 'spouseRelationship',
    label: 'Relationship to Member',
    type: 'select',
    options: ['Spouse', 'Common-law Partner'],
    validation: z.string().optional(),
    defaultValue: '',
    conditionalDisplay: [
      { field: 'maritalStatus', value: 'Married' },
    ],
    wrapperClass: 'md:col-span-2',
  },

  /*
    conditionalDisplay: [
      { field: 'maritalStatus', value: 'Married', operator: 'OR' },
      { field: 'maritalStatus', value: 'Common-law' }
    ],  
  */
  
  // Section: Dependent Information
  {
    id: 'sectionDependents',
    label: 'Dependent Information (if applicable)',
    type: 'section',
    validation: z.any(),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },

  {
    id: 'dependents',
    label: 'Dependents',
    type: 'repeater',
    validation: z.array(z.any()),
    defaultValue: [] as any,
    maxItems: 4,
    templateFields: ['dependentFirstName', 'dependentLastName', 'dependentGender', 'dependentDateOfBirth', 'dependentRelationship'],
    labelVisible: false,
    conditionalDisplay: [
      { field: 'maritalStatus', value: 'Married', operator: 'OR' },
      { field: 'maritalStatus', value: 'Common-law', operator: 'OR' },
      { field: 'maritalStatus', value: 'Widowed', operator: 'OR' },
      { field: 'maritalStatus', value: 'Divorced', operator: 'OR' },
      { field: 'maritalStatus', value: 'Separated' },
    ],
    wrapperClass: 'md:col-span-2',
  },
  

  
  // Section: Beneficiary Designation
  {
    id: 'sectionBeneficiaries',
    label: 'Beneficiary Designation',
    type: 'section',
    validation: z.any(),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },

  
  {
    id: 'beneficiaries',
    label: 'Beneficiaries',
    type: 'repeater',
    validation: z.array(z.any()),
    defaultValue: [] as any,
    maxItems: 3,
    templateFields: ['name', 'relationship', 'percentage', 'dateOfBirth'],
    labelVisible: false,
    conditionalDisplay: [
      { field: 'maritalStatus', value: 'Married', operator: 'OR' },
      { field: 'maritalStatus', value: 'Common-law', operator: 'OR' },
      { field: 'maritalStatus', value: 'Widowed', operator: 'OR' },
      { field: 'maritalStatus', value: 'Divorced', operator: 'OR' },
      { field: 'maritalStatus', value: 'Separated' },
    ],    
    wrapperClass: 'md:col-span-2',
  },
  
  // Beneficiary Section Header
  {
    id: 'sectionBeneficiaries',
    label: 'Beneficiary Designation',
    type: 'section',
    validation: z.any(),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'beneficiaryInstructions',
    label: 'Instructions',
    type: 'section',
    validation: z.any(),
    defaultValue: 'Designate who will receive your benefits in the event of your death. The total percentage allocation across all beneficiaries must equal 100%.',
    labelVisible: true,
    wrapperClass: '',
  },
  
  // Quebec Residents
  {
    id: 'isQuebecResident',
    label: 'Are you a Quebec resident?',
    type: 'select',
    options: ['Yes', 'No'],
    validation: z.string().optional(),
    defaultValue: 'No',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'spouseBeneficiaryDesignation',
    label: 'If your spouse is designated as a beneficiary, is this designation revocable or irrevocable?',
    type: 'select',
    options: [
      { label: 'Revocable', value: 'revocable' },
      { label: 'Irrevocable', value: 'irrevocable' },
    ],
    validation: z.string().optional(),
    defaultValue: '',
    conditionalDisplay: [
      { field: 'maritalStatus', value: 'Married', operator: 'OR' },
      { field: 'maritalStatus', value: 'Common-law', operator: 'AND' },
      { field: 'province', value: 'Quebec' },
    ],
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
  },
  
  // Trustee Declaration
  {
    id: 'haveTrustee',
    label: 'Are you naming a trustee  ?',
    type: 'select',
    options: ['Yes', 'No'],
    validation: z.string().optional(),
    defaultValue: 'No',
    labelVisible: true,
    conditionalDisplay: [
      { field: 'province', value: 'Alberta', operator: 'OR' },
      { field: 'province', value: 'British Columbia', operator: 'OR' },
      { field: 'province', value: 'Manitoba', operator: 'OR' },
      { field: 'province', value: 'New Brunswick', operator: 'OR' },
      { field: 'province', value: 'Newfoundland and Labrador', operator: 'OR' },
      { field: 'province', value: 'Northwest Territories', operator: 'OR' },
      { field: 'province', value: 'Nova Scotia', operator: 'OR' },
      { field: 'province', value: 'Nunavut', operator: 'OR' },
      { field: 'province', value: 'Ontario', operator: 'OR' },
      { field: 'province', value: 'Prince Edward Island', operator: 'OR' },
      { field: 'province', value: 'Saskatchewan', operator: 'OR' },
      { field: 'province', value: 'Yukon'},
    ],    
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'trusteeName',
    label: 'Trustee Name',
    type: 'text',
    placeholder: 'e.g., Sarah Smith',
    validation: z.string().optional(),
    defaultValue: '',
    conditionalDisplay: [
      { field: 'province', value: 'Alberta', operator: 'OR' },
      { field: 'province', value: 'British Columbia', operator: 'OR' },
      { field: 'province', value: 'Manitoba', operator: 'OR' },
      { field: 'province', value: 'New Brunswick', operator: 'OR' },
      { field: 'province', value: 'Newfoundland and Labrador', operator: 'OR' },
      { field: 'province', value: 'Northwest Territories', operator: 'OR' },
      { field: 'province', value: 'Nova Scotia', operator: 'OR' },
      { field: 'province', value: 'Nunavut', operator: 'OR' },
      { field: 'province', value: 'Ontario', operator: 'OR' },
      { field: 'province', value: 'Prince Edward Island', operator: 'OR' },
      { field: 'province', value: 'Saskatchewan', operator: 'OR' },
      { field: 'province', value: 'Yukon', operator: 'AND' }, 
      { field: 'haveTrustee', value: 'Yes'}, 
    ],
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'trusteeAddress',
    label: 'Trustee Address',
    type: 'text',
    placeholder: 'e.g., 123 Main St, Toronto, ON A1B 2C3',
    validation: z.string().optional(),
    defaultValue: '',
    conditionalDisplay: [
      { field: 'province', value: 'Alberta', operator: 'OR' },
      { field: 'province', value: 'British Columbia', operator: 'OR' },
      { field: 'province', value: 'Manitoba', operator: 'OR' },
      { field: 'province', value: 'New Brunswick', operator: 'OR' },
      { field: 'province', value: 'Newfoundland and Labrador', operator: 'OR' },
      { field: 'province', value: 'Northwest Territories', operator: 'OR' },
      { field: 'province', value: 'Nova Scotia', operator: 'OR' },
      { field: 'province', value: 'Nunavut', operator: 'OR' },
      { field: 'province', value: 'Ontario', operator: 'OR' },
      { field: 'province', value: 'Prince Edward Island', operator: 'OR' },
      { field: 'province', value: 'Saskatchewan', operator: 'OR' },
      { field: 'province', value: 'Yukon', operator: 'AND' }, 
      { field: 'haveTrustee', value: 'Yes'}, 
    ],
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'trusteeRelationship',
    label: 'Trustee Relationship to Beneficiary',
    type: 'text',
    placeholder: 'e.g., Aunt',
    validation: z.string().optional(),
    defaultValue: '',
    conditionalDisplay: [
      { field: 'province', value: 'Alberta', operator: 'OR' },
      { field: 'province', value: 'British Columbia', operator: 'OR' },
      { field: 'province', value: 'Manitoba', operator: 'OR' },
      { field: 'province', value: 'New Brunswick', operator: 'OR' },
      { field: 'province', value: 'Newfoundland and Labrador', operator: 'OR' },
      { field: 'province', value: 'Northwest Territories', operator: 'OR' },
      { field: 'province', value: 'Nova Scotia', operator: 'OR' },
      { field: 'province', value: 'Nunavut', operator: 'OR' },
      { field: 'province', value: 'Ontario', operator: 'OR' },
      { field: 'province', value: 'Prince Edward Island', operator: 'OR' },
      { field: 'province', value: 'Saskatchewan', operator: 'OR' },
      { field: 'province', value: 'Yukon', operator: 'AND' }, 
      { field: 'haveTrustee', value: 'Yes'}, 
    ],
    labelVisible: true,
    wrapperClass: '',
  },
  
  // Section: Coverage Level
  {
    id: 'sectionCoverage',
    label: 'Coverage Level',
    type: 'section',
    validation: z.any(),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'coverageChanges',
    label: 'All future changes must be reported to your plan administrator.',
    type: 'message',
    messageLevel: 'warning',
    validation: z.any(),
    defaultValue: '',
    labelVisible: false,
    wrapperClass: 'md:col-span-2 mb-4 text-sm',
  },  
  {
    id: 'coverageLevel',
    label: 'Desired Coverage Level for Extended Health Care (EHC) & Dental Care',
    type: 'select',
    options: [
      { label: 'Self Only (Single)', value: 'S' },
      { label: 'Self and One Dependent (Couple)', value: 'C' },
      { label: 'Self and Two or More Dependents (Family)', value: 'F' },
      { label: 'No coverage for myself or my Dependents (Opt-out)', value: 'O' }
    ],
    validation: z.string().min(1, 'Please select a coverage level'),
    defaultValue: 'S',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
  },

  {
    id: 'optOutWarning',
    label: ' Note: You must have alternative insurance to opt out of these benefit coverages. Please complete the waiver section below and answer the additional waiving coverage questions.',
    type: 'message',
    messageLevel: 'warning',
    validation: z.any(),
    defaultValue: '',
    labelVisible: false,
    conditionalDisplay: [
      { field: 'coverageLevel', value: 'O' }
    ],
    wrapperClass: 'md:col-span-2 mb-4 text-sm',
  },    
  
  // Section: Waiver of Coverage
  {
    id: 'sectionWaiver',
    label: 'Waiver of Coverage',
    type: 'section',
    validation: z.any(),
    defaultValue: '',
    conditionalDisplay: { field: 'coverageLevel', value: 'O' },
    wrapperClass: '',
  },
  {
    id: 'dependentWaiver',
    label: 'Are you or your dependents covered under another plan?',
    type: 'select',
    options: ['Yes', 'No'],
    validation: z.string().optional(),
    defaultValue: 'No',
    //conditionalDisplay: { field: 'coverageLevel', value: 'O' },
    wrapperClass: 'md:col-span-2',
  },  
  {
    id: 'coverageWarning',
    label: 'You must have alternative insurance to opt out of these benefit coverages. Please complete the waiver section below.',
    type: 'message',
    messageLevel: 'error',
    validation: z.any(),
    defaultValue: '',
    labelVisible: false,
    conditionalDisplay: [
      { field: 'dependentWaiver', value: 'No', operator: 'AND' },
      { field: 'coverageLevel', value: 'O' }
    ],
    wrapperClass: 'md:col-span-2 mb-4 text-sm',
  },     
  {
    id: 'waiveEHC',
    label: 'Do you wish to waive Extended Health Care coverage?',
    type: 'select',
    options: [
      { label: 'Yes', value: 'Y' },
      { label: 'No', value: 'N' },
    ],
    validation: z.string().optional(),
    defaultValue: 'N',
    conditionalDisplay: { field: 'dependentWaiver', value: 'Yes' },
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'waiveDental',
    label: 'Do you wish to waive Dental Care coverage?',
    type: 'select',
    options: [
      { label: 'Yes', value: 'Y' },
      { label: 'No', value: 'N' },
    ],
    validation: z.string().optional(),
    defaultValue: 'N',
    conditionalDisplay: { field: 'dependentWaiver', value: 'Yes' },
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'alternativePlanSponsor',
    label: 'Name of Alternative Plan Sponsor (if waiving coverage)',
    type: 'text',
    placeholder: 'e.g., ABC Company',
    validation: z.string().optional(),
    defaultValue: '',
    conditionalDisplay: [
      { field: 'dependentWaiver', value: 'Y', operator: 'OR' },
      { field: 'coverageLevel', value: 'O' }
    ],
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'alternativeInsurer',
    label: 'Name of Insurer (if waiving coverage)',
    type: 'text',
    placeholder: 'e.g., XYZ Insurance',
    validation: z.string().optional(),
    defaultValue: '',
    conditionalDisplay: [
      { field: 'dependentWaiver', value: 'Y', operator: 'OR' },
      { field: 'coverageLevel', value: 'O' }
    ],
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'alternativeGroupNumber',
    label: 'Group Number (if waiving coverage)',
    type: 'text',
    placeholder: 'e.g., 12345',
    validation: z.string().optional(),
    defaultValue: '',
    conditionalDisplay: [
      { field: 'dependentWaiver', value: 'Yes', operator: 'OR' },
      { field: 'coverageLevel', value: 'O' }
    ],
    wrapperClass: 'md:col-span-2',
  },
  
  // Section: Coordination of Benefits
  {
    id: 'sectionCoordination',
    label: 'Coordination of Benefits',
    type: 'section',
    validation: z.any(),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
  },

  {
    id: 'otherEHCCoverage',
    label: 'Extended Health Care (EHC) Coverage Level',
    type: 'select',
    options: [
      { label: 'N/A', value: 'N/A' },
      { label: 'Self Only (Single)', value: 'S' },
      { label: 'Self and One Dependent (Couple)', value: 'C' },
      { label: 'Self and Two or More Dependents (Family)', value: 'F' },
      { label: 'No coverage for myself or my Dependents (Opt-out)', value: 'O' }
    ],
    validation: z.string().optional(),
    defaultValue: 'N/A',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
    conditionalDisplay: [
      { field: 'waiveEHC', value: 'Y' },
    ],
  },
  {
    id: 'otherDentalCoverage',
    label: 'Dental Care Coverage Level',
    type: 'select',
    options: [
      { label: 'N/A', value: 'N/A' },
      { label: 'Self Only (Single)', value: 'S' },
      { label: 'Self and One Dependent (Couple)', value: 'C' },
      { label: 'Self and Two or More Dependents (Family)', value: 'F' },
      { label: 'No coverage for myself or my Dependents (Opt-out)', value: 'O' }
    ],
    validation: z.string().optional(),
    defaultValue: 'N/A',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
    conditionalDisplay: [
      { field: 'waiveDental', value: 'Y' },
    ],    
  },
  
  // Section: Plan Sponsor Section
  {
    id: 'sectionPlanSponsor',
    label: 'Plan Sponsor Section',
    type: 'section',
    validation: z.any(),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'planSponsorName',
    label: 'Plan Sponsor Name',
    type: 'text',
    placeholder: 'e.g., ABC Corporation',
    validation: z.string().min(1, 'Plan Sponsor Name is required'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'personalIdNumber',
    label: 'Personal Identification Number',
    type: 'text',
    placeholder: 'e.g., 123456789',
    validation: z.string().min(1, 'Personal Identification Number is required'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'memberNumber',
    label: 'Member Number',
    type: 'text',
    placeholder: 'e.g., M12345',
    validation: z.string().min(1, 'Member Number is required'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: '',
  },
  {
    id: 'occupation',
    label: 'Occupation',
    type: 'text',
    placeholder: 'e.g., Software Developer',
    validation: z.string().min(1, 'Occupation is required'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'datePartTimeEmployment',
    label: 'Date of Part-Time Employment (if applicable)',
    type: 'date',
    validation: z.string().optional(),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'dateFullTimeEmployment',
    label: 'Date of Full-Time Employment',
    type: 'date',
    validation: z.string().min(1, 'Date of Full-Time Employment is required').refine((val) => !isNaN(Date.parse(val)), {
      message: 'Please enter a valid date',
    }),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'dateEligibleCoverage',
    label: 'Date Eligible for Coverage',
    type: 'date',
    validation: z.string().min(1, 'Date Eligible for Coverage is required').refine((val) => !isNaN(Date.parse(val)), {
      message: 'Please enter a valid date',
    }),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'annualEarnings',
    label: 'Annual Earnings',
    type: 'number',
    placeholder: 'e.g., 75000',
    validation: z.string().min(1, 'Annual Earnings is required')
      .refine((val) => !isNaN(parseFloat(val)), {
        message: 'Please enter a valid number',
      }),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'hoursPerWeek',
    label: 'Number of Hours per Week/F.T.E.',
    type: 'number',
    placeholder: 'e.g., 40',
    validation: z.string().min(1, 'Number of Hours per Week is required')
      .refine((val) => {
        const hours = parseFloat(val);
        return !isNaN(hours) && hours > 20; // Must be greater than 20 and not empty
      }, 'You cannot proceed with 20 or fewer hours per week. Please update your hours to continue.'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'employeeClass',
    label: 'Class',
    type: 'text',
    placeholder: 'e.g., A',
    validation: z.string().optional(),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
  },
  {
    id: 'deptDivLocation',
    label: 'Department/Division/Location',
    type: 'text',
    placeholder: 'e.g., IT Department, Head Office',
    validation: z.string().min(1, 'Department/Division/Location is required'),
    defaultValue: '',
    labelVisible: true,
    wrapperClass: 'md:col-span-2',
  },

];

export const buildFormSchema = (fields: FormFieldConfig<any>[]) => {
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  fields.forEach(field => {
    schemaShape[field.id] = field.validation;
  });
  return z.object(schemaShape);
};

export const defaultFormValues = questionnaireFields.reduce((acc, field) => {
  acc[field.id] = field.defaultValue;
  return acc;
}, {} as Record<string, any>);

export const formSchema = buildFormSchema(questionnaireFields);
