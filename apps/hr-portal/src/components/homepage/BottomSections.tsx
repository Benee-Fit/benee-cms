'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Phone, Mail, LogIn, ExternalLink, FileText, Building2, Calendar, FileCode, ShieldCheck } from 'lucide-react';

/*
  Carriers
  Policy Numbers
  Renewal Dates
  Carrier Portal Login
*/



const planSummaryItems = [
  { 
    label: 'Carriers', 
    detail: 'Canada Life',
    isLink: false,
    href: undefined, 
    icon: Building2 
  },
  { 
    label: 'Policy Numbers', 
    detail: 'CL-56789-01',
    isLink: false,
    href: undefined, 
    icon: FileCode 
  },
  { 
    label: 'Renewal Dates', 
    detail: 'January 1, 2026',
    isLink: false,
    href: undefined, 
    icon: Calendar 
  },
  { 
    label: 'Carrier Portal Login', 
    detail: 'Access your benefits',
    isLink: true,
    href: 'https://www.canadalife.com/sign-in.html', 
    icon: ShieldCheck 
  },
];

const contactInfo = {
  broker: { name: 'Alice Broker', phone: '555-0101', email: 'alice.broker@example.com' },
  assistant: { name: 'Bob Assistant', phone: '555-0102', email: 'bob.assistant@example.com' },
  carrier: { name: 'HealthNet Insurers', phone: '800-555-CARRIER', email: 'support@healthnet.example', login: 'https://carrier.example.com/login' },
};

export function BottomSections() {
  return (
    <section className="py-8 md:py-12">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Plan Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {planSummaryItems.map((item, index) => (
                <li key={index}>
                  {item.isLink ? (
                    <Link href={item.href || '#'} className="flex items-start gap-3 group">
                      <div className="mt-0.5 text-primary">
                        <item.icon size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-primary group-hover:underline flex items-center gap-1">
                          {item.label}
                          <ExternalLink size={14} className="inline-block ml-1" />
                        </span>
                        <span className="text-sm text-muted-foreground">{item.detail}</span>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-primary">
                        <item.icon size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-primary">{item.label}</span>
                        <span className="text-sm text-muted-foreground">{item.detail}</span>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-primary">Broker: {contactInfo.broker.name}</h4>
              <p className="text-sm text-muted-foreground flex items-center mt-1">
                <Phone className="mr-2 h-4 w-4" /> {contactInfo.broker.phone}
              </p>
              <p className="text-sm text-muted-foreground flex items-center">
                <Mail className="mr-2 h-4 w-4" /> <a href={`mailto:${contactInfo.broker.email}`} className="hover:underline">{contactInfo.broker.email}</a>
              </p>
            </div>
            <div>
              <h4 className="font-medium text-primary">Assistant: {contactInfo.assistant.name}</h4>
              <p className="text-sm text-muted-foreground flex items-center mt-1">
                <Phone className="mr-2 h-4 w-4" /> {contactInfo.assistant.phone}
              </p>
              <p className="text-sm text-muted-foreground flex items-center">
                <Mail className="mr-2 h-4 w-4" /> <a href={`mailto:${contactInfo.assistant.email}`} className="hover:underline">{contactInfo.assistant.email}</a>
              </p>
            </div>
            <div>
              <h4 className="font-medium text-primary">Carrier: {contactInfo.carrier.name}</h4>
              <p className="text-sm text-muted-foreground flex items-center mt-1">
                <Phone className="mr-2 h-4 w-4" /> {contactInfo.carrier.phone}
              </p>
              <p className="text-sm text-muted-foreground flex items-center">
                <Mail className="mr-2 h-4 w-4" /> <a href={`mailto:${contactInfo.carrier.email}`} className="hover:underline">{contactInfo.carrier.email}</a>
              </p>
              <p className="text-sm text-muted-foreground flex items-center">
                <LogIn className="mr-2 h-4 w-4" /> <a href={contactInfo.carrier.login} target="_blank" rel="noopener noreferrer" className="hover:underline">Login Details</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
