import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Wrench,
  Battery,
  Droplets,
  Wind,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  History,
  Gauge,
  User,
  Shield,
} from 'lucide-react';
import { useEV } from '@/contexts/EVContext';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  daysUntilDue: number;
  status: 'overdue' | 'due-soon' | 'upcoming';
  icon: any;
  lastCompleted: string;
  intervalDays: number;
}

const Services = () => {
  const navigate = useNavigate();
  const { speak } = useEV();
  const { toast } = useToast();

  const [services] = useState<Service[]>([
    {
      id: '1',
      name: 'Battery Health Check',
      description: 'Comprehensive battery diagnostics and cell balancing',
      dueDate: '2025-12-15',
      daysUntilDue: 15,
      status: 'due-soon',
      icon: Battery,
      lastCompleted: '2025-06-15',
      intervalDays: 180,
    },
    {
      id: '2',
      name: 'Brake System Inspection',
      description: 'Check brake pads, fluid, and regenerative braking system',
      dueDate: '2026-01-20',
      daysUntilDue: 51,
      status: 'upcoming',
      icon: Wrench,
      lastCompleted: '2025-07-20',
      intervalDays: 180,
    },
    {
      id: '3',
      name: 'Coolant System Service',
      description: 'Thermal management system check and coolant replacement',
      dueDate: '2025-11-30',
      daysUntilDue: 0,
      status: 'overdue',
      icon: Droplets,
      lastCompleted: '2024-11-30',
      intervalDays: 365,
    },
    {
      id: '4',
      name: 'HVAC Filter Replacement',
      description: 'Cabin air filter and climate control system inspection',
      dueDate: '2026-02-28',
      daysUntilDue: 90,
      status: 'upcoming',
      icon: Wind,
      lastCompleted: '2025-08-28',
      intervalDays: 180,
    },
    {
      id: '5',
      name: 'High Voltage System Check',
      description: 'Electrical system diagnostics and connection inspection',
      dueDate: '2025-12-25',
      daysUntilDue: 25,
      status: 'due-soon',
      icon: Filter,
      lastCompleted: '2024-12-25',
      intervalDays: 365,
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-destructive text-destructive-foreground';
      case 'due-soon':
        return 'bg-warning text-warning-foreground';
      case 'upcoming':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'due-soon':
        return <Clock className="w-4 h-4" />;
      case 'upcoming':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string, days: number) => {
    switch (status) {
      case 'overdue':
        return 'Overdue';
      case 'due-soon':
        return `Due in ${days} days`;
      case 'upcoming':
        return `${days} days remaining`;
      default:
        return '';
    }
  };

  const handleServiceDetails = (service: Service) => {
    const message = `${service.name} is ${getStatusText(service.status, service.daysUntilDue)}. Last completed on ${service.lastCompleted}. ${service.description}`;
    speak(message);
  };

  const handleSOS = () => {
    speak('Emergency SOS activated. Contacting nearest service center and emergency contacts.');
    toast({
      title: 'SOS Activated',
      description: 'Emergency services have been notified. Help is on the way!',
      variant: 'destructive',
    });
  };

  const overdueCount = services.filter(s => s.status === 'overdue').length;
  const dueSoonCount = services.filter(s => s.status === 'due-soon').length;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Service Schedule" subtitle={`${overdueCount > 0 ? `${overdueCount} overdue, ` : ''}${dueSoonCount > 0 ? `${dueSoonCount} due soon` : 'All services up to date'}`} />

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-8 py-6 pb-24 md:pb-8">
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Summary Card - Desktop */}
            <div className="grid grid-cols-3 gap-6">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                  <div className="text-4xl font-bold text-destructive mb-2">
                    {overdueCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Overdue Services</div>
                </CardContent>
              </Card>
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Clock className="w-12 h-12 text-warning mx-auto mb-3" />
                  <div className="text-4xl font-bold text-warning mb-2">
                    {dueSoonCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Due Soon</div>
                </CardContent>
              </Card>
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                  <div className="text-4xl font-bold text-success mb-2">
                    {services.filter(s => s.status === 'upcoming').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Upcoming</div>
                </CardContent>
              </Card>
            </div>

            {/* Services Grid - Desktop */}
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Wrench className="w-6 h-6 text-primary" />
                Maintenance Schedule
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {services
                  .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
                  .map((service) => {
                    const Icon = service.icon;
                    const progress = Math.max(
                      0,
                      Math.min(100, ((service.intervalDays - service.daysUntilDue) / service.intervalDays) * 100)
                    );

                    return (
                      <Card
                        key={service.id}
                        className="border-2 hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]"
                        onClick={() => handleServiceDetails(service)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg">{service.name}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {service.description}
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(service.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(service.status)}
                                <span className="text-xs font-semibold">
                                  {service.status === 'overdue' ? 'Overdue' : 
                                   service.status === 'due-soon' ? 'Due Soon' : 'Upcoming'}
                                </span>
                              </div>
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Service Progress</span>
                              <span className="font-semibold">
                                {getStatusText(service.status, service.daysUntilDue)}
                              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <div className="text-muted-foreground">Due Date</div>
                              <div className="font-semibold">{service.dueDate}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-muted-foreground">Last Service</div>
                              <div className="font-semibold">{service.lastCompleted}</div>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            className="w-full"
                            size="sm"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Service
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-4 max-w-md mx-auto">
          {/* Summary Card */}
          <Card className="border-2 shadow-lg">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-destructive">
                    {overdueCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">
                    {dueSoonCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Due Soon</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">
                    {services.filter(s => s.status === 'upcoming').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Upcoming</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services List */}
          <div className="space-y-3">
            <h2 className="font-bold flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              Maintenance Schedule
            </h2>

            {services
              .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
              .map((service) => {
                const Icon = service.icon;
                const progress = Math.max(
                  0,
                  Math.min(100, ((service.intervalDays - service.daysUntilDue) / service.intervalDays) * 100)
                );

                return (
                  <Card
                    key={service.id}
                    className="border-2 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleServiceDetails(service)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base">{service.name}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {service.description}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(service.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(service.status)}
                            <span className="text-xs">
                              {service.status === 'overdue' ? 'Overdue' : 
                               service.status === 'due-soon' ? 'Soon' : 'OK'}
                            </span>
                          </div>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Service Progress</span>
                          <span className="font-semibold">
                            {getStatusText(service.status, service.daysUntilDue)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="text-muted-foreground">Due Date</div>
                          <div className="font-semibold">{service.dueDate}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-muted-foreground">Last Service</div>
                          <div className="font-semibold">{service.lastCompleted}</div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        Book Service
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30">
        <div className="flex justify-around p-2 max-w-md mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="flex flex-col gap-1">
            <Gauge className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/map')} className="flex flex-col gap-1">
            <MapPin className="w-5 h-5" />
            <span className="text-xs">Map</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')} className="flex flex-col gap-1">
            <History className="w-5 h-5" />
            <span className="text-xs">History</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="flex flex-col gap-1">
            <User className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Services;
