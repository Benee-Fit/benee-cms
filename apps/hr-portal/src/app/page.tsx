import { BenefitSearchForm } from '@/components/homepage/BenefitSearchForm';
import { InformationTiles } from '@/components/homepage/InformationTiles';
import { BottomSections } from '@/components/homepage/BottomSections';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <BenefitSearchForm />
      <InformationTiles />
      <BottomSections />
    </div>
  );
}
