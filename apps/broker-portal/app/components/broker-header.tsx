'use client';

import Link from 'next/link';

const brokerNavItems = [
  { href: '/quoting', label: 'Quoting' },
  { href: '/upload-documents', label: 'Upload Documents' },
  { href: '/client-list', label: 'Client List' },
];

export function BrokerHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
            <title>Briefcase</title>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <span>Benee-fit Broker Portal</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
          {brokerNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
            >
              {item.label}
            </Link>
          ))}
          <div className="ml-4 flex items-center gap-4">
            <Link href="#" className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Account</span>
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <title>User</title>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </Link>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <button 
            type="button" 
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            onClick={() => {
              const mobileMenu = document.getElementById('mobile-menu');
              if (mobileMenu) {
                mobileMenu.classList.toggle('hidden');
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <title>Menu</title>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span className="sr-only">Toggle navigation menu</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div id="mobile-menu" className="hidden md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 border-b">
          {brokerNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
