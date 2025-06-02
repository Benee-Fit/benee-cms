import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function EmployeeTrendsPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Employee Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Explore trends within your workforce, including headcount changes, distribution of coverage types, demographic breakdowns (age/gender), and statistics by division. This section will provide valuable insights for benefits planning and strategy.
          </p>
          <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-medium text-foreground">Content for Employee Trends is under development.</p>
            <p className="text-sm text-muted-foreground mt-2">Detailed employee analytics and trends will be available soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
