# Broker Onboarding Flow

A comprehensive 6-step onboarding flow for brokers to set up their organization and connect with the Benee CMS platform.

**Location:** `apps/app/app/onboarding/`

## Overview

The onboarding flow guides new users through:

1. **Welcome & Introduction** - Platform overview and benefits
2. **Personal Information** - User profile setup
3. **Organization Details** - Company information and branding
4. **Team Configuration** - Invite team members with role-based permissions
5. **Specialization & Focus** - Business focus and carrier preferences
6. **Verification & Finalization** - Terms acceptance and account completion

## Features

### ✅ Implemented
- **Multi-step progress indicator** with visual feedback
- **Form validation** with real-time error handling
- **Data persistence** across steps
- **Responsive design** that works on all devices
- **Save & continue later** functionality (placeholder)
- **File upload** for profile photos and logos
- **Role-based team management** with permissions
- **Professional UI** matching existing design system

### 🚧 Pending Integration
- **Clerk Authentication** - Organization creation and user management
- **Database Storage** - Persisting onboarding data
- **Email Verification** - Account activation workflow
- **Team Invitations** - Automated email invitations
- **Post-onboarding Setup** - Dashboard personalization

## File Structure

```
onboarding/
├── page.tsx                    # Main onboarding orchestrator
├── components/
│   ├── onboarding-container.tsx    # Layout wrapper
│   ├── onboarding-progress.tsx     # Progress indicator
│   └── onboarding-navigation.tsx   # Step navigation
└── steps/
    ├── welcome-step.tsx            # Step 1: Welcome
    ├── personal-info-step.tsx      # Step 2: Personal Info
    ├── organization-step.tsx       # Step 3: Organization
    ├── team-step.tsx              # Step 4: Team Setup
    ├── specialization-step.tsx    # Step 5: Specialization
    └── verification-step.tsx      # Step 6: Verification
```

## Usage

Navigate to `/onboarding` to start the flow. The component manages all state internally and provides a complete user experience.

### Data Model

The onboarding collects:

```typescript
interface OnboardingData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  profilePhoto?: File;
  
  // Organization Details
  organizationName: string;
  organizationLogo?: File;
  organizationType: string;
  companySize: string;
  website: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Team Configuration
  teamMembers: Array<{
    email: string;
    role: string;
    permissions: string[];
  }>;
  
  // Specialization
  linesOfBusiness: string[];
  clientIndustries: string[];
  averageClientSize: string;
  preferredCarriers: string[];
}
```

## Next Steps

1. **Clerk Integration** - Connect organization creation API
2. **Database Schema** - Create tables for storing onboarding data
3. **Email Service** - Set up verification and invitation emails
4. **Dashboard Personalization** - Use collected data to customize experience
5. **Analytics** - Track conversion rates and drop-off points

## Customization

The flow is designed to be easily customizable:

- **Add/Remove Steps** - Modify the step array in `page.tsx`
- **Update Fields** - Edit individual step components
- **Change Styling** - All components use the design system
- **Modify Logic** - Update validation and navigation rules

## Accessibility

- Keyboard navigation support
- Screen reader compatible
- Proper ARIA labels
- Focus management
- Color contrast compliance