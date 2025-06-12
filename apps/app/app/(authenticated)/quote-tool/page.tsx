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
import { Badge } from '@repo/design-system/components/ui/badge';
import { 
  ArrowRight, 
  BarChart3, 
  Upload, 
  Sparkles,
  Shield,
  Zap,
  PlayCircle,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Header } from '../components/header';
import RecentReports from './components/RecentReports';
import { cn } from '@repo/design-system/lib/utils';

export default function QuoteToolPage() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const features = [
    {
      id: 'parser',
      icon: Upload,
      title: 'Document Parser',
      description: 'Upload and parse insurance quote PDFs with AI precision',
      detail: 'Extract structured data from Current, Renegotiated, and Alternative carrier quotes',
      href: '/quote-tool/document-parser',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      metrics: '95% accuracy',
      time: '< 30 seconds'
    }
  ];

  return (
    <>
      <Header pages={['Dashboard']} page="Quote Tool" />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8 text-white">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="rounded-lg bg-white/10 p-2 backdrop-blur-sm">
                <Zap className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <span className="text-sm font-medium text-white/80">AI-Powered Insurance Analysis</span>
              <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Quote Tool</h1>
            <Button 
              className="float-right bg-white text-slate-900 hover:bg-white/90 group h-10 px-6"
              onClick={() => router.push('/quote-tool/document-parser')}
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              Start Parsing
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <p className="text-base md:text-lg text-white/80 max-w-2xl">
              Transform insurance document processing with AI. Parse quotes, compare carriers, 
              and identify optimal coverage in minutes instead of hours.
            </p>
          </div>
          {/* Background elements */}
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent" />
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute top-1/2 right-10 h-24 w-24 rounded-full bg-blue-400/20 blur-2xl" />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Action Cards */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <Card 
                key={feature.id}
                className={cn(
                  "group hover:shadow-xl transition-all duration-300 border-slate-200 overflow-hidden relative",
                  "hover:border-slate-300"
                )}
                onMouseEnter={() => setHoveredCard(feature.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 pointer-events-none",
                  hoveredCard === feature.id && "opacity-5"
                )} 
                style={{backgroundImage: `linear-gradient(135deg, ${feature.bgGradient})`}} />
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "rounded-xl bg-gradient-to-br p-3 text-white shadow-lg",
                        feature.gradient
                      )}>
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                        <CardDescription className="mt-1">{feature.description}</CardDescription>
                      </div>
                    </div>
                    <ArrowUpRight className={cn(
                      "h-5 w-5 text-slate-400 transition-all duration-300",
                      hoveredCard === feature.id && "text-slate-600 translate-x-1 -translate-y-1"
                    )} />
                  </div>
                </CardHeader>
                
                <CardContent className="pb-4 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.detail}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <span className="text-muted-foreground">{feature.metrics}</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    onClick={() => router.push(feature.href)}
                    className={cn(
                      "group/btn w-full bg-gradient-to-r hover:shadow-lg transition-all duration-300",
                      feature.gradient
                    )}
                  >
                    <span>Get Started</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            <RecentReports limit={5} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">            
            {/* Help Card */}
            <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white overflow-hidden group">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-100/50 blur-2xl transition-all duration-500 group-hover:scale-150" />
              <CardHeader className="relative">
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 relative">
                <p className="text-sm text-muted-foreground">
                  Get the most out of Quote Tool with our resources:
                </p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start hover:bg-white hover:shadow-sm transition-all">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Best Practices Guide
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}