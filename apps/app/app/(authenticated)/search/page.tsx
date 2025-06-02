import { Header } from '../components/header';

// Design system components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@repo/design-system/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@repo/design-system/components/ui/table';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Input } from '@repo/design-system/components/ui/input';
import { Avatar } from '@repo/design-system/components/ui/avatar';

// Icons
import {
  ArrowUpIcon,
  UserIcon,
  DollarSignIcon,
  FileTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  SearchIcon,
  FilterIcon,
  PlusIcon,
  UsersIcon,
  BuildingIcon,
  ShieldIcon,
  HeartPulseIcon,
  EyeIcon,
  LineChart,
  BarChart,
  PieChart,
  Activity,
  Heart,
} from 'lucide-react';

export const metadata = {
  title: 'Broker Dashboard - Benee-Fit HR Portal',
  description: 'Broker Quoting and HR Dashboard',
};

const mockQuoteData = [
  {
    id: 'q1',
    clientName: 'Acme Corporation',
    employees: 124,
    quoteDate: '2025-05-20',
    status: 'Active',
    premium: 165800,
    planType: 'Premium PPO',
    carrier: 'BlueCross',
  },
  {
    id: 'q2',
    clientName: 'Globex Inc',
    employees: 86,
    quoteDate: '2025-05-25',
    status: 'Pending',
    premium: 103200,
    planType: 'Standard HMO',
    carrier: 'Aetna',
  },
  {
    id: 'q3',
    clientName: 'Stark Industries',
    employees: 312,
    quoteDate: '2025-05-26',
    status: 'Active',
    premium: 390400,
    planType: 'Enterprise PPO',
    carrier: 'UnitedHealth',
  },
  {
    id: 'q4',
    clientName: 'Wayne Enterprises',
    employees: 209,
    quoteDate: '2025-05-28',
    status: 'Review',
    premium: 250800,
    planType: 'Premium HSA',
    carrier: 'Cigna',
  },
  {
    id: 'q5',
    clientName: 'Umbrella Corp',
    employees: 175,
    quoteDate: '2025-05-30',
    status: 'Draft',
    premium: 196000,
    planType: 'Comprehensive PPO',
    carrier: 'Humana',
  },
];

const getBadgeVariant = (status: string) => {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Pending':
      return 'outline';
    case 'Review':
      return 'secondary';
    default:
      return 'destructive';
  }
};

export default function DashboardPage() {
  return (
    <>
      <Header pages={['Broker Dashboard']} page="Overview" />
      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        {/* Dashboard Header with Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">348</div>
              <div className="text-xs text-muted-foreground">
                <span className="text-emerald-500 flex items-center">
                  <ArrowUpIcon className="h-3 w-3 mr-1" /> +12.5%
                </span>
                <span> from last month</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <BuildingIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">124</div>
              <div className="text-xs text-muted-foreground">
                <span className="text-emerald-500 flex items-center">
                  <ArrowUpIcon className="h-3 w-3 mr-1" /> +4.3%
                </span>
                <span> from last month</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$1.2M</div>
              <div className="text-xs text-muted-foreground">
                <span className="text-emerald-500 flex items-center">
                  <ArrowUpIcon className="h-3 w-3 mr-1" /> +18.2%
                </span>
                <span> from last month</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">9,842</div>
              <div className="text-xs text-muted-foreground">
                <span className="text-emerald-500 flex items-center">
                  <ArrowUpIcon className="h-3 w-3 mr-1" /> +5.7%
                </span>
                <span> from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid gap-6 md:grid-cols-6">
          {/* Left column (4 cols wide) */}
          <div className="col-span-6 md:col-span-4 space-y-6">
            {/* Quotes Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Quotes</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search quotes..."
                        className="w-[200px] pl-8"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <FilterIcon className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                    <Button variant="default" size="sm">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      New Quote
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Plan Type</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockQuoteData.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell className="font-medium">{quote.clientName}</TableCell>
                        <TableCell>{quote.employees}</TableCell>
                        <TableCell>{quote.planType}</TableCell>
                        <TableCell>{quote.carrier}</TableCell>
                        <TableCell>${quote.premium.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getBadgeVariant(quote.status)}
                            className="ml-2"
                          >
                            {quote.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">Showing 5 of 348 quotes</div>
                <Button variant="outline" size="sm">
                  View All Quotes
                </Button>
              </CardFooter>
            </Card>

            {/* Revenue Chart */}
            <div className="col-span-2 row-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Monthly Revenue</CardTitle>
                  <CardDescription>Revenue trend over the past 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex flex-col justify-center items-center">
                    <LineChart className="h-40 w-40 text-blue-500 mb-4" />
                    <p className="text-lg font-medium">Revenue is up by 24% compared to last year</p>
                    <p className="text-sm text-muted-foreground">View the detailed revenue report in the finance section</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Plan Distribution */}
            <div className="col-span-1 row-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Plan Distribution</CardTitle>
                  <CardDescription>Distribution of plans by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex flex-col justify-center items-center">
                    <PieChart className="h-40 w-40 text-green-500 mb-4" />
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                        <span>Health (45%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                        <span>Dental (20%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                        <span>Vision (15%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                        <span>Life (10%)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Carrier Distribution */}
            <div className="col-span-1 row-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Carrier Distribution</CardTitle>
                  <CardDescription>Distribution of carriers by market share</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex flex-col justify-center items-center">
                    <BarChart className="h-40 w-40 text-purple-500 mb-4" />
                    <div className="space-y-2 w-full">
                      <div className="flex items-center justify-between">
                        <span>Blue Cross</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '35%' }} />
                        </div>
                        <span className="text-sm">35%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>United Health</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '25%' }} />
                        </div>
                        <span className="text-sm">25%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Aetna</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '20%' }} />
                        </div>
                        <span className="text-sm">20%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Benefit Plan Types */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <ShieldIcon className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm font-medium">Medical</span>
                    <Badge className="ml-auto">98%</Badge>
                  </div>
                  <div className="flex items-center">
                    <ToothIcon className="h-4 w-4 mr-2 text-emerald-500" />
                    <span className="text-sm font-medium">Dental</span>
                    <Badge className="ml-auto">94%</Badge>
                  </div>
                  <div className="flex items-center">
                    <EyeIcon className="h-4 w-4 mr-2 text-amber-500" />
                    <span className="text-sm font-medium">Vision</span>
                    <Badge className="ml-auto">86%</Badge>
                  </div>
                  <div className="flex items-center">
                    <HeartPulseIcon className="h-4 w-4 mr-2 text-rose-500" />
                    <span className="text-sm font-medium">Life & Disability</span>
                    <Badge className="ml-auto">72%</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  View All Benefits
                </Button>
              </CardFooter>
            </Card>
                      <Button variant="ghost" size="sm">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                View All Requests
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Renewals</CardTitle>
              <CardDescription>Client plans with upcoming renewal dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium">Acme Corporation</div>
                      <div className="text-xs text-muted-foreground">Premium PPO Plan</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium">Jul 15, 2025</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                      <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="font-medium">Wayne Enterprises</div>
                      <div className="text-xs text-muted-foreground">Premium HSA Plan</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium">Aug 03, 2025</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                      <CalendarIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="font-medium">Stark Industries</div>
                      <div className="text-xs text-muted-foreground">Enterprise PPO Plan</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium">Aug 12, 2025</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                View All Renewals
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
