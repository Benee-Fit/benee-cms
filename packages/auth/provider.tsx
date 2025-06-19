'use client';

import { ClerkProvider } from '@clerk/nextjs';
import type { ComponentProps } from 'react';

type AuthProviderProperties = ComponentProps<typeof ClerkProvider> & {
  privacyUrl?: string;
  termsUrl?: string;
  helpUrl?: string;
};

export const AuthProvider = ({
  privacyUrl,
  termsUrl,
  helpUrl,
  ...properties
}: AuthProviderProperties) => {
  return (
    <ClerkProvider
      {...properties}
      appearance={{
        elements: {
          header: 'hidden',
          dividerLine: 'bg-border',
          socialButtonsIconButton: 'bg-card',
          navbarButton: 'text-foreground',
          organizationSwitcherTrigger__open: 'bg-background',
          organizationPreviewMainIdentifier: 'text-foreground',
          organizationSwitcherTriggerIcon: 'text-muted-foreground',
          organizationPreview__organizationSwitcherTrigger: 'gap-2',
          organizationPreviewAvatarContainer: 'shrink-0',
        },
        variables: {
          fontFamily: 'var(--font-sans)',
          fontFamilyButtons: 'var(--font-sans)',
          fontWeight: {
            bold: 'var(--font-weight-bold)',
            normal: 'var(--font-weight-normal)',
            medium: 'var(--font-weight-medium)',
          },
        },
        layout: {
          privacyPageUrl: privacyUrl,
          termsPageUrl: termsUrl,
          helpPageUrl: helpUrl,
        },
      }}
    />
  );
};
