'use client';

import { useState } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Label } from '@repo/design-system/components/ui/label';
import { OnboardingNavigation } from '../components/onboarding-navigation';
import { OnboardingData } from '../page';
import { 
  CheckCircle, 
  Mail, 
  Shield, 
  FileText, 
  Users,
  Building,
  Target,
  ExternalLink
} from 'lucide-react';

interface VerificationStepProps {
  data: Partial<OnboardingData>;
  onBack: () => void;
  onComplete: () => void;
}

export function VerificationStep({ 
  data, 
  onBack, 
  onComplete 
}: VerificationStepProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    if (!acceptedTerms || !acceptedPrivacy) return;
    
    setIsCompleting(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      await onComplete();
    } catch (error) {
      console.error('Completion failed:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const canComplete = acceptedTerms && acceptedPrivacy;

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Almost There!
        </h2>
        <p className="text-gray-600">
          Review your information and complete your account setup
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4 mb-8">
        {/* Personal Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Users className="w-5 h-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 font-medium">
                  {data.firstName} {data.lastName}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 font-medium">{data.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <span className="ml-2 font-medium">{data.phone}</span>
              </div>
              <div>
                <span className="text-gray-500">Title:</span>
                <span className="ml-2 font-medium">{data.title}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Building className="w-5 h-5 mr-2" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Organization:</span>
                <span className="ml-2 font-medium">{data.organizationName}</span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 font-medium">{data.organizationType}</span>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>
                <span className="ml-2 font-medium">{data.companySize}</span>
              </div>
              <div>
                <span className="text-gray-500">Website:</span>
                <span className="ml-2 font-medium">{data.website || 'Not provided'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team & Specialization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Users className="w-5 h-5 mr-2" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm">
                <span className="font-medium">{data.teamMembers?.length || 0}</span> team members will be invited
              </p>
              {data.teamMembers && data.teamMembers.length > 0 && (
                <div className="mt-2 space-y-1">
                  {data.teamMembers.slice(0, 3).map((member, index) => (
                    <p key={index} className="text-xs text-gray-500">
                      {member.email} ({member.role})
                    </p>
                  ))}
                  {data.teamMembers.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{data.teamMembers.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Target className="w-5 h-5 mr-2" />
                Specializations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm">
                <span className="font-medium">{data.linesOfBusiness?.length || 0}</span> lines of business
              </p>
              <p className="text-sm">
                <span className="font-medium">{data.clientIndustries?.length || 0}</span> client industries
              </p>
              <p className="text-sm">
                <span className="font-medium">{data.preferredCarriers?.length || 0}</span> preferred carriers
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Next Steps */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            What happens next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Email verification</p>
                <p className="text-xs text-gray-500">
                  You'll receive a verification email to confirm your account
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Team invitations</p>
                <p className="text-xs text-gray-500">
                  Team members will receive email invitations to join your organization
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Platform access</p>
                <p className="text-xs text-gray-500">
                  You'll be redirected to your personalized dashboard
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Terms & Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(!!checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="terms" className="text-sm cursor-pointer">
                  I agree to the{' '}
                  <a 
                    href="#" 
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    Terms of Service
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Label>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox
                id="privacy"
                checked={acceptedPrivacy}
                onCheckedChange={(checked) => setAcceptedPrivacy(!!checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="privacy" className="text-sm cursor-pointer">
                  I agree to the{' '}
                  <a 
                    href="#" 
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    Privacy Policy
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <OnboardingNavigation
        canGoBack={true}
        canContinue={canComplete}
        onBack={onBack}
        onContinue={handleComplete}
        onComplete={handleComplete}
        isFinalStep={true}
        isLoading={isCompleting}
      />
    </div>
  );
}