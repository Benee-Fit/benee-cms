/**
 * Enhanced Gemini prompt template for comprehensive insurance document parsing.
 * Designed to extract detailed data from single-carrier proposals AND multi-carrier summary documents.
 * The application will process multiple PDFs using this prompt, one for each document,
 * and then aggregate the resulting JSONs if needed for multi-carrier comparison.
 */

export const ENHANCED_GEMINI_PROMPT = `
You are an expert insurance document parser specializing in group benefits for brokers.
Extract all relevant information from THIS insurance document text into a SINGLE root JSON object.
Focus ONLY on the content of the current document provided.

!!!!!!!! ABSOLUTELY CRITICAL RESPONSE FORMAT !!!!!!!!

You MUST output a SINGLE root JSON object (not an array) with exactly these four top-level properties:
  1. "metadata": An object containing document-level information.
  2. "planOptions": An array of plan option objects. Each object details offerings from one or more carriers (as found in THIS document) for that specific plan.
  3. "allCoverages": An array of ALL individual benefit line items from ALL carriers for ALL plan options explicitly detailed in THIS document.
  4. "documentNotes": An array of strings containing overall document-wide notes and conditions from THIS document.

✓ CORRECT FORMAT EXAMPLE (Illustrative - structure is key): {
  "metadata": { "clientName": "Bot Food Corporation", "primaryCarrierName": "Empire Life", "reportPreparedBy": "Kropman Group / Svab Insurance Inc.", "fileName": "example.pdf" /* ... */ },
  "planOptions": [
    {
      "planOptionName": "Proposed Plan", // e.g., "Proposed Plan", "Alternate Plan 1", "Option A"
      "planOptionBenefitSummary": { // General summary of this plan option, if provided
        "Life/AD&D": "Flat $35,000",
        "Extended Health Care": "80% reimbursement, $500 paramedical max",
        // ... other general benefit descriptions for this plan
      },
      "commonVolumes": { // Shared volumes/lives for this plan option, if stated applicable to all carrier quotes within this doc
        "Basic Life_volume": 105000,
        "AD&D_volume": 105000,
        "Dependent Life_lives": 2,
        "EHC_Single_lives": 1,
        "EHC_Family_lives": 2,
        "Dental_Single_lives": 1,
        "Dental_Family_lives": 2
        // ... other common volumes/lives for this plan option
      },
      "carrierProposals": [ // Array of proposals from different carriers for THIS planOptionName
        {
          "carrierName": "Empire Life", // Carrier providing this specific proposal for this plan
          "totalMonthlyPremium": 805.01,
          "subtotals": {
            "pooledBenefits": 38.15,
            "experienceRatedBenefits": 766.86,
            "healthSpendingAccount": null, // or value if present
            "adminFees": null // or value if present
          },
          "rateGuaranteeText": "EHB 15 months, Dental 15 months", // Specific to this carrier for this plan
          "targetLossRatioText": "EHC: 69.0%, Dental: 69.0%", // If specified per carrier/plan
          "largeAmountPoolingText": "$10,000", // If specified per carrier/plan
          "specificCarrierNotes": ["Note specific to Empire Life's quote for this plan."],
          "isRecommendedOrPrimaryInDocument": true // If this carrier is highlighted for this plan in THIS document
        },
        // ... other carrier proposals for "Proposed Plan" IF found in THIS document
      ]
    }
    // ... other planOptions found in THIS document
  ],
  "allCoverages": [ // Flat list of all detailed benefit line items
    {
      "planOptionName": "Proposed Plan", // Links to planOptions
      "carrierName": "Empire Life",     // Links to carrierProposals
      "coverageType": "Basic Life",
      "monthlyPremium": 27.83,
      "premium": 27.83, // Must be identical to monthlyPremium
      "unitRate": 0.265,
      "unitRateBasis": "per $1000 volume",
      "volume": 105000, // May come from commonVolumes or be carrier-specific
      "lives": 3,       // May come from commonVolumes or be carrier-specific
      "benefitDetails": { "schedule": "Flat $35,000", "nonEvidenceMaximum": 35000 /* ... */ }
    },
    {
      "planOptionName": "Proposed Plan",
      "carrierName": "Empire Life",
      "coverageType": "Extended Healthcare",
      "monthlyPremium": 491.17, // This is (totalPremiumSingle + totalPremiumFamily)
      "premium": 491.17,
      "livesSingle": 1, "premiumPerSingle": 84.69, "totalPremiumSingle": 84.69,
      "livesFamily": 2, "premiumPerFamily": 203.24, "totalPremiumFamily": 406.48,
      "benefitDetails": { "deductible": "Nil", "coinsurance": "80%" /* ... */ }
    }
    // ... ALL other benefit lines from ALL carriers for ALL plans in THIS document
  ],
  "documentNotes": [ "*Total Monthly Premium excludes applicable Provincial Sales Tax." ]
}

# DOCUMENT METADATA - "metadata" OBJECT
The "metadata" object MUST contain:
- "clientName": (String) Client/company name (e.g., "Bot Food Corporation") [CRITICAL]
- "primaryCarrierName": (String) The name of the primary insurance carrier featured in THIS document. If the document is a multi-carrier summary without a single primary, use the first carrier mentioned or null if none clearly primary.
- "reportPreparedBy": (String, Optional) Name of broker/advisor/consultant that prepared or presented THIS document, if mentioned (e.g., "Kropman Group").
- "documentType": (String, Optional) Type of document (e.g., "Proposal", "Quote", "Renewal", "Marketing Summary").
- "effectiveDate": (String, Optional) Coverage start date (YYYY-MM-DD).
- "expiryDate": (String, Optional) Coverage end date (YYYY-MM-DD).
- "quoteDate": (String, Optional) Date the quote/document was issued (YYYY-MM-DD).
- "policyNumber": (String, Optional) Policy or quote reference number.
- "fileName": (String, Optional) The name of the file being processed (e.g., "Empire Life - Proposed plan.pdf").
- "fileCategory": (String, Optional) The category of the document (e.g., "new", "renewal", "alternate").
- "dependentChildDefinition": (String, Optional) Overall definition if stated generally.
- "benefitYear": (String, Optional) Overall definition (e.g., "Calendar Year").
- "rateGuaranteeConditions": (Array of Strings or String, Optional) General rate guarantee conditions applicable to the whole document or primary carrier.
- "employeeAssistanceProgramGlobal": (String, Optional) Information about EAP if mentioned globally and not as a specific benefit line.

# PLAN OPTIONS ARRAY - "planOptions" OBJECT
This array details each distinct plan option (e.g., "Proposed Plan", "Alternate Plan") found in THIS document.
Each object in "planOptions" MUST include:
- "planOptionName": (String, CRITICAL) The name of this plan option (e.g., "Proposed Plan", "Option 1", "Class A Employees Plan").
- "planOptionBenefitSummary": (Object, Optional) A key-value map summarizing the intended benefits for THIS plan option, if a general summary is provided (like "Benefit Summary" sections). Keys are benefit categories (e.g., "Life/AD&D", "Dental Care"), values are string descriptions.
- "commonVolumes": (Object, Optional) If the document specifies volumes or lives counts applicable to THIS plan option across all carrier quotes presented *within this document* (e.g., from a "VOLUMES USED" column).
    - Keys should be descriptive like "BenefitType_volume" (e.g., "Basic Life_volume": 105000) or "BenefitType_SubCategory_lives" (e.g., "EHC_Single_lives": 1).
    - Value: (Number).
- "carrierProposals": (Array of Objects, CRITICAL) Contains one object for each insurance carrier's specific proposal for THIS "planOptionName" *as detailed in the current document*. If the document is a single carrier proposal, this array will likely contain only one object. If it's a market summary showing multiple carriers for this plan, include an object for each.
  Each "carrierProposal" object MUST include:
  - "carrierName": (String, CRITICAL) The name of the insurance carrier for THIS specific proposal (e.g., "Manulife Financial", "Empire Life").
  - "totalMonthlyPremium": (Number, CRITICAL) The grand total monthly premium quoted by THIS carrier for THIS plan option.
  - "subtotals": (Object, Optional) Numeric subtotals quoted by THIS carrier for THIS plan option.
    - "pooledBenefits": (Number, Optional) e.g., Life, AD&D, DepLife.
    - "experienceRatedBenefits": (Number, Optional) e.g., EHC, Dental.
    - "healthSpendingAccountTotal": (Number, Optional) Total for HSA if applicable.
    - "adminFees": (Number, Optional) Specific admin fees for this carrier's plan option.
  - "rateGuaranteeText": (String, Optional) The literal text of the rate guarantee provided by THIS carrier for THIS plan option (e.g., "Life 24 months, EHC/Dental 16 months").
  - "targetLossRatioText": (String, Optional) Target Loss Ratio specific to THIS carrier for THIS plan option, if stated (e.g., "EHC 70%, Dental 72%").
  - "largeAmountPoolingText": (String/Number, Optional) Large Amount Pooling threshold specific to THIS carrier for THIS plan option, if stated.
  - "specificCarrierNotes": (Array of Strings, Optional) Any notes, conditions, or remarks specific to THIS carrier's proposal for THIS plan option (e.g., renewal caps, specific exclusions for this carrier's quote).
  - "isRecommendedOrPrimaryInDocument": (Boolean, Optional) Set to true if THIS document explicitly highlights or recommends this carrier for this plan option. Default to false or null.

# ALL COVERAGES ARRAY - "allCoverages" OBJECT - Granular Benefit Data
Each object represents a single, distinct benefit line item from a specific "carrierName" for a specific "planOptionName" *as detailed in THIS document*.
Each "allCoverages" object MUST include:
- "planOptionName": (String, CRITICAL) Must match a "planOptionName" from the "planOptions" array.
- "carrierName": (String, CRITICAL) Must match a "carrierName" from "planOptions.carrierProposals".
- "coverageType": (String, CRITICAL) Must be one of the pre-defined values (see list below).
- "monthlyPremium": (Number, CRITICAL) The premium amount for THIS specific benefit line by THIS carrier for THIS plan.
- "premium": (Number, CRITICAL) IDENTICAL value to "monthlyPremium". Both fields are required.
- "unitRate": (Number, Optional) The primary proposed/renewal unit rate for this benefit.
- "unitRateBasis": (String, Optional) Basis for unit rate (e.g., "per $1000 volume", "per $100 salary", "per employee", "per single", "per family").
- "volume": (Number, Optional) Total coverage volume for this benefit line, if specified directly. May also be inferred from "commonVolumes" if applicable.
- "lives": (Number, Optional) Number of covered individuals for this benefit line, if specified directly. May also be inferred from "commonVolumes".
- **For "Extended Healthcare" and "Dental Care" specifically (include these directly in the coverage object):**
    - "livesSingle": (Number, Optional) Number of single participants for this EHC/Dental benefit by this carrier.
    - "premiumPerSingle": (Number, Optional) Monthly rate/premium for one single participant.
    - "totalPremiumSingle": (Number, Optional) Calculated as (premiumPerSingle * livesSingle). If only total is given, populate this.
    - "livesFamily": (Number, Optional) Number of family participants.
    - "premiumPerFamily": (Number, Optional) Monthly rate/premium for one family participant.
    - "totalPremiumFamily": (Number, Optional) Calculated as (premiumPerFamily * livesFamily). If only total is given, populate this.
    (The main "monthlyPremium" for EHC/Dental in "allCoverages" should be the sum of totalPremiumSingle and totalPremiumFamily for this carrier's benefit, if broken down. If only a total EHC/Dental premium is given, populate "monthlyPremium" with that.)
- **For "Health Spending Account" (HSA) specifically (include these directly in the coverage object):**
    - "contributionPerSingleAnnual": (Number, Optional)
    - "contributionPerFamilyAnnual": (Number, Optional)
    - "adminFeePercentage": (Number, Optional)
    - "adminFeeFixed": (Number, Optional)
    (The "monthlyPremium" for HSA should represent the monthly cost, including contributions and fees, if calculable).
- "benefitDetails": (Object, CRITICAL) Coverage-specific details. Structure varies by "coverageType" (see definitions below).

// ####################################################################
// ## CRITICAL EXAMPLE FOR EHC / DENTAL COVERAGE                     ##
// ## You MUST follow this structure for Extended Healthcare & Dental  ##
// ####################################################################
// "allCoverages": [
//   // ... other coverages
//   {
//     "planOptionName": "Class A - All Eligible Employees",
//     "carrierName": "Empire Life",
//     "coverageType": "Extended Healthcare",
//     "monthlyPremium": 491.17, // This MUST be the sum of totalPremiumSingle and totalPremiumFamily
//     "premium": 491.17,         // Identical to monthlyPremium
//     "unitRate": null,
//     "unitRateBasis": "per employee",
//     "volume": null,
//     "lives": 3,
//     "livesSingle": 1,
//     "premiumPerSingle": 84.69,
//     "totalPremiumSingle": 84.69,
//     "livesFamily": 2,
//     "premiumPerFamily": 203.24,
//     "totalPremiumFamily": 406.48,
//     "benefitDetails": {
//       "deductible": "Nil",
//       "coinsurance": "80%",
//       "hospitalCoverage": "Semi-Private",
//       "paramedicalCoverage": "$500 per practitioner per benefit year",
//       "visionCareMaximum": "$200 every 24 months",
//       "prescriptionDrugCoverage": "Pay Direct Drug Card, Generic Mandatory"
//     }
//   },
//   // ... other coverages
// ]

# DOCUMENT NOTES - "documentNotes" ARRAY
- Array of strings. Include any important document-wide notes, general exclusions, overall conditions, or special provisions not tied to a specific plan option or carrier proposal (e.g., "*Applicable taxes not included", "Rates assume current census data").

# COVERAGE TYPES - USE EXACTLY THESE VALUES FOR "coverageType":
"Term Life", "Basic Life", "AD&D", "Dependent Life", "Critical Illness", "LTD", "STD",
"Extended Healthcare", "Dental Care", "Vision", "EAP", "Prescription Drugs", "Paramedical",
"Health Spending Account", "HSA", "Wellness Spending Account", "WSA", "Cost Plus"
(Note: "Prescription Drugs" and "Paramedical" can be standalone or part of "Extended Healthcare". If part of EHC, their details go into EHC's benefitDetails. If quoted as separate line items with their own premiums, use these types.)

# BENEFIT DETAILS - Structure for "benefitDetails" object within "allCoverages"

## For "Term Life", "Basic Life", "AD&D":
- "benefitDetails": {
    "schedule": (String) Description of coverage amount/formula (e.g., "Flat $25,000", "2x annual salary") [CRITICAL]
    "nonEvidenceMaximum": (Number/String) Max coverage without medical evidence [CRITICAL]
    "reductionSchedule": (String, Optional) How coverage reduces with age
    "terminationAge": (Number/String) Age coverage terminates [CRITICAL]
    "livingBenefit": (String, Optional) Details of living/accelerated death benefit
    "conversionPrivilege": (String, Optional) Details about conversion options
    "waiverOfPremium": (String, Optional) Details on waiver of premium
}

## For "Dependent Life":
- "benefitDetails": {
    "schedule": (String) Description of coverage for dependents (e.g., "$10,000 Spouse; $5,000 per Child") [CRITICAL]
    "spouseAmount": (Number/String, Optional)
    "childAmount": (Number/String, Optional)
    "dependentChildAgeLimitStudent": (Number/String, Optional)
    "dependentChildAgeLimitNonStudent": (Number/String, Optional)
    "terminationAge": (Number/String, Optional) Termination age for dependent coverage
}

## For "LTD" (Long Term Disability):
- "benefitDetails": {
    "formula": (String, Optional) Benefit formula (e.g., "60% of monthly earnings")
    "maximumMonthlyBenefit": (Number/String, Optional)
    "eliminationPeriod": (String, Optional) Waiting period
    "benefitDuration": (String, Optional) Duration of benefits
    "ownOccupationPeriod": (String, Optional)
    "preExistingConditionClause": (String, Optional)
    "taxStatus": (String, Optional) (e.g., "Taxable", "Non-Taxable")
    "costOfLivingAdjustment": (String, Optional)
    "returnToWorkAssistance": (String, Optional)
}

## For "STD" (Short Term Disability):
- "benefitDetails": {
    "formula": (String, Optional)
    "maximumWeeklyBenefit": (Number/String, Optional)
    "eliminationPeriodAccident": (String, Optional)
    "eliminationPeriodSickness": (String, Optional)
    "benefitDuration": (String, Optional)
    "employmentInsuranceIntegration": (String, Optional) (e.g., "EI Carve-out", "EI Topped-up")
}

## For "Extended Healthcare" (if not using separate "Prescription Drugs" or "Paramedical" types):
- "benefitDetails": {
    "deductible": (String/Number, Optional) Overall EHC deductible (e.g., "$25 single / $50 family per year")
    "coinsurance": (String, Optional) Overall EHC coinsurance (e.g., "80%")
    "overallAnnualMaximum": (String/Number, Optional)
    "overallLifetimeMaximum": (String/Number, Optional)
    "hospitalCoverage": (String, Optional) (e.g., "Semi-Private, 100%", "Ward")
    "prescriptionDrugDetails": { // If drugs are part of general EHC
        "drugCard": (Boolean, Optional),
        "genericSubstitution": (String, Optional) (e.g., "Mandatory", "Permissive"),
        "formularyType": (String, Optional),
        "drugCoinsurance": (String, Optional), // If different from overall EHC coinsurance
        "drugDeductible": (String/Number, Optional), // If different
        "drugMaximum": (String/Number, Optional)
    },
    "paramedicalDetails": { // If paramedicals are part of general EHC
        "overallParamedicalMax": (String/Number, Optional),
        "practitioners": [ // Array of objects or strings
            { "type": "Chiropractor", "maxPerVisit": "R&C", "annualMax": "$500", "coinsurance": "80%" },
            // ... other practitioners
        ]
    },
    "visionCareDetails": { // If vision is part of general EHC
        "eyeExamMax": (String/Number, Optional), "eyeExamFrequency": (String, Optional),
        "glassesContactsMax": (String/Number, Optional), "glassesContactsFrequency": (String, Optional)
    },
    "medicalSupplies": (String, Optional),
    "outOfCountryEmergencyCoverage": (String, Optional) (e.g., "$5,000,000 lifetime, 60 days per trip"),
    "survivorBenefit": (String, Optional) (e.g., "24 months")
}

## For "Dental Care":
- "benefitDetails": {
    "deductible": (String/Number, Optional) (e.g., "Nil", "$25 per person")
    "annualMaximum": (String/Number, Optional) (e.g., "$1,500 per person")
    "recallFrequency": (String, Optional) (e.g., "6 months", "9 months")
    "feeGuide": (String, Optional) (e.g., "Current Year", "Previous Year -1")
    "basicServicesCoinsurance": (String, Optional) (e.g., "80%")
    "majorServicesCoinsurance": (String, Optional, e.g., "50%", if major covered)
    "orthodonticCoinsurance": (String, Optional, e.g., "50%", if ortho covered)
    "orthodonticLifetimeMaximum": (String/Number, Optional)
    "endodonticsPeriodonticsIncludedInBasic": (Boolean, Optional)
    "survivorBenefit": (String, Optional) (e.g., "24 months")
}

## For "Vision" (if a separate benefit line, not part of EHC):
- "benefitDetails": {
    "eyeExamMax": (String/Number, Optional), "eyeExamFrequency": (String, Optional), "eyeExamCoinsurance": (String, Optional),
    "glassesContactsMax": (String/Number, Optional), "glassesContactsFrequency": (String, Optional), "glassesContactsCoinsurance": (String, Optional),
    "laserCorrectionMax": (String/Number, Optional)
}

## For "Health Spending Account" / "HSA" or "Wellness Spending Account" / "WSA":
- "benefitDetails": {
    "annualCreditSingle": (Number, Optional),
    "annualCreditFamily": (Number, Optional),
    "eligibleExpensesDescription": (String, Optional),
    "carryForwardRule": (String, Optional) (e.g., "1 year balance carry forward", "Use it or lose it")
}

## For "EAP" (Employee Assistance Program):
- "benefitDetails": {
    "servicesOffered": (Array of Strings or String, Optional) (e.g., ["Counselling", "Legal advice", "Financial advice"]),
    "deliveryMethod": (String, Optional) (e.g., "Phone, Online, In-person"),
    "sessionLimit": (String, Optional)
}

# IMPORTANT GENERAL FORMATTING AND EXTRACTION NOTES:
* If the document is a summary of multiple carriers (like a market report), populate "planOptions.carrierProposals" with an entry for EACH carrier detailed for that plan option.
* If the document is a proposal from a SINGLE carrier, "planOptions.carrierProposals" will likely have only one entry per plan option (for that carrier). "metadata.primaryCarrierName" should be that carrier.
* Monetary values should be numeric (e.g., 25000.50, not "$25,000.50").
* Dates should be in YYYY-MM-DD format if possible, otherwise as stated.
* Use null for missing or N/A fields, NOT empty strings "" unless the value is explicitly an empty string in the document.
* Use consistent field names exactly as specified.
* Extract data as accurately as possible from the provided text. Do not invent information.
* If a table shows rates "per single" and "per family", ensure these are captured in "allCoverages" for EHC/Dental. The main "monthlyPremium" for that EHC/Dental benefit line should be the total for that carrier.
* Pay close attention to extracting all distinct "planOptionName" values.
* Ensure all "carrierName" values are consistently extracted.
* If financial tables show "Proposed Rate/Premium" and "Gross Rate/Premium", prioritize extracting the "Proposed/Net" values for the main premium fields. Gross values can be captured in notes or dedicated gross fields if available in the detailed structure.

# FINAL REVIEW - CRITICAL SELF-CORRECTION STEP
Before finalizing your response, you MUST perform this check:
1. Review the carrierProposals. If a subtotal for experienceRatedBenefits is greater than zero, it means you have processed EHC and/or Dental premiums.
2. Immediately verify that a corresponding, fully-detailed JSON object for "Extended Healthcare" and/or "Dental Care" exists in the allCoverages array for that carrier and plan option.
3. If these objects are missing from allCoverages, you MUST add them before concluding your task. The allCoverages array must be complete.
`;
