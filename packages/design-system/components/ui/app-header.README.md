# Shared AppHeader Component

The AppHeader is a globally shared header component used across all Benee-fit portals, including:
- Broker Portal
- HR Portal
- My Apps/App

## Features

- Consistent branding and navigation experience across portals
- Mobile-responsive design with hamburger menu for smaller screens
- User authentication status and profile management
- Customizable navigation links per portal
- Proper authentication integration with Clerk

## Usage

```tsx
import { AppHeader } from '@repo/design-system';

// Define portal-specific navigation items
const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/settings', label: 'Settings' },
];

// Implement in your layout
export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader 
        portalName="Benee-fit Portal Name" 
        navItems={navItems} 
        afterSignOutUrl="/sign-in" 
      />
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| portalName | string | Yes | Name of the portal to display in the header |
| navItems | Array<{ href: string; label: string }> | No | Navigation links to display |
| afterSignOutUrl | string | No | URL to redirect to after signing out (defaults to "/sign-in") |
| additionalElements | ReactNode | No | Additional elements to render in the header |

## Implementation Notes

- Uses `@repo/auth/client` for authentication components
- Responsive design adapts to mobile and desktop views
- Follows the design system styling and conventions
