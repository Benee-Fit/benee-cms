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
  ExternalLink,
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
    href: '/broker-portal',
    icon: BarChart3,
  },
  {
    title: 'HR Portal',
    href: 'http://localhost:9002',
    icon: Building2,
    isExternal: true,
  },
  {
    title: 'Development Plans',
    href: '/quote-tool',
    icon: FileText,
  },
  {
    title: 'Reports',
    href: '/quote-tool/reports',
    icon: FileCheck,
  },
  {
    title: 'Forms',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Getting Started',
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
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
            <div className="grid grid-cols-6 gap-4">
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
                    className="group flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 hover:shadow-sm"
                  >
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                      <app.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-sm text-center font-medium text-gray-900 leading-tight">
                      {app.title}
                    </span>
                    {app.isExternal && (
                      <ExternalLink className="h-3 w-3 text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Dashboard Overview</CardTitle>
                <div className="flex space-x-2">
                  <button className="text-sm text-blue-600 hover:underline">
                    Balance Summaries
                  </button>
                  <button className="text-sm text-blue-600 hover:underline">
                    Request new time off
                  </button>
                </div>
              </CardHeader>
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
              <Card className="overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                  <div className="absolute inset-0 bg-black/20"></div>
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
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-green-500 to-emerald-600 relative">
                  <div className="absolute inset-0 bg-black/20"></div>
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
                    className="text-sm text-blue-600 hover:underline"
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
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-purple-800">
                    How can I help you today?
                  </CardTitle>
                </div>
                <CardDescription className="text-purple-700">
                  Get answers and complete tasks with Co-Pilot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <button className="w-full bg-white border border-purple-200 rounded-lg p-3 text-left hover:bg-purple-50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-purple-600" />
                    <span className="text-purple-800">Ask AI</span>
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
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium">Review ABC Corp Quote</p>
                        <p className="text-sm text-gray-500">Due in 2 days</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-blue-500" />
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
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-green-500" />
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
