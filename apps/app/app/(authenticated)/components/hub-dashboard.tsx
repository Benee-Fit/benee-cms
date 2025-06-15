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
  Bot,
  Building2,
  ChevronRight,
  Clock,
  CreditCard,
  FileCheck,
  FileText,
  type LucideIcon,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';

interface FavoriteApp {
  title: string;
  href: string;
  icon: LucideIcon;
  isExternal?: boolean;
}

const favoriteApps: FavoriteApp[] = [
  {
    title: 'Broker Portal',
    href: process.env.NEXT_PUBLIC_BROKER_PORTAL_URL || '/broker-portal',
    icon: BarChart3,
    isExternal: true,
  },
  {
    title: 'HR Portal',
    href: process.env.NEXT_PUBLIC_HR_PORTAL_URL || '/hr-portal',
    icon: Building2,
    isExternal: true,
  },
  {
    title: 'Quote Tool',
    href: '/quote-tool',
    icon: FileText,
  },
  {
    title: 'Saved Quotes',
    href: '/quote-tool/reports',
    icon: FileCheck,
  },
  {
    title: 'Account Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Billing',
    href: '/billing',
    icon: CreditCard,
  },
];

export function HubDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="relative px-6 pt-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-semibold text-gray-900 mb-6">
            Hello, Sameer.
          </h1>

          {/* Quick Launch */}
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
              {favoriteApps.map((app) => {
                const Component = app.isExternal ? 'a' : Link;
                const props = app.isExternal
                  ? {
                      href: app.href,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    }
                  : { href: app.href };

                return (
                  <Component
                    key={app.title}
                    {...props}
                    className="group flex flex-col items-center justify-center px-2 py-4 rounded-lg hover:bg-white/70 hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-100"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-gray-200 group-hover:scale-105 transition-all duration-200">
                      <app.icon className="h-7 w-7 text-gray-700 group-hover:text-blue-600 transition-colors duration-200" />
                    </div>
                    <span className="text-md text-center font-medium text-gray-800">
                      {app.title}
                    </span>
                  </Component>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - News Cards */}
          <div className="lg:col-span-2 flex flex-col space-y-6">
            {/* Dashboard Overview */}
            <Card>
              <CardContent>
                <div className="grid grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">
                      Active Quotes
                    </div>
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-xs text-gray-500">This Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">
                      Total Clients
                    </div>
                    <div className="text-2xl font-bold">248</div>
                    <div className="text-xs text-gray-500">
                      Active Portfolio
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">
                      Revenue MTD
                    </div>
                    <div className="text-2xl font-bold">$42.5k</div>
                    <div className="text-xs text-gray-500">
                      +12% vs last month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* News Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-200 py-0">
                <div className="h-32 bg-gray-800 relative">
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="text-lg font-semibold">Benee CMS</div>
                    <div className="text-sm opacity-90">
                      The Future of Insurance Technology
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">
                    Celebrating Innovation Together
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Benee CMS revolutionizes insurance workflows with AI-powered
                    document analysis and seamless client management.
                  </p>
                  <Link
                    href="/broker-portal"
                    className="text-sm text-gray-600 hover:text-blue-600 hover:underline transition-colors duration-200"
                  >
                    View
                  </Link>
                </CardContent>
              </Card>

              <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="h-32 bg-gray-700 relative">
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="text-lg font-semibold">2025 Updates</div>
                    <div className="text-sm opacity-90">
                      Latest Features & Improvements
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">New Features Released</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Enhanced quote analysis, improved broker portal, and
                    streamlined HR workflows now available.
                  </p>
                  <Link
                    href="/quote-tool"
                    className="text-sm text-gray-600 hover:text-blue-600 hover:underline transition-colors duration-200"
                  >
                    View
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col space-y-6">
            {/* AI Assistant */}
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Bot className="h-5 w-5 text-gray-600 hover:text-blue-600 transition-colors duration-200" />
                  <CardTitle className="text-gray-900">
                    How can I help you today?
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-600">
                  Get answers & complete tasks with our AI Assistant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <button
                  type="button"
                  className="group w-full bg-white border border-gray-300 rounded-lg p-3 text-left hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
                    <span className="text-gray-800">Ask AI</span>
                  </div>
                </button>
              </CardContent>
            </Card>

            {/* Pending Actions */}
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle>Pending Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3">
                  <div className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" />
                      <div>
                        <p className="font-medium">Review ABC Corp Quote</p>
                        <p className="text-sm text-gray-500">Due in 2 days</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" />
                      <div>
                        <p className="font-medium">
                          Client Meeting Preparation
                        </p>
                        <p className="text-sm text-gray-500">
                          Tomorrow at 2:00 PM
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" />
                      <div>
                        <p className="font-medium">Team Performance Review</p>
                        <p className="text-sm text-gray-500">This week</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
