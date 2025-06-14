'use client';

import { useState } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { OnboardingNavigation } from '../components/onboarding-navigation';
import { OnboardingData } from '../page';
import { Plus, X, Users, Mail } from 'lucide-react';

interface TeamStepProps {
  data: Partial<OnboardingData>;
  onContinue: () => void;
  onBack: () => void;
  onUpdateData: (data: Partial<OnboardingData>) => void;
}

const TEAM_ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to all features and settings' },
  { value: 'consultant', label: 'Benefits Consultant', description: 'Access to client management and quote tools' },
  { value: 'analyst', label: 'Analyst', description: 'Access to reporting and analytics' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to reports and data' }
];

const PERMISSIONS = [
  { id: 'client_management', label: 'Client Management', description: 'View and edit client information' },
  { id: 'quote_tools', label: 'Quote Tools', description: 'Access document parsing and comparisons' },
  { id: 'reporting', label: 'Reporting & Analytics', description: 'View reports and dashboard analytics' },
  { id: 'team_management', label: 'Team Management', description: 'Invite and manage team members' },
  { id: 'billing', label: 'Billing & Subscription', description: 'Manage billing and subscription settings' }
];

interface TeamMember {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export function TeamStep({ 
  data, 
  onContinue, 
  onBack, 
  onUpdateData 
}: TeamStepProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    data.teamMembers?.map((member, index) => ({
      id: `member-${index}`,
      email: member.email,
      role: member.role,
      permissions: member.permissions
    })) || []
  );
  
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return PERMISSIONS.map(p => p.id);
      case 'consultant':
        return ['client_management', 'quote_tools', 'reporting'];
      case 'analyst':
        return ['reporting'];
      case 'viewer':
        return ['reporting'];
      default:
        return [];
    }
  };

  const addTeamMember = () => {
    if (!newMemberEmail.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }
    if (!newMemberRole) {
      setErrors({ role: 'Role is required' });
      return;
    }
    if (teamMembers.some(member => member.email === newMemberEmail)) {
      setErrors({ email: 'This email is already added' });
      return;
    }

    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      email: newMemberEmail,
      role: newMemberRole,
      permissions: getDefaultPermissions(newMemberRole)
    };

    setTeamMembers([...teamMembers, newMember]);
    setNewMemberEmail('');
    setNewMemberRole('');
    setErrors({});
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
  };

  const updateMemberRole = (id: string, role: string) => {
    setTeamMembers(teamMembers.map(member => 
      member.id === id 
        ? { ...member, role, permissions: getDefaultPermissions(role) }
        : member
    ));
  };

  const updateMemberPermissions = (id: string, permissionId: string, checked: boolean) => {
    setTeamMembers(teamMembers.map(member => 
      member.id === id 
        ? {
            ...member,
            permissions: checked 
              ? [...member.permissions, permissionId]
              : member.permissions.filter(p => p !== permissionId)
          }
        : member
    ));
  };

  const handleContinue = () => {
    const formattedTeamMembers = teamMembers.map(member => ({
      email: member.email,
      role: member.role,
      permissions: member.permissions
    }));
    
    onUpdateData({ teamMembers: formattedTeamMembers });
    onContinue();
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Team Configuration
        </h2>
        <p className="text-gray-600">
          Invite team members and set their roles and permissions. 
          You can always add more team members later.
        </p>
      </div>

      {/* Add Team Member Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="memberEmail" className="text-sm font-medium text-gray-700 mb-2 block">
                  Email Address
                </Label>
                <Input
                  id="memberEmail"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Role
                </Label>
                <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                  <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-600 mt-1">{errors.role}</p>
                )}
              </div>
            </div>
            <Button onClick={addTeamMember} className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      {teamMembers.length > 0 && (
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Team Members ({teamMembers.length})
          </h3>
          
          {teamMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.email}</p>
                      <p className="text-sm text-gray-500">
                        {TEAM_ROLES.find(r => r.value === member.role)?.label}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeTeamMember(member.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Role
                    </Label>
                    <Select
                      value={member.role}
                      onValueChange={(value) => updateMemberRole(member.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div>
                              <p>{role.label}</p>
                              <p className="text-xs text-gray-500">{role.description}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Permissions
                    </Label>
                    <div className="space-y-2">
                      {PERMISSIONS.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${member.id}-${permission.id}`}
                            checked={member.permissions.includes(permission.id)}
                            onCheckedChange={(checked) => 
                              updateMemberPermissions(member.id, permission.id, !!checked)
                            }
                          />
                          <Label 
                            htmlFor={`${member.id}-${permission.id}`}
                            className="text-sm text-gray-700 cursor-pointer"
                          >
                            {permission.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Skip Option */}
      {teamMembers.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No team members yet
          </h3>
          <p className="text-gray-600">
            You can add team members now or skip this step and add them later 
            from your account settings.
          </p>
        </div>
      )}

      <OnboardingNavigation
        canGoBack={true}
        canContinue={true}
        onBack={onBack}
        onContinue={handleContinue}
      />
    </div>
  );
}