# Onboarding Temporarily Disabled

The onboarding flow has been temporarily disabled for the main app.

## How to Re-enable Onboarding

1. **Via Environment Variable (Recommended)**:
   - Set `NEXT_PUBLIC_DISABLE_ONBOARDING=false` in your `.env.local` file
   - Or remove the environment variable entirely

2. **The onboarding check is now controlled by**:
   - Environment variable: `NEXT_PUBLIC_DISABLE_ONBOARDING`
   - When set to "true", onboarding is bypassed
   - When set to "false" or not set, onboarding works normally

## What Was Changed

1. Updated `OrganizationCheck` component to support environment variable toggle
2. Added `NEXT_PUBLIC_DISABLE_ONBOARDING` to `.env.example` and `.env.local`
3. All onboarding code remains intact and functional

## Notes

- Users will be able to access the dashboard directly without completing onboarding
- The onboarding route (`/onboarding`) is still accessible if needed
- Organization data will not be automatically populated for new users