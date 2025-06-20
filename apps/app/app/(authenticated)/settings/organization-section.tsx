'use client';

import { OrganizationProfile } from '@repo/auth/client';

export function OrganizationSection() {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Manage Organization</h2>
      <div className="bg-white rounded-lg shadow-sm border">
        <OrganizationProfile />
      </div>
    </div>
  );
}