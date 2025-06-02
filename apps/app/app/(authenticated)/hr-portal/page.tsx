import type { Metadata } from 'next';
import { BenefitSearchForm } from './components/benefit-search-form';
import { InformationTiles } from './components/information-tiles';
import { BottomSections } from './components/bottom-sections';

export const metadata: Metadata = {
  title: 'HR Portal',
  description: 'Access and manage your employee benefits information',
};

export default function HRPortalPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">HR Portal</h1>
      <div className="flex flex-col gap-6">
        <BenefitSearchForm />
        <InformationTiles />
        <BottomSections />
      </div>
    </div>
  );
}
