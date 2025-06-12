'use client';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { BarChart, ChevronRight, FileText, FileUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '../components/header';
import RecentReports from './components/RecentReports';

export default function QuoteToolPage() {
  const router = useRouter();

  return (
    <>
      <Header pages={['Dashboard']} page="Quote Tool">
        <h2 className="text-xl font-semibold">Quote Tool</h2>
      </Header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-muted/50 flex-1 min-h-[50vh] md:min-h-min rounded-xl p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Welcome to the Quote Tool</h2>
            <p className="text-muted-foreground">
              AI-powered insurance document parsing and market comparison for
              benefits consultants
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Action Cards */}
            <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileUp className="h-5 w-5 mr-2 text-primary" />
                    Document Parser
                  </CardTitle>
                  <CardDescription>
                    Upload and parse insurance quote PDFs from carriers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Upload insurance documents from different carriers to extract
                    key information using AI. The tool categorizes documents as
                    Current, Renegotiated, or Alternative quotes for detailed
                    comparison.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => router.push('/quote-tool/document-parser')}
                  >
                    Open Document Parser
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="h-5 w-5 mr-2 text-primary" />
                    Market Comparison
                  </CardTitle>
                  <CardDescription>
                    Compare multiple insurance options side-by-side
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    View comprehensive comparisons between current plans,
                    renegotiated options, and alternative carriers. Analyze
                    premiums, coverage details, and potential cost savings across
                    the market.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() =>
                      router.push('/quote-tool/document-parser/results')
                    }
                  >
                    View Comparisons
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Recent Reports Sidebar */}
            <div className="lg:col-span-1">
              <RecentReports limit={5} />
            </div>
          </div>

          <div className="mt-8">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal pl-4 space-y-2">
                  <li>
                    <strong>Upload Documents</strong> - Use the Document Parser
                    to upload insurance quote PDFs
                  </li>
                  <li>
                    <strong>Categorize</strong> - Label documents as Current,
                    Renegotiated, or Alternative quotes
                  </li>
                  <li>
                    <strong>AI Processing</strong> - Our AI engine extracts
                    structured data from your documents
                  </li>
                  <li>
                    <strong>Market Comparison</strong> - View side-by-side
                    comparison of all uploaded quotes
                  </li>
                  <li>
                    <strong>Analyze</strong> - Filter by coverage type and
                    review detailed benefit information
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
