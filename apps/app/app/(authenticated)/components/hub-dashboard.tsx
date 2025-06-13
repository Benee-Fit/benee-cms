'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  BarChart3,
  FileText,
  Users,
  FileCheck,
  Settings,
  CreditCard,
  Building2,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface HubSection {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  isExternal?: boolean;
}

const sections: HubSection[] = [
  {
    title: 'Broker Portal',
    description: 'Manage revenue, clients, and industry insights for your brokerage.',
    href: '/broker-portal',
    icon: BarChart3,
    color: 'blue',
  },
  {
    title: 'HR Portal',
    description: 'Access employee benefits, claims history, and enrollment tools.',
    href: 'http://localhost:9002',
    icon: Building2,
    color: 'green',
    isExternal: true,
  },
  {
    title: 'New Quote',
    description: 'Start a new insurance quote analysis with AI-powered document parsing.',
    href: '/quote-tool',
    icon: FileText,
    color: 'purple',
  },
  {
    title: 'Reports',
    description: 'View and manage all your generated reports and analyses.',
    href: '/quote-tool/reports',
    icon: FileCheck,
    color: 'orange',
  },
  {
    title: 'User Settings',
    description: 'Manage your profile, preferences, and account settings.',
    href: '/settings',
    icon: Settings,
    color: 'gray',
  },
  {
    title: 'Billing',
    description: 'View subscription details, invoices, and payment methods.',
    href: '/billing',
    icon: CreditCard,
    color: 'pink',
  },
];

export function HubDashboard() {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 hover:bg-blue-100',
        icon: 'text-blue-600',
        border: 'border-blue-200 hover:border-blue-300',
      },
      green: {
        bg: 'bg-green-50 hover:bg-green-100',
        icon: 'text-green-600',
        border: 'border-green-200 hover:border-green-300',
      },
      purple: {
        bg: 'bg-purple-50 hover:bg-purple-100',
        icon: 'text-purple-600',
        border: 'border-purple-200 hover:border-purple-300',
      },
      orange: {
        bg: 'bg-orange-50 hover:bg-orange-100',
        icon: 'text-orange-600',
        border: 'border-orange-200 hover:border-orange-300',
      },
      gray: {
        bg: 'bg-gray-50 hover:bg-gray-100',
        icon: 'text-gray-600',
        border: 'border-gray-200 hover:border-gray-300',
      },
      pink: {
        bg: 'bg-pink-50 hover:bg-pink-100',
        icon: 'text-pink-600',
        border: 'border-pink-200 hover:border-pink-300',
      },
    };

    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Benee CMS</h1>
        <p className="text-gray-600">Select a portal or tool to get started</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Active Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-blue-900">12</span>
              <span className="flex items-center text-sm text-blue-700">
                <TrendingUp className="h-3 w-3 mr-1" />
                +3 this week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-green-900">248</span>
              <span className="flex items-center text-sm text-green-700">
                <Users className="h-3 w-3 mr-1" />
                Active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Revenue MTD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-purple-900">$42.5k</span>
              <span className="flex items-center text-sm text-purple-700">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Reports Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-orange-900">89</span>
              <span className="text-sm text-orange-700">This month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => {
          const colorClasses = getColorClasses(section.color);
          const Component = section.isExternal ? 'a' : Link;
          const props = section.isExternal 
            ? { href: section.href, target: '_blank', rel: 'noopener noreferrer' }
            : { href: section.href };

          return (
            <Component
              key={section.title}
              {...props}
              className="block transition-all duration-200 transform hover:scale-105"
            >
              <Card className={`h-full border-2 ${colorClasses.border} ${colorClasses.bg} cursor-pointer`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <section.icon className={`h-8 w-8 ${colorClasses.icon}`} />
                    {section.isExternal && (
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        External
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  <CardDescription className="text-gray-700">
                    {section.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Component>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">New quote analysis completed</p>
                    <p className="text-xs text-gray-500">ABC Corporation - 2 minutes ago</p>
                  </div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Client added to portfolio</p>
                    <p className="text-xs text-gray-500">XYZ Industries - 1 hour ago</p>
                  </div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FileCheck className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Report shared with client</p>
                    <p className="text-xs text-gray-500">Tech Startup Inc - 3 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}