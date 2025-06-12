import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@repo/design-system/components/ui/breadcrumb';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';

type BreadcrumbRoute = {
  label: string;
  href?: string;
};

type HeaderProps = {
  pages: string[] | BreadcrumbRoute[];
  page: string;
  children?: ReactNode;
};

// Helper function to generate href from page label
const generateHref = (pageLabel: string, index: number): string => {
  const baseRoutes: Record<string, string> = {
    Dashboard: '/',
    'Quote Tool': '/quote-tool',
    'Document Parser': '/quote-tool/document-parser',
    'Plan Selection': '/quote-tool/plan-selection',
    Reports: '/quote-tool/reports',
    'Broker Portal': '/broker-portal',
    'HR Portal': '/hr-portal',
  };

  return (
    baseRoutes[pageLabel] || `/${pageLabel.toLowerCase().replace(/\s+/g, '-')}`
  );
};

export const Header = ({ pages, page, children }: HeaderProps) => (
  <header className="flex min-h-[48px] items-center justify-between gap-4 border-b border-border/40 bg-white px-6 py-5 rounded-lg mb-4">
    <div className="flex items-center flex-1">
      <Breadcrumb>
        <BreadcrumbList className="flex items-center gap-2">
          {/* Home icon for root */}
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="flex items-center hover:text-primary transition-colors"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {pages.map((pageItem, index) => {
            const isObject = typeof pageItem === 'object';
            const label = isObject ? pageItem.label : pageItem;
            const href = isObject ? pageItem.href : generateHref(label, index);
            const isLastBeforeCurrent = index === pages.length - 1;

            return (
              <Fragment key={label}>
                <BreadcrumbSeparator className="text-slate-400">
                  <ChevronRight className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
                <BreadcrumbItem
                  className={
                    index === 0 || isLastBeforeCurrent ? '' : 'hidden sm:block'
                  }
                >
                  <BreadcrumbLink
                    asChild
                    className="hover:text-primary transition-colors font-medium"
                  >
                    <Link href={href || '#'}>{label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Fragment>
            );
          })}

          <BreadcrumbSeparator className="text-slate-400">
            <ChevronRight className="h-3.5 w-3.5" />
          </BreadcrumbSeparator>

          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold text-slate-900">
              {page}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>

    {children && <div className="flex items-center">{children}</div>}
  </header>
);
