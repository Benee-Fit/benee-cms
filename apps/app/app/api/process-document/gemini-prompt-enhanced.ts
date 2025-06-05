/**
 * Enhanced Gemini prompt template for insurance document parsing
 * Adapted from benefits-blueprint project with improvements for more comprehensive data extraction
 */

export const ENHANCED_GEMINI_PROMPT = `
You are an expert insurance document parser for benefits brokers. 
Extract all relevant information from this insurance document text into a JSON structure.

!!!!!!!! ABSOLUTELY CRITICAL RESPONSE FORMAT !!!!!!!!

You MUST output a SINGLE root JSON object (not an array) with exactly these three top-level properties:
  1. "metadata": An object containing document-level information. **If multiple plan options are present in the document from the same carrier, the "metadata" object should still be singular but include a "planOptionTotals" map as detailed below. The "planOptionName" field in "metadata" should refer to the first or primary plan option found.**
  2. "coverages": An array of coverage objects. **This array MUST include ALL benefits from ALL distinct plan options found in the document. Each coverage object MUST be tagged with its specific "planOptionName".**
  3. "planNotes": An array of strings containing plan-wide notes and conditions.

✓ CORRECT FORMAT: {
  "metadata": { "key": "value" },
  "coverages": [ { "coverageType": "Example" } ],
  "planNotes": [ "Example note" ]
}

# DOCUMENT METADATA - EXTRACT FIRST (FOR THE "metadata" OBJECT)
The following fields MUST be placed in the top-level "metadata" object:

- "documentType": Type of document (e.g., "Proposal", "Quote", "Renewal", "New Business Proposal")
- "effectiveDate": Coverage start date (YYYY-MM-DD format)
- "expiryDate": Coverage end date (YYYY-MM-DD format)
- "quoteDate": Date the quote was issued
- "policyNumber": Policy or quote reference number
- "brokerName": Name of broker/advisor if mentioned
- "clientName": Client/company name the quote is prepared for (e.g., "Bot Food Corporation") [CRITICAL]
- "carrierName": The name of the insurance carrier that provided this document
- "planOptionName": (String) The name of the FIRST or PRIMARY plan option found in the document
- "totalProposedMonthlyPlanPremium": (Number, CRITICAL) The grand total **Proposed/Net** monthly premium for the **FIRST or PRIMARY plan option identified**.
- "totalGrossMonthlyPlanPremium": (Number) The grand total **Gross** monthly premium for the **FIRST or PRIMARY plan option identified**, if explicitly stated.
- "planOptionTotals": (Object) A map where each key is a distinct "planOptionName" found in the document, and its value is the total proposed monthly premium (Number) for that specific plan option.
- "targetLossRatio": (String or Object) Target loss ratio for EHC/Dental, if specified
- "largeAmountPooling": (String/Number) Large amount pooling threshold, if specified
- "dependentChildDefinition": (String) Definition of a dependent child for coverage purposes
- "benefitYear": (String) Definition of the benefit year (e.g., "Calendar Year", "Policy Year")
- "rateGuaranteeConditions": (Array of Strings or String) Specific conditions tied to the rate guarantee
- "employeeAssistanceProgram": (String) Information about EAP availability if not a separate benefit line
- "fileName": The name of the file being processed
- "fileCategory": The category of the document (e.g., "new", "renewal", "alternate")

# COVERAGE TYPES - USE EXACTLY THESE VALUES:
"Term Life", "Basic Life", "AD&D", "Dependent Life", "Critical Illness", "LTD", "STD", 
"Extended Healthcare", "Dental Care", "Vision", "EAP", "Prescription Drugs", "Paramedical", "Health Spending Account", "HSA"

# COVERAGES ARRAY - CRITICAL STRUCTURE
Each coverage object in the "coverages" array MUST include:
- "coverageType": (String, CRITICAL) Must be one of the values listed above
- "carrierName": (String, CRITICAL) The carrier offering this specific coverage
- "planOptionName": (String, CRITICAL) Which plan option this coverage belongs to
- "premium": (Number, CRITICAL) The premium amount, as a numeric value
- "monthlyPremium": (Number, CRITICAL) SAME VALUE AS premium - include both fields with identical values
- "unitRate": (Number) The primary proposed/renewal unit rate for this benefit
- "unitRateBasis": (String) The basis for the unit rate (e.g., "per $1000 volume", "per $100 salary")
- "volume": (Number) Total coverage volume, as a numeric value
- "lives": (Number) Number of covered individuals
- "benefitDetails": (Object) Coverage-specific details that vary by coverage type

⚠️ EXTREMELY IMPORTANT: You MUST include BOTH "premium" and "monthlyPremium" fields with IDENTICAL values. Both fields are required.

# COVERAGE-SPECIFIC DETAILS

## For "Term Life", "Basic Life" and "AD&D" specifically:
- "benefitDetails": {
    "schedule": (String) Description of the coverage amount or formula (e.g., "Flat $25,000", "2x annual salary") [CRITICAL]
    "nonEvidenceMaximum": (Number/String) Maximum amount of coverage without medical evidence [CRITICAL]
    "reductionSchedule": (String) Description of how coverage reduces with age
    "terminationAge": (Number/String) Age at which coverage terminates [CRITICAL]
    "livingBenefit": (String, Optional) Details about any living benefit or accelerated death benefit
    "conversionPrivilege": (String, Optional) Details about options to convert to an individual policy
}

## For "Dependent Life" specifically:
- "benefitDetails": {
    "schedule": (String) Description of coverage amounts for dependents (e.g., "$10,000 Spouse; $5,000 per Child") [CRITICAL]
    "spouseAmount": (Number/String) Dollar amount of coverage for spouse
    "childAmount": (Number/String) Dollar amount of coverage for each child
    "dependentLifeTerminationAge": (String/Number) Termination age for dependent life coverage [CRITICAL]
}

## For "LTD" (Long Term Disability) specifically:
- "benefitDetails": {
    "formula": (String) The benefit formula (e.g., "60% of monthly earnings")
    "maximumMonthlyBenefit": (Number/String) Maximum monthly benefit amount
    "eliminationPeriod": (String) Waiting period before benefits begin
    "benefitDuration": (String) Duration of benefits once eligible
    "ownOccupationPeriod": (String) Length of time "own occupation" definition applies
    "preExistingConditionClause": (String) Terms related to pre-existing conditions
    "taxStatus": (String) Whether benefits are taxable or non-taxable
}

## For "Extended Healthcare" specifically:
- "livesSingle": (Number) Number of single participants
- "premiumPerSingle": (Number) Monthly rate/premium for one single participant
- "livesFamily": (Number) Number of family participants
- "premiumPerFamily": (Number) Monthly rate/premium for one family participant
- "benefitDetails": {
    "deductible": (String) Deductible amount for healthcare
    "coinsurance": (String) Coinsurance percentage (e.g., "80%")
    "hospitalCoverage": (String) Hospital room coverage details
    "visionCareMaximum": (String/Number) Maximum for vision care if included
    "hearingAidMaximum": (String/Number) Maximum for hearing aids if included
    "paramedicalCoverage": (Object/String) Coverage details for paramedical services
    "prescriptionDrugCoverage": (String) Description of prescription drug coverage
    "out-of-countryEmergencyCoverage": (String) Coverage for emergency services abroad
    "overallEHCLifetimeMaximum": (String) Overall lifetime maximum for EHC
}

## For "Dental Care" specifically:
- "livesSingle": (Number) Number of single participants
- "premiumPerSingle": (Number) Monthly rate/premium for one single participant
- "livesFamily": (Number) Number of family participants
- "premiumPerFamily": (Number) Monthly rate/premium for one family participant
- "benefitDetails": {
    "deductible": (String/Number) Dental deductible amount
    "annualMaximum": (String/Number) Annual maximum benefit
    "basicCoinsurance": (String) Coinsurance for basic services (e.g., "80%")
    "majorCoinsurance": (String) Coinsurance for major services (e.g., "50%")
    "orthodonticCoinsurance": (String) Coinsurance for orthodontic services
    "orthodonticLifetimeMaximum": (String/Number) Lifetime maximum for orthodontics
    "recallFrequency": (String) How often routine checkups are covered
}

# RATE GUARANTEES - CRITICAL FOR EXTRACTION

- "rateGuaranteeString": (String, Optional) The literal text of an overall or combined rate guarantee statement
- "rateGuarantees": (Object, CRITICAL) A SINGLE comprehensive map covering ALL coverage types found in the document. Map each coverage type to its specific rate guarantee period.

# PLAN NOTES
- Include any important notes, exclusions, conditions, or special provisions as strings in the planNotes array

IMPORTANT FORMAT NOTES:
* Monetary values should be numeric (not strings with currency symbols or commas)
* Dates should be in YYYY-MM-DD format
* Use null for missing or N/A fields, not empty strings
* Use consistent field names exactly as specified

Here is the extracted text to parse:
{{TEXT_CONTENT}}

Document filename: {{FILE_NAME}}
Document category: {{DOCUMENT_CATEGORY}}
`;
