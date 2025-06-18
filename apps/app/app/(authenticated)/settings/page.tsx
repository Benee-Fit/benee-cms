import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Bell, Database, Shield, User, Users } from 'lucide-react';
import { ClientOrganizationProfile } from '../components/client-components';

export default function UserSettings() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Settings</h1>
        <p className="text-gray-600">
          Manage your account preferences and settings
        </p>
      </div>

      {/* Member Management Section - Full Width */}
      <div className="mt-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <CardTitle>Organization Management</CardTitle>
            </div>
            <CardDescription>
              Manage your organization members, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClientOrganizationProfile />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle>Profile Settings</CardTitle>
            </div>
            <CardDescription>
              Update your personal information and profile details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-green-600" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Manage your security settings and two-factor authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-600" />
              <CardTitle>Data & Privacy</CardTitle>
            </div>
            <CardDescription>
              Control your data sharing and privacy preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
