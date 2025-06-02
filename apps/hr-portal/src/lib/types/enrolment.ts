import type { z, ZodTypeAny } from 'zod';

export interface FormFieldConfig<T extends ZodTypeAny> {
  id: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'date' | 'number' | 'tel' | 'select' | 'section' | 'checkbox' | 'repeater' | 'hidden' | 'message';
  placeholder?: string;
  options?: string[] | Array<{label: string; value: string}>;
  validation: T;
  defaultValue?: string | number | boolean;
  messageLevel?: 'warning' | 'message' | 'error'; // For message type fields
  conditionalDisplay?: {
    field: string;
    value: string | boolean | number;
  } | Array<{
    field: string;
    value: string | boolean | number;
    operator?: 'AND' | 'OR';
  }>;
  maxItems?: number; // For repeater fields
  templateFields?: string[]; // IDs of template fields for repeater
  labelVisible?: boolean; // Controls whether label is visible or sr-only
  wrapperClass?: string; // CSS class for the field wrapper div
}

// Example of how to create a schema from FormFieldConfig array
export type FormValues = Record<string, string | number | undefined>;

export type AppStage = 'fill_form' | 'generating_pdf' | 'download_pdf' | 'error';
