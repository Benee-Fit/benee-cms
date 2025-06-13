'use client';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  BarChart,
  BarChart3,
  Bot,
  ChevronRight,
  Clock,
  FileCheck,
  FileText,
  FileUp,
  type LucideIcon,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RecentReports from './components/RecentReports';

interface QuickAction {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Start a New Quote',
    href: '/quote-tool/document-parser',
    icon: FileUp,
    description: 'Upload documents to prepare a new quote',
  },
  {
    title: 'View Comparisons',
    href: '/quote-tool/document-parser/results',
    icon: BarChart3,
    description: 'Market analysis',
  },
  {
    title: 'Recent Reports',
    href: '/quote-tool/reports',
    icon: FileCheck,
    description: 'Saved analyses',
  },
];

export default function QuoteToolPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="relative px-6 pt-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Quote Tool
          </h1>
          <p className="text-gray-600">
            AI-powered insurance document parsing and market comparison
          </p>

          {/* Quick Launch */}
          <div className="mt-6 mb-6">
            <div className="grid grid-cols-3 gap-1">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group flex flex-col items-center justify-center px-2 py-4 rounded-lg hover:bg-white/70 hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-100"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-gray-200 group-hover:scale-105 transition-all duration-200">
                    <action.icon className="h-7 w-7 text-gray-700 group-hover:text-blue-600 transition-colors duration-200" />
                  </div>
                  <span className="text-md text-center font-medium text-gray-800">
                    {action.title}
                  </span>
                  {action.description && (
                    <span className="text-xs text-center text-gray-500 mt-1">
                      {action.description}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Cards */}
          <div className="lg:col-span-2 flex flex-col space-y-6">
            {/* Recent Reports */}
            <div className="flex-1">
              <RecentReports limit={10} />
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
                    Need help with quotes?
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-600">
                  Ask our AI for assistance with document parsing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <button
                  type="button"
                  className="group w-full bg-white border border-gray-300 rounded-lg p-3 text-left hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
                    <span className="text-gray-800">Ask AI Assistant</span>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}