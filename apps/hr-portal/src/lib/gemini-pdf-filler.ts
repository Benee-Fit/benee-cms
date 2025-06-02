import { PdfFillerInput, PdfFillerOutput } from '@/ai/flows/pdf-filler';
import { PDFDocument, PDFForm, PDFField, PDFTextField, PDFCheckBox, PDFRadioGroup } from 'pdf-lib';
import { ai } from '@/ai/genkit';

/**
 * Fills a PDF template with form data using Gemini AI for guidance and pdf-lib for form filling
 * @param input The input containing the PDF template and form data
 * @returns The filled PDF as a data URI
 */
/**
 * PDF processing result including field mappings and field metadata
 */
export interface PdfProcessingResult {
  /** Mapping from original field names to clean names */
  originalToClean: Record<string, string>;
  /** Mapping from clean field names to original names */
  cleanToOriginal: Record<string, string>;
  /** Information about each field in the PDF */
  fieldMetadata: Array<{
    /** Original field name from the PDF */
    originalName: string;
    /** Cleaned standardized field name */
    cleanName: string;
    /** Field type (text, checkbox, radio, etc.) */
    fieldType: string;
    /** Whether the field is required */
    isRequired: boolean;
    /** Field category (personal, employment, dependent, etc.) */
    category?: string;
    /** Any validation rules for the field */
    validationRules?: string[];
  }>;
  /** Total number of fields found in the PDF */
  totalFields: number;
  /** Form structure analysis */
  formStructure: {
    /** Sections identified in the form */
    sections: string[];
    /** Field groups based on proximity or logical grouping */
    fieldGroups: Record<string, string[]>;
  };
}

/**
 * Processes an uploaded PDF to extract and clean field names using Gemini AI
 * @param pdfDataUri The PDF file as a data URI
 * @returns A comprehensive analysis of the PDF form structure and fields
 */
export async function processUploadedPdf(pdfDataUri: string): Promise<PdfProcessingResult> {
  try {
    console.log('Processing uploaded PDF with Gemini AI...');
    
    // Extract the base64 PDF data from the data URI
    const base64PdfData = pdfDataUri.replace(/^data:application\/pdf;base64,/, '');
    const pdfBytes = base64ToUint8Array(base64PdfData);
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes, { 
      ignoreEncryption: true,
      updateMetadata: false,
      throwOnInvalidObject: false
    });
    
    // Get the form from the PDF
    const form = pdfDoc.getForm();

    
    // Get all form fields
    const fieldNames = form.getFields().map(field => field.getName());
    
    if (fieldNames.length === 0) {
      console.log('No form fields found in the PDF.');
      return { 
        originalToClean: {}, 
        cleanToOriginal: {},
        fieldMetadata: [],
        totalFields: 0,
        formStructure: {
          sections: [],
          fieldGroups: {}
        }
      };
    }
    
    console.log(`Found ${fieldNames.length} form fields in the PDF.`);
    
    // Format the field names for the prompt
    const fieldNamesString = fieldNames.join('\n');
    
    // Create a prompt for Gemini to clean field names
    const prompt = `I have a PDF form with the following field names:\n\n${fieldNamesString}\n\n
    Please analyze these field names and create a mapping of the original field names to cleaner, more standardized versions. 
    The cleaner names should be in camelCase format, be descriptive, and follow these rules:\n
    1. Remove any special characters or numbers that aren't part of the actual name
    2. Convert names to meaningful camelCase format (e.g., "First Name" → "firstName")
    3. Standardize common fields (e.g., various date of birth fields should all map to "dateOfBirth")
    4. Group related fields with common prefixes (e.g., "spouseFirstName" for spouse-related fields)
    5. Map checkbox/radio fields to meaningful boolean or enum values
    6. Preserve the semantic meaning of each field
    
    For fields related to insurance forms, use these standardized names when appropriate:\n
    - Personal information: firstName, lastName, dateOfBirth, gender, email, phone, address, city, province, postalCode
    - Employment: employeeId, employeeNumber, annualEarnings, hoursPerWeek, jobTitle, department, employmentDate
    - Dependents: spouse fields should be prefixed with 'spouse' (e.g., spouseFirstName)
    - Children fields should use 'dependent' prefix with an index (dependentFirstName1)
    - Beneficiaries: beneficiaryName, beneficiaryRelationship, beneficiaryPercentage
    - Coverage: coverageType, coverageLevel (single, couple, family), waiver fields should use 'waiver' prefix\n\n

    The following fields should be returned. We need to make especially sure that these are mapped correctly.\n
    - ARE YOU MARRIED OR IN A COMMON LAW RELATIONSHIP? YES: Unchecked 
    - ARE YOU MARRIED OR IN A COMMON LAW RELATIONSHIP? NO: Unchecked
    - IF THE SPOUSE IS DESIGNATED AS BENEFICIARY, THIS DESIGNATION IS: REVOCABLE: Unchecked 
IF THE SPOUSE IS DESIGNATED AS BENEFICIARY, THIS DESIGNATION IS: IRREVOCABLE: Unchecked     
    
    Return ONLY a valid JSON object with the original field names as keys and the cleaner names as values. No additional text, markdown formatting, or code block syntax.\n\n
    The response should be a plain JSON object like this:\n
    {\n  "Original Field 1": "cleanFieldName1",\n  "Original Field 2": "cleanFieldName2"\n}\n\n
    Do not include any explanations or any text outside the JSON object.`;
    
    // Use genkit to call Gemini API
    const response = await ai.generate(prompt);
    
    // Extract the response content
    const responseContent = response.text || response.toString();
    
    if (!responseContent) {
      throw new Error('No response from Gemini AI');
    }
    
    // Extract JSON from the response
    let jsonContent = responseContent;
    
    // Check if the response contains a markdown code block
    const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/;
    const match = responseContent.match(jsonRegex);
    
    if (match && match[1]) {
      jsonContent = match[1].trim();
    } else {
      // Try to find JSON object in the text
      const objectRegex = /\{[\s\S]*\}/;
      const objectMatch = responseContent.match(objectRegex);
      if (objectMatch) {
        jsonContent = objectMatch[0];
      }
    }
    
    // Parse the JSON response
    let fieldMappings: Record<string, string>;
    try {
      fieldMappings = JSON.parse(jsonContent) as Record<string, string>;
    } catch (parseError) {
      console.error('Error parsing JSON from Gemini response:', parseError);
      
      // Try to clean the JSON content
      const cleanedJson = jsonContent
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/,\s*}/g, '}');
      
      try {
        fieldMappings = JSON.parse(cleanedJson) as Record<string, string>;
      } catch (secondError) {
        console.error('Failed to parse JSON after cleaning:', secondError);
        throw new Error(`Failed to parse Gemini response as JSON: ${(secondError as Error).message}`);
      }
    }
    
    // Create the reverse mapping (clean to original)
    const reverseMapping: Record<string, string> = {};
    Object.entries(fieldMappings).forEach(([original, clean]) => {
      reverseMapping[clean] = original;
    });
    
    // Get field types and create metadata
    // Use the existing form instance from earlier
    const fieldMetadata = form.getFields().map(field => {
      const originalName = field.getName();
      const cleanName = fieldMappings[originalName] || originalName;
      let fieldType = 'text';
      let isRequired = false;
      
      // Determine field type
      if (field instanceof PDFTextField) {
        fieldType = 'text';
      } else if (field instanceof PDFCheckBox) {
        fieldType = 'checkbox';
      } else if (field instanceof PDFRadioGroup) {
        fieldType = 'radio';
      }
      
      // Determine category based on clean name patterns
      let category = 'other';
      if (cleanName.includes('spouse') || cleanName.includes('dependent')) {
        category = 'dependent';
      } else if (cleanName.includes('beneficiary')) {
        category = 'beneficiary';
      } else if (cleanName.includes('employment') || cleanName.includes('job') || 
                cleanName.includes('salary') || cleanName.includes('earnings') ||
                cleanName.includes('hours')) {
        category = 'employment';
      } else if (cleanName.includes('name') || cleanName.includes('address') || 
                cleanName.includes('birth') || cleanName.includes('email') ||
                cleanName.includes('phone') || cleanName.includes('gender')) {
        category = 'personal';
      } else if (cleanName.includes('coverage') || cleanName.includes('waiver') ||
                cleanName.includes('benefit') || cleanName.includes('plan')) {
        category = 'coverage';
      }
      
      return {
        originalName,
        cleanName,
        fieldType,
        isRequired,
        category
      };
    });
    
    // Analyze form structure
    const sections: string[] = [];
    const fieldGroups: Record<string, string[]> = {};
    
    // Extract sections based on field categories
    const categories = [...new Set(fieldMetadata.map(item => item.category))];
    categories.forEach(category => {
      if (category) {
        sections.push(category);
        fieldGroups[category] = fieldMetadata
          .filter(item => item.category === category)
          .map(item => item.cleanName);
      }
    });
    
    console.log('Field name mappings and metadata created successfully.');
    return { 
      originalToClean: fieldMappings, 
      cleanToOriginal: reverseMapping,
      fieldMetadata,
      totalFields: fieldNames.length,
      formStructure: {
        sections,
        fieldGroups
      }
    };
  } catch (error) {
    console.error('Error processing uploaded PDF:', error);
    return { 
      originalToClean: {}, 
      cleanToOriginal: {},
      fieldMetadata: [],
      totalFields: 0,
      formStructure: {
        sections: [],
        fieldGroups: {}
      }
    };
  }
}

/**
 * Enhanced input for the PDF filler with optional field mappings
 */
export interface EnhancedPdfFillerInput extends PdfFillerInput {
  /** Optional pre-processed field mappings */
  fieldMappings?: {
    /** Mapping from clean field names to original PDF field names */
    cleanToOriginal: Record<string, string>;
  };
}

/**
 * Fills a PDF template with form data using Gemini AI for guidance and pdf-lib for form filling
 * @param input The input containing the PDF template, form data, and optional field mappings
 * @returns The filled PDF as a data URI
 */
export async function fillPdfWithGemini(input: EnhancedPdfFillerInput): Promise<PdfFillerOutput> {
  try {
    console.log('Starting PDF filling process with Gemini AI and pdf-lib...');
    
    // Process form data - flatten nested arrays and ensure all values are strings
    const processedFormData = flattenFormData(input.formData);
    
    // Extract the base64 PDF data from the data URI
    const base64PdfData = input.pdfTemplateDataUri.replace(/^data:application\/pdf;base64,/, '');
    const pdfBytes = Uint8Array.from(atob(base64PdfData), c => c.charCodeAt(0));
    
    // Load the PDF document with enhanced error handling
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(pdfBytes, { 
        ignoreEncryption: true,
        updateMetadata: false,
        throwOnInvalidObject: false
      });
    } catch (pdfLoadError) {
      console.error('Error loading PDF document:', pdfLoadError);
      // Return the original PDF if we can't load it
      return {
        filledPdfDataUri: input.pdfTemplateDataUri
      };
    }
    
    // Get the form from the PDF with error handling
    let form: PDFForm;
    let fieldNames: string[] = [];
    
    try {
      form = pdfDoc.getForm();
      
      // Get all form fields
      fieldNames = form.getFields().map(field => field.getName());
    } catch (formError) {
      console.error('Error accessing form or fields:', formError);
      return {
        filledPdfDataUri: input.pdfTemplateDataUri
      };
    }
    
    if (fieldNames.length === 0) {
      console.log('No fillable form fields found in the PDF. Using Gemini AI to determine field positions...');
      // If no form fields are found, we'll need to create a new approach
      // For now, return the original PDF
      return {
        filledPdfDataUri: input.pdfTemplateDataUri
      };
    }
    
    console.log('Found form fields:', fieldNames);
    
    // Use provided field mappings if available, otherwise generate new ones with Gemini AI
    let fieldMappings: Record<string, string>;
    
    if (input.fieldMappings?.cleanToOriginal) {
      console.log('Using provided field mappings');
      // Convert clean names to original PDF field names
      fieldMappings = {};
      
      // First create a set of valid PDF field names for validation
      const validFieldNames = new Set(fieldNames);
      
      // Map the form data (using clean field names) to the original PDF field names
      Object.entries(processedFormData).forEach(([cleanFieldName, value]) => {
        const originalFieldName = input.fieldMappings?.cleanToOriginal[cleanFieldName];
        if (originalFieldName && validFieldNames.has(originalFieldName)) {
          fieldMappings[originalFieldName] = value;
        }
      });
      
      console.log('Created field mappings from provided mappings:', fieldMappings);
    } else {
      // No mappings provided, use Gemini AI to generate them
      console.log('No field mappings provided, generating with Gemini AI');
      fieldMappings = await getFieldMappings(fieldNames, processedFormData);
    }
    
    // Minimal logging
    const maritalStatus = processedFormData['maritalStatus'] || '';
    console.log(`Processing ${fieldNames.length} PDF fields with marital status: ${maritalStatus}`);
    
    // Track field processing success/failure
    let successCount = 0;
    let errorCount = 0;
    
    // Special handling for the marriage radio group
    try {
      // Common patterns for the marriage question field
      const marriageFieldPatterns = [
        'are you married',
        'common law relationship', 
        'marital status'
      ];
      
      // Find the marriage radio group field
      const marriageField = fieldNames.find(name => 
        marriageFieldPatterns.some(pattern => 
          name.toLowerCase().includes(pattern.toLowerCase())
        )
      );
      
      if (marriageField) {
        try {
          // Try to handle as a radio group
          const radioGroup = form.getRadioGroup(marriageField);
          const options = radioGroup.getOptions();
          
          // Check if user is married or in common law relationship
          const isMarriedOrCommonLaw = ['Married', 'Common-law'].includes(maritalStatus);
          
          // Find yes/no options in the radio group
          const yesOptions = options.filter(opt => 
            ['yes', 'Yes', 'YES', 'Y', 'y'].includes(opt));
          const noOptions = options.filter(opt => 
            ['no', 'No', 'NO', 'N', 'n'].includes(opt));
          
          // Select the appropriate option based on marital status
          if (yesOptions.length > 0 && noOptions.length > 0) {
            // We found both yes and no options with various capitalization
            if (isMarriedOrCommonLaw) {
              radioGroup.select(yesOptions[0]);
            } else {
              radioGroup.select(noOptions[0]);
            }
            radioGroup.defaultUpdateAppearances();
            successCount++;
          } else if (options.includes('yes') && options.includes('no')) {
            // Exact lowercase match case
            if (isMarriedOrCommonLaw) {
              radioGroup.select('yes');
            } else {
              radioGroup.select('no');
            }
            radioGroup.defaultUpdateAppearances();
            successCount++;
          } else if (options.length === 2) {
            // If options aren't exactly 'yes'/'no' but there are only 2 options,
            // assume first is 'yes' and second is 'no'
            if (isMarriedOrCommonLaw) {
              radioGroup.select(options[0]);
            } else {
              radioGroup.select(options[1]);
            }
            radioGroup.defaultUpdateAppearances();
            successCount++;
          }
        } catch (e) {
          errorCount++;
        }
      }
    } catch (marriageError) {
      // Silent fail for marriage field handling
    }
    
    // Filter out all null/undefined values from field mappings before processing
    const validFieldMappings = Object.fromEntries(
      Object.entries(fieldMappings).filter(([_, value]) => 
        value !== null && value !== undefined && 
        !(typeof value === 'string' && value.trim() === '')
      )
    );
    
    console.log(`Processing ${Object.keys(validFieldMappings).length} valid fields (${Object.keys(fieldMappings).length - Object.keys(validFieldMappings).length} null/empty fields skipped)`);
    
    // Special processing for dependent name fields to ensure first name comes before last name
    const fixedMappings = { ...validFieldMappings };
    
    // Look for fields that might contain dependent names
    const dependentNameFields = Object.keys(fixedMappings).filter(fieldName => {
      const lowerField = fieldName.toLowerCase();
      return (
        (lowerField.includes('dependent') || lowerField.includes('spouse')) && 
        (lowerField.includes('name') || lowerField.includes('last') || lowerField.includes('first'))
      );
    });
    
    // Log dependent name fields for debugging
    console.log('Found these potential dependent name fields:', dependentNameFields);
    
    // For each field containing dependent names, ensure it uses firstName lastName format
    dependentNameFields.forEach(fieldName => {
      // Check if this is a name field for a dependent
      if (fieldName.match(/dependent\d+_[^_]+$/) || fieldName.match(/spouse[^_]*$/)) {
        // Extract dependent/spouse number (if any)
        const match = fieldName.match(/dependent(\d+)_/) || fieldName.match(/spouse(\d*)/);
        const num = match ? match[1] || '1' : '1';
        
        // Try to find firstName and lastName for this dependent
        // Get from processedFormData which is already flattened
        const firstName = processedFormData[`dependent${num}_firstName`] || '';
        const lastName = processedFormData[`dependent${num}_lastName`] || '';
        
        if (firstName || lastName) {
          // Create name in firstName lastName format
          const formattedName = `${firstName} ${lastName}`.trim();
          console.log(`Formatting dependent ${num} name as: ${formattedName}`);
          
          // Override the field value to ensure firstName lastName format
          fixedMappings[fieldName] = formattedName;
        }
      }
    });
    
    // Special handling for spouse-related fields based on marital status
    // Only include spouse fields if marital status is Married or Common-law
    const isMarriedOrCommonLaw = ['Married', 'Common-law'].includes(maritalStatus);
    
    // Use the fixed mappings that ensure proper firstName lastName format for dependents
    Object.entries(fixedMappings).forEach(([fieldName, value]) => {
      try {
        // Skip spouse-related fields if not married/common-law
        const isSpouseField = fieldName.toLowerCase().includes('spouse') || 
                             (fieldName.toLowerCase().includes('dependent1') && !fieldName.toLowerCase().includes('dependent10'));
        
        if (isSpouseField && !isMarriedOrCommonLaw) {
          console.log(`Skipping spouse field due to marital status: ${fieldName}`);
          return;
        }
        
        // Try setting as a text field
        try {
          const textField = form.getTextField(fieldName);
          textField.setText(value);
          successCount++;
          return;
        } catch (textError) {
          // Not a text field, continue to next type
        }
        
        // Try setting as a radio group
        try {
          const radioGroup = form.getRadioGroup(fieldName);
          const options = radioGroup.getOptions();
          
          if (options.length > 0) {
            const normalizedValue = value.toLowerCase().trim();
            let selected = false;
            
            // First try exact match
            const exactMatch = options.find(option => 
              option.toLowerCase() === normalizedValue);
            if (exactMatch) {
              radioGroup.select(exactMatch);
              selected = true;
            }
            
            // If no exact match, try partial match
            else {
              const partialMatch = options.find(option => 
                option.toLowerCase().includes(normalizedValue) || 
                normalizedValue.includes(option.toLowerCase())
              );
              
              if (partialMatch) {
                radioGroup.select(partialMatch);
                selected = true;
              }
              
              // For yes/no fields with two options
              else if (options.length === 2) {
                if (['YES', 'Yes', 'yes', 'true', 'on', '1', 't', 'y'].includes(normalizedValue)) {
                  radioGroup.select(options[0]);
                  selected = true;
                } else if (['NO', 'No', 'no', 'false', 'off', '0', 'f', 'n'].includes(normalizedValue)) {
                  radioGroup.select(options[1]);
                  selected = true;
                }
              }
            }
            
            // Last resort: select first option if nothing else matched
            if (!selected) {
              radioGroup.select(options[0]);
            }

            // Always update appearances to ensure proper rendering in PDF
            radioGroup.defaultUpdateAppearances();
            successCount++;
            return;
          }
        } catch (radioError) {
          // Not a radio group, continue to next type
        }
        
        // Try setting as a checkbox
        try {
          const checkbox = form.getCheckBox(fieldName);
          const checkValue = value.toLowerCase();
          
          if (['YES', 'Yes', 'yes', 'true', 'on', 'checked', '1', 't', 'y'].includes(checkValue)) {
            checkbox.check();
          } else {
            checkbox.uncheck();
          }

          checkbox.defaultUpdateAppearances()

          successCount++;
          return;          
        } catch (checkboxError) {
          // Not a checkbox, continue to next type
        }
        
        // Try setting as a dropdown
        try {
          const dropdown = form.getDropdown(fieldName);
          const options = dropdown.getOptions();
          
          if (options.length > 0) {
            const normalizedValue = value.toLowerCase().trim();
            
            // First try exact match
            const exactMatch = options.find(option => 
              option.toLowerCase() === normalizedValue);
            if (exactMatch) {
              dropdown.select(exactMatch);
              successCount++;
              return;
            }
            
            // Try partial match
            const partialMatch = options.find(option => 
              option.toLowerCase().includes(normalizedValue) || 
              normalizedValue.includes(option.toLowerCase())
            );
            
            if (partialMatch) {
              dropdown.select(partialMatch);
              successCount++;
              return;
            }
            
            // Last resort: select first option
            dropdown.select(options[0]);
            successCount++;
            return;
          }
        } catch (dropdownError) {
          // Not a dropdown, continue
        }
        
        // If we got here, we couldn't handle the field
        errorCount++;
      } catch (error) {
        errorCount++;
      }
    });
    
    // Log a simple summary of the PDF filling process
    console.log(`PDF filling complete: ${successCount} fields filled successfully, ${errorCount} errors`);
    
    // Do not flatten the form as it can cause compatibility issues with Acrobat
    // form.flatten(); 
    
    // Try multiple approaches to save the PDF in a way that's compatible with Acrobat
    let filledPdfBytes;
    
    try {
      // First try: Save with compatibility options
      console.log('Saving PDF with compatibility options...');
      filledPdfBytes = await pdfDoc.save({
        addDefaultPage: false,
        useObjectStreams: false,  // This can help with compatibility issues
        updateFieldAppearances: true  // Update appearances of fields
      });
    } catch (error) {
      console.log('First save approach failed, trying alternative method:', error);
      
      try {
        // Second try: Save with minimal options
        filledPdfBytes = await pdfDoc.save();
      } catch (finalError) {
        console.error('All PDF saving approaches failed:', finalError);
        throw new Error('Unable to save the filled PDF');
      }
    }
    
    // Convert the filled PDF back to a data URI using a safer approach
    // that won't cause stack overflow with large PDFs
    const filledPdfBase64 = uint8ArrayToBase64(new Uint8Array(filledPdfBytes));
    
    // Ensure the base64 string is valid and clean
    // Remove any whitespace or line breaks that might cause issues
    const cleanBase64 = filledPdfBase64.replace(/\s/g, '');
    
    // Create a properly formatted data URI
    const filledPdfDataUri = `data:application/pdf;base64,${cleanBase64}`;
    
    console.log('PDF filling completed successfully with pdf-lib');
    return {
      filledPdfDataUri
    };
  } catch (error) {
    console.error('Error filling PDF with pdf-lib:', error);
    throw new Error(`Failed to fill PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Flattens nested arrays in form data into a one-dimensional object with indexed keys
 * @param formData The original form data with nested arrays
 * @returns A flattened version of the form data
 */
/**
 * Helper function to create a properly formatted name in firstName lastName format
 */
function formatNameCorrectly(firstName: string, lastName: string): string {
  firstName = String(firstName || '').trim();
  lastName = String(lastName || '').trim();
  return `${firstName} ${lastName}`.trim();
}

/**
 * Helper function to determine if the user has a spouse based on form data
 */
function hasSpouse(formData: Record<string, any>): boolean {
  // Check marital status and spouse information fields
  return (
    (formData.maritalStatus === 'Married' || formData.maritalStatus === 'Common-law') &&
    Boolean(formData.spouseFirstName && formData.spouseLastName)
  );
}

function flattenFormData(formData: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Process each key in the form data
  Object.entries(formData).forEach(([key, value]) => {
    // If the value is an array (like dependents or beneficiaries)
    if (Array.isArray(value)) {
      // Special handling for dependents array to ensure spouse is first
      if (key === 'dependents') {
        console.log('Processing dependents for PDF output');
        
        // Check if user has a spouse based on marital status
        const hasSpouse = formData.maritalStatus === 'Married' || formData.maritalStatus === 'Common-law';
        const hasSpouseData = Boolean(formData.spouseFirstName && formData.spouseLastName);
        
        if (hasSpouse && hasSpouseData) {
          console.log('User has a spouse, adding as first dependent in PDF');
          
          // Manually create the spouse entry as the first dependent
          result['dependent1_firstName'] = formData.spouseFirstName;
          result['dependent1_lastName'] = formData.spouseLastName;
          result['dependent1_dateOfBirth'] = formData.spouseDateOfBirth || '';
          result['dependent1_gender'] = formData.spouseGender || '';
          // Explicitly set relationship to Spouse ONLY for the spouse entry
          result['dependent1_relationship'] = 'Spouse';
          console.log('Setting dependent1_relationship to Spouse for the spouse entry');
          
          // Use the helper function to ensure correct name format
          result['dependent1_formattedName'] = formatNameCorrectly(formData.spouseFirstName, formData.spouseLastName);
          // Add explicit name order fields to avoid confusion
          result['dependent1_name'] = formatNameCorrectly(formData.spouseFirstName, formData.spouseLastName);
          result['dependent1_fullName'] = formatNameCorrectly(formData.spouseFirstName, formData.spouseLastName);
          
          // Process the actual dependents starting at index 2
          if (value.length > 0) {
            // Make a copy of the array to sort
            const dependentArray = [...value];
            
            // Sort dependents by birth date (oldest first)
            dependentArray.sort((a: any, b: any) => {
              // Skip sorting if dates are missing
              if (!a.dateOfBirth || !b.dateOfBirth) return 0;
              
              // Convert to Date objects
              const dateA = new Date(a.dateOfBirth);
              const dateB = new Date(b.dateOfBirth);
              
              // Sort oldest first
              return dateA.getTime() - dateB.getTime();
            });
            
            // Flatten each dependent starting at index 2
            dependentArray.forEach((dependent: any, idx: number) => {
              // Add 2 to index because spouse is at index 1
              const dependentIndex = idx + 2;
              
              // Process each property of the dependent
              Object.entries(dependent).forEach(([propKey, propValue]) => {
                if (propKey !== 'id') { // Skip the id field
                  // Store the property with the correct index
                  result[`dependent${dependentIndex}_${propKey}`] = String(propValue || '');
                  
                  // Add specific logging for relationship fields to debug
                  if (propKey === 'relationship') {
                    console.log(`Setting dependent${dependentIndex}_relationship to: ${propValue || 'empty'} (from form data)`);
                  }
                }
              });
              
              // Add formatted name
              if (dependent.firstName || dependent.lastName) {
                result[`dependent${dependentIndex}_formattedName`] = 
                  `${dependent.firstName || ''} ${dependent.lastName || ''}`.trim();
              }
            });
          }
          
          // We've handled dependents specially, so skip regular array processing
        } else {
          // No spouse, process dependents normally but still sort by age
          console.log('No spouse information available, processing dependents normally');
          
          // For normal dependent processing, just sort the array and process it normally
          let processedArray = [...value];
          
          if (processedArray.length > 0) {
            // Sort by date of birth if available
            processedArray.sort((a: any, b: any) => {
              if (!a.dateOfBirth || !b.dateOfBirth) return 0;
              return new Date(a.dateOfBirth).getTime() - new Date(b.dateOfBirth).getTime();
            });
            
            // Process each dependent
            processedArray.forEach((dependent: any, idx: number) => {
              const dependentIndex = idx + 1; // Start at 1 since no spouse
              
              // Process each property
              Object.entries(dependent).forEach(([propKey, propValue]) => {
                if (propKey !== 'id') { // Skip the id field
                  result[`dependent${dependentIndex}_${propKey}`] = String(propValue || '');
                }
              });
              
              // Add formatted name
              if (dependent.firstName || dependent.lastName) {
                result[`dependent${dependentIndex}_formattedName`] = 
                  `${dependent.firstName || ''} ${dependent.lastName || ''}`.trim();
              }
            });
          }
          
          // We've handled dependents specially, so skip regular array processing
        }
        
        // Skip the standard array processing for dependents since we've handled it specially
        return;
      }
      
      // For non-dependent arrays (like beneficiaries), process normally
      const processedArray = [...value];
      
      // Process each item in the array with an index
      processedArray.forEach((item: any, index: number) => {
        // If the item is an object, flatten its properties
        if (item && typeof item === 'object') {
          // Store firstName and lastName separately to format them correctly for name fields
          let firstName = '';
          let lastName = '';
          
          Object.entries(item).forEach(([subKey, subValue]) => {
            // Capture firstName and lastName
            if (subKey === 'firstName') firstName = String(subValue || '');
            if (subKey === 'lastName') lastName = String(subValue || '');
            
            // Create a key like dependent1_firstName or beneficiary2_percentage
            const flatKey = `${key.replace(/s$/, '')}${index + 1}_${subKey}`;
            
            // Format dates as YYYY/MM/DD
            if (subValue instanceof Date) {
              const date = subValue as Date;
              result[flatKey] = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
            } else {
              result[flatKey] = String(subValue || '');
            }
          });
          
          // Add a special formatted full name entry (firstName lastName)
          if (firstName || lastName) {
            const formattedName = `${firstName} ${lastName}`.trim();
            const nameKey = `${key.replace(/s$/, '')}${index + 1}_formattedName`;
            result[nameKey] = formattedName;
          }
        }
      });
    } else {
      // For regular values, just add them as is
      result[key] = String(value || '');
    }
  });
  
  console.log('Flattened form data:', result);
  return result;
}

/**
 * Uses Gemini AI to match form field names with the provided form data
 * @param fieldNames The names of the form fields in the PDF
 * @param formData The form data provided by the user
 * @returns A mapping of field names to values
 */
async function getFieldMappings(
  fieldNames: string[],
  formData: Record<string, any>
): Promise<Record<string, string>> {
  try {
    // Flatten nested arrays in form data (dependents, beneficiaries, etc.)
    const flattenedFormData = flattenFormData(formData);
        // Post-process the flattened form data to ensure firstName lastName format for names and correct relationship values
    // This will catch any cases where the formatting might be incorrect in the PDF
    const processedFormData = { ...flattenedFormData };
    
    // Process all dependent and beneficiary fields
    Object.keys(processedFormData).forEach(key => {
      // Check if this is a dependent/beneficiary field with firstName
      if (key.match(/dependent\d+_firstName/) || key.match(/beneficiary\d+_firstName/)) {
        const prefix = key.split('_')[0]; // e.g., 'dependent1' or 'beneficiary2'
        const prefixType = prefix.replace(/\d+$/, ''); // 'dependent' or 'beneficiary'
        const indexNum = parseInt(prefix.match(/\d+$/)?.[0] || '0', 10); // Get the numeric index
        
        // Get the individual field values
        const firstName = processedFormData[`${prefix}_firstName`] || '';
        const lastName = processedFormData[`${prefix}_lastName`] || '';
        const relationship = processedFormData[`${prefix}_relationship`] || '';
        
        // 1. Ensure proper name formatting (firstName lastName)
        if (firstName || lastName) {
          const formattedName = formatNameCorrectly(firstName, lastName);
          
          // Add multiple name variations to maximize correct mapping
          processedFormData[`${prefix}_formattedName`] = formattedName;
          processedFormData[`${prefix}_name`] = formattedName;
          processedFormData[`${prefix}_fullName`] = formattedName;
          console.log(`Formatted ${prefix} name as: "${formattedName}" (firstName lastName)`); 
        }
        
        // 2. Ensure relationship is correctly preserved
        if (prefixType === 'dependent') {
          // Only the first dependent should be marked as Spouse when applicable
          if (indexNum === 1 && hasSpouse(formData)) {
            // Special case: This is the first dependent and user has a spouse - set as Spouse
            processedFormData[`${prefix}_relationship`] = 'Spouse';
            console.log(`Setting ${prefix} relationship to Spouse explicitly`);
          } else if (relationship) {
            // For all other dependents, preserve their actual relationship
            console.log(`Preserving ${prefix} relationship as: ${relationship}`);
          }
        } else if (prefixType === 'beneficiary' && relationship) {
          // For beneficiaries, always preserve the relationship as entered in the form
          // Note: there's a special case when the beneficiary is a spouse where we auto-fill
          // but the relationship is already set correctly via the Select component
          console.log(`Preserving beneficiary relationship for ${prefix} as: ${relationship}`);
        }
      }
    });
    
    // Add explicit log to show all relationship fields for debugging
    const relationshipFields = Object.entries(processedFormData)
      .filter(([key]) => key.includes('relationship'))
      .map(([key, value]) => `${key}: ${value}`);
    console.log('All relationship fields:', relationshipFields);
    
    // Format the field names and form data for the prompt
    const fieldNamesString = fieldNames.join('\n');
    const formDataString = Object.entries(processedFormData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    // Create a prompt for Gemini to match fields
    const prompt = `You are an expert in reading PDF documents and forms, and matching form field names with provided data. I have a PDF form with the following field 
    names:\n\n${fieldNamesString}\n\nAnd I want to fill it with the following data:\n\n${formDataString}\n\n
    Please create a mapping of form field names to the appropriate data values. 
    Return ONLY a valid JSON object with no additional text, markdown formatting, or code block syntax. 
    The JSON should have the exact field names from the PDF as keys and the corresponding data values as values.\n\n
    The response should be a plain JSON object like this:\n
    {\n  "Field1": "Value1",\n  "Field2": "Value2"\n}\n\n
    Do not include any explanations, markdown formatting (like \`\`\`json), 
    or any text outside the JSON object.\n\n
    Pay special attention to these fields which must be mapped correctly if they exist in the PDF:\n
    - Personal Identification Number\n
    - Member Number\n
    - Annual Earnings\n
    - Dept/Div/Location\n
    - Department/Division/Location\n
    - Hours Per Week\n
    - Hours/Week\n
    - # of hours per week\n
    - Class\n\n

    Pay special attention to any text that appears near the form fields, it will help you to figure out where the data needs to be mapped to.

    "are you Married or in a coMMon laW relationship" is a checkbox that has "yes" or "no" options. The "yes" option in this checkbox in the PDF
    should be set if "maritalStatus" is "Married" or "Common Law".\n

    If "maritalStatus" is set to "Common Law", then "if coMMon laW please provide date of cohabitation yyyymmdd" should be set to "cohabitationDate"\n  

    The following fields need to be mapped to the "dependents"\n
    - list of dependents spouse then dependents oldest first last naMe first naMe2\n
    - Gender2\n
    - date of birth yyyymmdd2\n
    - list of dependents spouse then dependents oldest first last naMe first naMe2_2\n
    - Gender2_2\n
    - date of birth yyyymmdd2_2\n
    - SPOUSE2\n
    - list of dependents spouse then dependents oldest first last naMe first naMe2_3\n
    - Gender2_3\n
    - date of birth yyyymmdd2_3\n
    - SPOUSE2_2\n
    - list of dependents spouse then dependents oldest first last naMe first naMe2_4\n
    - Gender2_4\n
    - date of birth yyyymmdd2_4\n
    - SPOUSE2_3\n
    - list of dependents spouse then dependents oldest first last naMe first naMe2_5\n
    - Gender2_5\n
    - date of birth yyyymmdd2_5\n
    - SPOUSE2_4\n

    The last cell in each row for dependents will be the "Relationship" field - ensure this is populated correctly.\n

    If the spouse fields are empty, then the dependents list should start at " list of dependents spouse then dependents oldest first last naMe first naMe2_2".
    If the spouse fields are not empty, then they should be used for the first row of the Dependents.
    
    CRITICAL - NAME ORDER REQUIREMENT: All dependent and beneficiary names MUST ALWAYS be formatted as "firstName lastName" (first name FIRST, then last name) in the PDF, e.g. "John Smith", NOT "Smith John". 
    For ANY field in the PDF containing words like "naMe", "name", "Name", etc. in combination with "dependent", "beneficiary", or "spouse", you MUST use the format "firstName lastName".
    
    Specifically, for fields like "list of dependents spouse then dependents oldest first last naMe first naMe2_2" or similar patterns:
    - Even though the field name contains "last naMe first naMe", you MUST reverse this and use "firstName lastName" format in the output.
    - Always prioritize this name format requirement over any suggestions in the field name itself.
    - For example, if the form data has firstName="John" and lastName="Smith", the value should be "John Smith".
    
    This is a strict business requirement that cannot be violated under any circumstances.\n\n

    IMPORTANT FIELD MAPPINGS FOR HEALTH AND DENTAL COVERAGE:

    1. For fields named "Extended Health Care EHC" or any field containing "Extended Health Care", use the value from "waiveEHC".

    2. For fields named "Dental Care" or any field containing "Dental Care", use the value from "waiveDental".

    3. For "YN Coverage Level" fields or fields asking about coverage level with Yes/No options:
       - If the field appears directly after "Extended Health Care EHC" or is in an Extended Health Care section, use "otherEHCCoverage"
       - If the field appears directly after "Dental Care" or is in a Dental Care section, use "otherDentalCoverage"

    4. If "coverageLevel" is set to "O", then populate any fields asking about alternate coverage details:
       - Name of Employer/Plan Sponsor: use "alternativePlanSponsor"
       - Name of Insurer: use "alternativeInsurer"
       - Group/Policy Number: use "alternativeGroupNumber"

    5. Note that "waiveEHC" and "waiveDental" will have values of "Y" (for Yes) or "N" (for No).

    6. If you see a field called "EXTENDED HEALTH CARE EHC  DENTAL CARE" or similar, map it to "coverageLevel".

    HANDLING REVOCABLE/IRREVOCABLE BENEFICIARY DESIGNATION:

    For Quebec residents where "spouseBeneficiaryDesignation" is populated, there will be two checkbox fields in the PDF:
    - One for "revocable"
    - One for "irrevocable"

    Only check the box that matches the value of "spouseBeneficiaryDesignation":
    - If "spouseBeneficiaryDesignation" is "revocable", check ONLY the revocable checkbox
    - If "spouseBeneficiaryDesignation" is "irrevocable", check ONLY the irrevocable checkbox

    Look for fields with names containing terms like "revocable", "irrevocable", "designation", or "beneficiary designation" to find these checkboxes.    
    `;
    
    // Use genkit to call Gemini API
    const response = await ai.generate(prompt);
    
    // Extract the response content
    const responseContent = response.text || response.toString();
    
    if (!responseContent) {
      throw new Error('No response from Gemini AI');
    }
    
    console.log('Raw response from Gemini:', responseContent);
    
    // Extract JSON from the response which might be wrapped in markdown code blocks
    let jsonContent = responseContent;
    
    // Check if the response contains a markdown code block
    const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/;
    const match = responseContent.match(jsonRegex);
    
    if (match && match[1]) {
      // Extract the content inside the code block
      jsonContent = match[1].trim();
      console.log('Extracted JSON from code block:', jsonContent);
    } else {
      // Try to find JSON object in the text
      const objectRegex = /\{[\s\S]*\}/;
      const objectMatch = responseContent.match(objectRegex);
      if (objectMatch) {
        jsonContent = objectMatch[0];
        console.log('Extracted JSON object from text:', jsonContent);
      }
    }
    
    // Parse the JSON response with error handling
    let fieldMappings: Record<string, string>;
    try {
      fieldMappings = JSON.parse(jsonContent) as Record<string, string>;
    } catch (parseError) {
      console.error('Error parsing JSON from Gemini response:', parseError);
      console.log('Attempting to clean and fix the JSON content');
      
      // Try to clean the JSON content
      const cleanedJson = jsonContent
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/,\s*}/g, '}');
      
      try {
        fieldMappings = JSON.parse(cleanedJson) as Record<string, string>;
      } catch (error) {
        const secondError = error as Error;
        console.error('Failed to parse JSON after cleaning:', secondError);
        throw new Error(`Failed to parse Gemini response as JSON: ${secondError.message}`);
      }
    }
    
    // Post-process field mappings to fix SPOUSE2 fields for dependent relationships
    // This ensures the relationship values are correctly populated in the PDF
    // IMPORTANT: The relationship fields in the PDF start with SPOUSE2, which corresponds to the *second* dependent line,
    // not the first one. The first dependent line (for spouse) already has a hardcoded "Spouse" value in the PDF.
    
    // Clear all SPOUSE fields first to avoid incorrect mappings
    fieldMappings['SPOUSE2'] = '';
    fieldMappings['SPOUSE2_2'] = '';
    fieldMappings['SPOUSE2_3'] = '';
    fieldMappings['SPOUSE2_4'] = '';
    
    // Only map dependent relationships if they're not the spouse
    // Check both marital status AND if actual spouse information is present
    const hasSpouseInForm = (flattenedFormData.maritalStatus === 'Married' || flattenedFormData.maritalStatus === 'Common-law') &&
      Boolean(flattenedFormData.spouseFirstName && flattenedFormData.spouseLastName);
    
    console.log(`Spouse detection: maritalStatus=${flattenedFormData.maritalStatus}, spouseFirstName=${flattenedFormData.spouseFirstName || 'empty'}, hasSpouseInForm=${hasSpouseInForm}`);
    
    if (hasSpouseInForm) {
      // With a spouse present, dependent2 maps to SPOUSE2, dependent3 to SPOUSE2_2, etc.
      console.log('Spouse present in form. Mapping dependent relationships starting from second dependent');
      
      // Second dependent (index 2) maps to first SPOUSE2 field
      if (flattenedFormData.dependent2_relationship) {
        fieldMappings['SPOUSE2'] = flattenedFormData.dependent2_relationship;
        console.log(`Post-processing: Setting SPOUSE2 to ${flattenedFormData.dependent2_relationship} (from dependent2)`);
      }
      
      // Third dependent (index 3) maps to second SPOUSE2_2 field
      if (flattenedFormData.dependent3_relationship) {
        fieldMappings['SPOUSE2_2'] = flattenedFormData.dependent3_relationship;
        console.log(`Post-processing: Setting SPOUSE2_2 to ${flattenedFormData.dependent3_relationship} (from dependent3)`);
      }
      
      // Fourth dependent (index 4) maps to third SPOUSE2_3 field
      if (flattenedFormData.dependent4_relationship) {
        fieldMappings['SPOUSE2_3'] = flattenedFormData.dependent4_relationship;
        console.log(`Post-processing: Setting SPOUSE2_3 to ${flattenedFormData.dependent4_relationship} (from dependent4)`);
      }
    } else {
      // Without a spouse, dependent1 maps to SPOUSE2, dependent2 to SPOUSE2_2, etc.
      console.log('No spouse in form. Mapping dependent relationships starting from first dependent');
      
      // First dependent (index 1) maps to first SPOUSE2 field
      if (flattenedFormData.dependent1_relationship) {
        fieldMappings['SPOUSE2'] = flattenedFormData.dependent1_relationship;
        console.log(`Post-processing: Setting SPOUSE2 to ${flattenedFormData.dependent1_relationship} (from dependent1)`);
      }
      
      // Second dependent (index 2) maps to second SPOUSE2_2 field
      if (flattenedFormData.dependent2_relationship) {
        fieldMappings['SPOUSE2_2'] = flattenedFormData.dependent2_relationship;
        console.log(`Post-processing: Setting SPOUSE2_2 to ${flattenedFormData.dependent2_relationship} (from dependent2)`);
      }
      
      // Third dependent (index 3) maps to third SPOUSE2_3 field
      if (flattenedFormData.dependent3_relationship) {
        fieldMappings['SPOUSE2_3'] = flattenedFormData.dependent3_relationship;
        console.log(`Post-processing: Setting SPOUSE2_3 to ${flattenedFormData.dependent3_relationship} (from dependent3)`);
      }
    }
    
    // Log the mappings for debugging
    console.log('Field mappings determined by Gemini AI:', fieldMappings);
    return fieldMappings;
  } catch (error) {
    console.error('Error getting field mappings from Gemini AI:', error);
    
    // If there's an error, use our enhanced fallback mapping
    return createEnhancedFallbackMapping(fieldNames, formData);
  }
}

function createEnhancedFallbackMapping(
  fieldNames: string[],
  formData: Record<string, string>
): Record<string, string> {
  const fallbackMappings: Record<string, string> = {};
  
  // Add any simple mappings where the field names match
  Object.entries(formData).forEach(([key, value]) => {
    // Look for exact matches
    const exactMatchField = fieldNames.find(fieldName => 
      fieldName.toLowerCase() === key.toLowerCase());
      
    if (exactMatchField) {
      fallbackMappings[exactMatchField] = value;
      console.log(`Found exact match fallback: ${exactMatchField} -> ${value}`);
    }
    
    // Also look for fields that contain the key as a substring
    fieldNames.forEach(fieldName => {
      if (fieldName.toLowerCase().includes(key.toLowerCase()) && !fallbackMappings[fieldName]) {
        fallbackMappings[fieldName] = value;
        console.log(`Found substring match fallback: ${fieldName} -> ${value}`);
      }
    });
  });
  
  // Special handling for marital status field
  const maritalStatus = formData['maritalStatus'] || '';
  if (maritalStatus) {
    const marriageField = fieldNames.find(name => 
      name.toLowerCase().includes('are you married') || 
      name.toLowerCase().includes('are you married or in a common law relationship'));
      
    if (marriageField) {
      // Check if user is married or in common law
      const isMarriedOrCommonLaw = ['Married', 'Common-law'].includes(maritalStatus);
      
      // Set appropriate value
      fallbackMappings[marriageField] = isMarriedOrCommonLaw ? 'YES' : 'NO';
      console.log(`Added fallback for marriage field: ${marriageField} = ${fallbackMappings[marriageField]}`);
    }
  }
  
  return fallbackMappings;
}

/**
 * Safely converts a Uint8Array to a Base64 string without causing stack overflow
 * @param bytes The Uint8Array to convert
 * @returns A Base64 string representation of the array
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  // For Node.js environment, we could use Buffer, but for browser compatibility,
  // we'll use a more browser-friendly approach
  
  // First, collect all binary chunks
  const chunkSize = 8192; // Process in smaller chunks to avoid stack overflow
  const binaryChunks: string[] = [];
  
  // Convert each chunk to binary string
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    const binary = Array.from(chunk).map(b => String.fromCharCode(b)).join('');
    binaryChunks.push(binary);
  }
  
  // Combine all binary chunks into one string
  const completeBinary = binaryChunks.join('');
  
  // Convert the complete binary string to base64
  try {
    return btoa(completeBinary);
  } catch (e) {
    console.error('Error in base64 conversion:', e);
    
    // Fallback method for very large PDFs
    // This is less efficient but more reliable for large files
    let base64 = '';
    const smallerChunkSize = 1024;
    
    for (let i = 0; i < completeBinary.length; i += smallerChunkSize) {
      const chunk = completeBinary.slice(i, i + smallerChunkSize);
      base64 += btoa(chunk);
    }
    
    return base64;
  }
}

/**
 * Converts a Base64 string to a Uint8Array
 * @param base64 The Base64 string to convert
 * @returns A Uint8Array representation of the Base64 string
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Integrated workflow for processing and filling PDFs with Gemini AI
 * This function streamlines the process of analyzing a PDF form and filling it with data
 * 
 * @param templatePdfDataUri The PDF template as a data URI
 * @param formData The form data to fill the PDF with
 * @param options Optional configuration options
 * @returns Object containing the filled PDF, field mappings and form analysis
 */
export async function processAndFillPdf(
  templatePdfDataUri: string,
  formData: Record<string, string | boolean | number | Date>,
  options: {
    skipProcessing?: boolean; // Skip the processing step if field mappings are already known
    existingMappings?: PdfProcessingResult; // Reuse existing mappings
  } = {}
): Promise<{
  filledPdfDataUri: string;
  pdfAnalysis: PdfProcessingResult;
  debugInfo?: any;
}> {
  console.log('Starting integrated PDF processing and filling workflow...');
  
  // Process form data to ensure all values are strings
  const processedFormData: Record<string, string> = {};
  Object.entries(formData).forEach(([key, value]) => {
    if (value instanceof Date) {
      // Format date as YYYY/MM/DD
      processedFormData[key] = `${value.getFullYear()}/${String(value.getMonth() + 1).padStart(2, '0')}/${String(value.getDate()).padStart(2, '0')}`;
    } else {
      processedFormData[key] = String(value);
    }
  });
  
  let pdfAnalysis: PdfProcessingResult;
  
  // Step 1: Process the PDF to get field mappings (if needed)
  if (options.existingMappings && options.skipProcessing) {
    console.log('Using existing PDF analysis and field mappings');
    pdfAnalysis = options.existingMappings;
  } else {
    console.log('Processing PDF to extract and clean field names...');
    pdfAnalysis = await processUploadedPdf(templatePdfDataUri);
  }
  
  // Step 2: Fill the PDF with the processed form data using the field mappings
  console.log('Filling PDF with form data using field mappings...');
  const filledPdfResult = await fillPdfWithGemini({
    pdfTemplateDataUri: templatePdfDataUri,
    formData: processedFormData,
    fieldMappings: {
      cleanToOriginal: pdfAnalysis.cleanToOriginal
    }
  });
  
  console.log('PDF processing and filling completed successfully');
  return {
    filledPdfDataUri: filledPdfResult.filledPdfDataUri,
    pdfAnalysis,
    debugInfo: {
      totalFields: pdfAnalysis.totalFields,
      fieldsMapped: Object.keys(pdfAnalysis.cleanToOriginal).length
    }
  };
}