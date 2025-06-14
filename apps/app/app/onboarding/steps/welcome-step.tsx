'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Shield, 
  Zap, 
  ArrowRight 
} from 'lucide-react';

interface WelcomeStepProps {
  onContinue: () => void;
}

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Get deep insights into your client portfolio and revenue streams'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Seamlessly work with your team and manage permissions'
  },
  {
    icon: Shield,
    title: 'Secure & Compliant',
    description: 'Enterprise-grade security with industry compliance standards'
  },
  {
    icon: Zap,
    title: 'AI-Powered Tools',
    description: 'Leverage AI for document parsing and market comparisons'
  }
];

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Benee CMS
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          The comprehensive insurance management platform designed specifically 
          for brokers and benefits consultants. Let's get you set up for success.
        </p>
      </div>

      {/* Features Quick Launch */}
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="group flex flex-col items-center justify-center px-2 py-4 rounded-lg hover:bg-white/70 hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-100"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-gray-200 group-hover:scale-105 transition-all duration-200">
                <feature.icon className="h-7 w-7 text-gray-700 group-hover:text-blue-600 transition-colors duration-200" />
              </div>
              <span className="text-sm text-center font-medium text-gray-800 mb-1">
                {feature.title}
              </span>
              <p className="text-xs text-gray-600 text-center">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ready to get started?
        </h3>
        <p className="text-gray-600 mb-4">
          This setup will take about 5-10 minutes and you can save your progress 
          at any time. We'll walk you through:
        </p>
        <ul className="text-sm text-gray-600 space-y-1 max-w-md mx-auto">
          <li>• Your personal and organization information</li>
          <li>• Team member setup and permissions</li>
          <li>• Your business specializations and preferences</li>
          <li>• Account verification and finalization</li>
        </ul>
      </div>

      <Button 
        onClick={onContinue}
        size="lg"
        className="px-8"
      >
        Get Started
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}