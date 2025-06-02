import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Briefcase } from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

const navItems = [
  { href: '/claims-history', label: 'Claims History' },
  { href: '/employee-trends', label: 'Employee Trends' },
  { href: '/enrolment', label: 'Enrolment' },
  { href: '/document-library', label: 'Document Library' },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Briefcase className="h-6 w-6" />
          <span>Benee-fit HR Portal</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
          <SignedIn>
            {/*navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))*/}
          </SignedIn>
          <div className="ml-4 flex items-center gap-4">
            <UserButton />
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="grid gap-6 text-lg font-medium mt-6">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary mb-4">
                  <Briefcase className="h-6 w-6" />
                  <span>Benee-fit HR Portal</span>
                </Link>
                { navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 border-t mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Account</span>
                  <UserButton />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
