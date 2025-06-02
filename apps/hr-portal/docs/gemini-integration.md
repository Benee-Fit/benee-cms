# Gemini AI PDF Form Filler Integration

This document explains how to set up and use the Google Gemini AI integration for intelligent PDF form filling in the HR Portal.

## Overview

The HR Portal now includes an AI-powered form filling capability that uses Google's Gemini AI to intelligently map user-provided information to PDF form fields. This results in more accurate form completion, especially for complex forms with many fields.

## Setup Instructions

1. **Get a Google AI API Key**:
   - Visit the [Google AI Studio](https://ai.google.dev/) and sign up for an account
   - Create a new API key in the Google AI Studio console
   - Copy your API key

2. **Add the API Key to Environment Variables**:
   - Open your `.env` file in the project root
   - Add the following line:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```
   - Restart your development server

## How It Works

1. When a user uploads a PDF form template, the system extracts all form field names
2. When the user fills out the form in the HR Portal, Gemini AI analyzes both:
   - The PDF form field names
   - The user-provided form data
3. Gemini creates intelligent mappings between user data and PDF fields
4. The system fills the PDF with the mapped data
5. The user can download the completed PDF

## Fallback Mechanism

If the Gemini API key is not configured or if there's an error with the AI service, the system will automatically fall back to the basic PDF filler, which uses simple string matching to map fields.

## Benefits

- **Improved Accuracy**: Gemini understands the semantic meaning of fields, not just exact text matches
- **Handles Complex Forms**: Works well with forms that have unclear field names or complex structures
- **Reduces Manual Work**: Users don't need to manually match their data to specific PDF fields

## Technical Implementation

The integration consists of:

- `gemini-config.ts`: Configuration for the Gemini AI API
- `gemini-pdf-filler.ts`: The main implementation that uses Gemini to fill PDFs
- Integration with the existing form filler UI in the Enrolment section

## Troubleshooting

If you encounter issues with the Gemini integration:

1. Check that your API key is correctly set in the `.env` file
2. Ensure you have the required dependencies installed (`@google/generative-ai`)
3. Check the browser console for any error messages
4. The system will automatically fall back to basic PDF filling if Gemini is unavailable
