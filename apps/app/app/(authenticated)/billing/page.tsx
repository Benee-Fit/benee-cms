import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { CreditCard, FileText, TrendingUp, Calendar } from 'lucide-react';

export default function Billing() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription, billing, and payment methods</p>
      </div>

      {/* Current Plan */}
      <div className="mb-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-blue-900">Current Plan: Professional</CardTitle>
                <CardDescription className="text-blue-700">
                  $99/month • Renews on January 15, 2025
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">$99</div>
                <div className="text-sm text-blue-700">per month</div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <CardTitle>Payment Methods</CardTitle>
            </div>
            <CardDescription>
              Manage your credit cards and payment options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">•••• 4242</p>
                    <p className="text-sm text-gray-500">Expires 12/2026</p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Primary
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle>Recent Invoices</CardTitle>
            </div>
            <CardDescription>
              View and download your billing history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">December 2024</p>
                  <p className="text-sm text-gray-500">$99.00 • Paid</p>
                </div>
                <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                  Download
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">November 2024</p>
                  <p className="text-sm text-gray-500">$99.00 • Paid</p>
                </div>
                <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                  Download
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <CardTitle>Usage Statistics</CardTitle>
            </div>
            <CardDescription>
              Track your monthly usage and limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Quote Analyses</span>
                  <span>45 / 100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full w-[45%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Document Storage</span>
                  <span>2.1 GB / 10 GB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full w-[21%]"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <CardTitle>Subscription Management</CardTitle>
            </div>
            <CardDescription>
              Upgrade, downgrade, or cancel your subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                Upgrade Plan
              </button>
              <button className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                Change Billing Cycle
              </button>
              <button className="w-full text-left p-2 text-sm text-red-600 hover:bg-red-50 rounded">
                Cancel Subscription
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}