import { env } from '@/env';
import { Status } from '@repo/observability/status';
import Link from 'next/link';

export const Footer = () => {
  const navigationItems = [
    {
      title: 'Home',
      href: '/',
      description: '',
    },
    {
      title: 'Pages',
      description: 'Managing a small business today is already tough.',
      items: [],
    },
    {
      title: 'Legal',
      description: 'We stay on top of the latest legal requirements.',
      items: [
        {
          title: 'Privacy Policy',
          href: '/legal/privacy',
        },
        {
          title: 'Terms of Service',
          href: '/legal/terms',
        },
      ],
    },
  ];

  if (env.NEXT_PUBLIC_DOCS_URL) {
    navigationItems.at(1)?.items?.push({
      title: 'Docs',
      href: env.NEXT_PUBLIC_DOCS_URL,
    });
  }

  return (
    <section className="dark border-foreground/10 border-t">
      <div className="w-full bg-background py-20 text-foreground lg:py-40">
        <div className="container mx-auto">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="flex flex-col items-start gap-8">
              <div className="flex flex-col gap-2">
                <h2 className="max-w-xl text-left font-regular text-3xl tracking-tighter md:text-5xl">
                  next-forge
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
              {navigationItems.map((item) => (
                <div key={item.title} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {item.description}
                    </p>
                  </div>
                  {item.items && item.items.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.href}
                          className="text-muted-foreground text-sm hover:text-foreground hover:underline"
                          href={subItem.href}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 flex justify-between border-t border-muted/10 pt-10">
            <div>
              <Status />
            </div>
            <div className="text-muted-foreground text-sm">
              {new Date().getFullYear()} All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
