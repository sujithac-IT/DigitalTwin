import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Battery, 
  Thermometer, 
  MapPin, 
  Zap, 
  History,
  Gauge,
  TrendingUp,
  Clock,
  AlertTriangle,
  Leaf,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Phone,
  Shield,
  Navigation,
  FileText,
  User,
  LogOut,
  Menu,
} from 'lucide-react';
import { useEV } from '@/contexts/EVContext';
import { useLatestSensorData } from '@/hooks/useLatestSensorData';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { speak, user, setUser, voiceAssistantActive } = useEV();
  const { data: sensor, error: sensorError, loading: sensorLoading } = useLatestSensorData();
  const [tip, setTip] = useState('');
  const [ecoRange, setEcoRange] = useState(0);
  const [normalRange, setNormalRange] = useState(0);
  const [sportRange, setSportRange] = useState(0);
  const [chargingSpeed, setChargingSpeed] = useState(0);
  const [weather, setWeather] = useState({ condition: 'Clear', temp: 28, icon: 'Sun' });
  const [gridAlert, setGridAlert] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { toast } = useToast();

  // Derive battery-like metrics from real sensor data
  const voltage = sensor?.voltage ?? 0;
  const current = sensor?.current ?? 0;
  const temperature = sensor?.temperature ?? 0;
  
  // Simulated SOC that decreases over time (starts at 85%, decreases 2% every 6 seconds)
  // Always resets to 85% on page refresh
  const [simulatedSoc, setSimulatedSoc] = useState<number>(85);
  
  // Simulated SOH that fluctuates realistically (92-96%)
  // Always resets to 94% on page refresh
  const [simulatedSoh, setSimulatedSoh] = useState<number>(94);
  
  // Simulated DTE fluctuation offset (-5 to +5 km)
  const [dteFluctuation, setDteFluctuation] = useState<number>(0);
  
  const [hasTriggered20Alert, setHasTriggered20Alert] = useState(false);
  const [hasTriggered60Alert, setHasTriggered60Alert] = useState(false);
  
  // Clear localStorage on component mount to ensure fresh start
  useEffect(() => {
    localStorage.removeItem('simulatedSoc');
    localStorage.removeItem('simulatedSoh');
    localStorage.removeItem('lowBatteryAlertTriggered');
  }, []);
  
  // SOC simulation - decrease 2% every 6 seconds, stops at 0%
  useEffect(() => {
    // Only run interval if SOC is above 0
    if (simulatedSoc <= 0) {
      return; // Stop the interval if battery is at 0%
    }

    const interval = setInterval(() => {
      setSimulatedSoc((prevSoc) => {
        const newSoc = Math.max(0, prevSoc - 2); // Decrease by 2%, minimum 0%
        return newSoc;
      });
    }, 6000); // Run every 6 seconds

    return () => clearInterval(interval);
  }, [simulatedSoc]); // Re-run when simulatedSoc changes to stop at 0
  
  // SOH fluctuation - varies between 92-96% every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedSoh((prevSoh) => {
        // Fluctuate ±2% around 94%
        const variation = (Math.random() - 0.5) * 4; // -2 to +2
        const newSoh = Math.max(92, Math.min(96, 94 + variation));
        const roundedSoh = Math.round(newSoh * 10) / 10; // Round to 1 decimal
        return roundedSoh;
      });
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, []);
  
  // DTE fluctuation - varies ±5 km every 8 seconds to simulate driving conditions
  useEffect(() => {
    const interval = setInterval(() => {
      setDteFluctuation((Math.random() - 0.5) * 10); // -5 to +5 km
    }, 8000); // Every 8 seconds

    return () => clearInterval(interval);
  }, []);

  // Trigger alert when SOC reaches 60%
  useEffect(() => {
    if (voiceAssistantActive && simulatedSoc <= 60 && simulatedSoc > 58 && !hasTriggered60Alert) {
      speak('Attention! Battery level has dropped to 60 percent. Consider planning your next charge soon.');
      toast({
        title: '⚠️ Medium Battery Warning',
        description: 'Battery level at 60%. Plan your charging strategy.',
        variant: 'default',
      });
      setHasTriggered60Alert(true);
    }
    
    // Reset alert flag when SOC goes above 60%
    if (simulatedSoc > 60) {
      setHasTriggered60Alert(false);
    }
  }, [simulatedSoc, hasTriggered60Alert, speak, toast, voiceAssistantActive]);

  // Trigger alert when SOC reaches 20%
  useEffect(() => {
    if (voiceAssistantActive && simulatedSoc <= 20 && simulatedSoc > 18 && !hasTriggered20Alert) {
      speak('Warning! Battery level is critically low at 20 percent. Please charge your vehicle soon to avoid getting stranded.');
      toast({
        title: '⚠️ Low Battery Alert',
        description: 'Battery level has reached 20%. Please charge soon!',
        variant: 'destructive',
      });
      setHasTriggered20Alert(true);
    }
    
    // Reset alert flag when SOC goes above 20%
    if (simulatedSoc > 20) {
      setHasTriggered20Alert(false);
    }
  }, [simulatedSoc, hasTriggered20Alert, speak, toast, voiceAssistantActive]);

  const soc = Math.round(simulatedSoc); // Use simulated SOC
  const soh = Math.round(simulatedSoh * 10) / 10; // Use simulated SOH with 1 decimal
  const baseDte = Math.round(soc * 3.2); // Base range estimate
  const dte = Math.max(0, Math.round(baseDte + dteFluctuation)); // Add fluctuation
  const status = soc < 20 ? 'Low Battery' : soc < 60 ? 'Medium Battery' : temperature > 45 ? 'Overheating' : 'Normal';

  const batteryData = { soc, soh, temperature, dte, status };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    speak('Logging out. See you soon!');
    navigate('/');
  };

  useEffect(() => {
    const tips = [
      'Tip: Fast charging 3 times a week reduces battery life by 2% annually.',
      'Tip: Maintain battery between 20-80% for optimal health.',
      'Tip: Precondition your battery before DC fast charging for better results.',
      'Tip: Regenerative braking can extend your range by up to 20%.',
    ];
    setTip(tips[Math.floor(Math.random() * tips.length)]);
    
    // Calculate range estimates based on real DTE
    setEcoRange(Math.round(dte * 1.2));
    setNormalRange(dte);
    setSportRange(Math.round(dte * 0.75));
  }, [dte]);

  // Simulate charging speed when vehicle is charging (based on current)
  useEffect(() => {
    if (current > 0.5) {
      setChargingSpeed(Math.abs(current) * voltage / 1000);
    } else {
      setChargingSpeed(0);
    }
  }, [current, voltage]);

  // Simulate weather updates
  useEffect(() => {
    const weatherConditions = [
      { condition: 'Clear', temp: 28, icon: 'Sun', rangeImpact: 0 },
      { condition: 'Rainy', temp: 24, icon: 'CloudRain', rangeImpact: -15 },
      { condition: 'Hot', temp: 38, icon: 'Sun', rangeImpact: -10 },
      { condition: 'Windy', temp: 26, icon: 'Wind', rangeImpact: -5 },
    ];
    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    setWeather(randomWeather);

    if (randomWeather.rangeImpact < 0) {
      speak(`Weather alert: ${randomWeather.condition} conditions may reduce range by ${Math.abs(randomWeather.rangeImpact)} percent.`);
    }
  }, []);

  // Grid-based smart charging alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const isOffPeak = new Date().getHours() >= 22 || new Date().getHours() <= 6;
      if (isOffPeak && soc < 80) {
        setGridAlert(true);
        speak('Smart charging alert: Grid load is low. This is an optimal time for charging with lower rates.');
        toast({
          title: 'Smart Charging Alert',
          description: 'Off-peak hours detected. Save up to 40% on charging costs!',
        });
        setTimeout(() => setGridAlert(false), 10000);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [soc, speak, toast]);

  const handleSOS = () => {
    speak('Emergency SOS activated. Contacting nearest service center and emergency contacts.');
    toast({
      title: 'SOS Activated',
      description: 'Emergency services have been notified. Help is on the way!',
      variant: 'destructive',
    });
  };

  const getBatteryColor = () => {
    if (soc > 60) return 'text-battery-full';
    if (soc > 20) return 'text-battery-mid';
    return 'text-battery-low';
  };

  const getStatusColor = () => {
    if (status === 'Normal') return 'bg-success/20 text-success border-success/30';
    if (status === 'Medium Battery') return 'bg-warning/20 text-warning border-warning/30';
    if (status === 'Low Battery') return 'bg-destructive/20 text-destructive border-destructive/30';
    return 'bg-destructive/20 text-destructive border-destructive/30';
  };

  const getBatteryCardColor = () => {
    if (soc >= 60) return 'border-success/50 bg-gradient-to-br from-success/5 to-success/10';
    if (soc >= 20) return 'border-warning/50 bg-gradient-to-br from-warning/5 to-warning/10';
    return 'border-destructive/50 bg-gradient-to-br from-destructive/5 to-destructive/10';
  };

  const calculateChargingTime = (power: number, targetSoc: number = 80) => {
    const batteryCapacity = 60; // kWh (example)
    const currentSoc = soc;
    const energyNeeded = (batteryCapacity * (targetSoc - currentSoc)) / 100;
    const hours = energyNeeded / power;
    const minutes = Math.round(hours * 60);
    
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  };

  const WeatherIcon = weather.icon === 'Sun' ? Sun : weather.icon === 'CloudRain' ? CloudRain : Wind;

  return (
    <div className="min-h-screen bg-background">
      <VoiceAssistant message={tip} autoHide={true} />
      
      {/* Header - Professional */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-4">
              <Zap className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold">EV Dashboard</h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Real-time vehicle monitoring</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSOS}
                className="gap-2"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden md:inline">SOS</span>
              </Button>
              
              {/* Profile Menu */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="gap-2"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">{user?.email?.split('@')[0] || 'User'}</span>
                </Button>
                
                {showProfileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-2xl p-4 z-50">
                      <div className="pb-3 mb-3 border-b border-border">
                        <p className="text-sm font-semibold truncate">{user?.email || 'User'}</p>
                        <p className="text-xs text-muted-foreground mt-1">Vehicle: {user?.vehicleId || 'N/A'}</p>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-8 py-6 pb-24 md:pb-8">
        {/* Desktop Layout - 3 Column Grid */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Left Column - Battery Status */}
          <div className="lg:col-span-4 space-y-6">
            {/* Main Battery Card */}
            <Card className={`border-2 transition-all duration-500 ${getBatteryCardColor()}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Battery className={`w-6 h-6 ${getBatteryColor()}`} />
                    <span className="font-semibold">Battery Status</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor()}`}>
                    {status}
                  </span>
                </div>

                {/* Circular Battery Indicator */}
                <div className="relative w-40 h-40 mx-auto mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted opacity-20" />
                    <circle
                      cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
                      className={getBatteryColor()}
                      strokeDasharray={`${(soc / 100) * 283} 283`}
                      style={{ filter: soc > 60 ? 'drop-shadow(0 0 8px hsl(var(--battery-full)))' : 'none', transition: 'all 0.5s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-4xl font-bold ${getBatteryColor()}`}>{Math.round(soc)}%</div>
                    <div className="text-xs text-muted-foreground">State of Charge</div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold">{soh}%</div>
                    <div className="text-xs text-muted-foreground">SOH</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{temperature}°C</div>
                    <div className="text-xs text-muted-foreground">Temp</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{dte}</div>
                    <div className="text-xs text-muted-foreground">DTE (km)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Telemetry */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-primary" />
                  Live Telemetry
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Voltage:</span>
                  <span className="font-semibold">{voltage.toFixed(2)} V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-semibold">{current.toFixed(2)} A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latitude:</span>
                  <span className="font-semibold">{sensor?.latitude?.toFixed(6) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Longitude:</span>
                  <span className="font-semibold">{sensor?.longitude?.toFixed(6) || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Range & Efficiency */}
          <div className="lg:col-span-5 space-y-6">
            {/* Range Estimator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Range Estimator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-success" />
                      <span className="text-sm">Eco Mode</span>
                    </div>
                    <span className="font-bold text-success">{ecoRange} km</span>
                  </div>
                  <Progress value={(ecoRange / 400) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-primary" />
                      <span className="text-sm">Normal Mode</span>
                    </div>
                    <span className="font-bold text-primary">{normalRange} km</span>
                  </div>
                  <Progress value={(normalRange / 400) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-warning" />
                      <span className="text-sm">Sport Mode</span>
                    </div>
                    <span className="font-bold text-warning">{sportRange} km</span>
                  </div>
                  <Progress value={(sportRange / 400) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Charging Info */}
            {chargingSpeed > 0 && (
              <Card className="border-2 border-accent">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent" />
                    Charging
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Charging Speed</span>
                    <span className="text-2xl font-bold text-accent">{chargingSpeed.toFixed(2)} kW</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>To 80%</span>
                      <span>{calculateChargingTime(chargingSpeed * 10, 80)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>To 100%</span>
                      <span>{calculateChargingTime(chargingSpeed * 10, 100)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weather Impact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <WeatherIcon className="w-5 h-5 text-primary" />
                  Weather Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{weather.condition}</p>
                  <p className="text-sm text-muted-foreground">{weather.temp}°C</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Range Impact</p>
                  <p className="font-semibold">{weather.condition === 'Clear' ? 'Optimal' : 'Reduced'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions & Alerts */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/map')}>
                  <MapPin className="w-4 h-4" />
                  Find Chargers
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/history')}>
                  <History className="w-4 h-4" />
                  Trip History
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/services')}>
                  <FileText className="w-4 h-4" />
                  Services
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/settings')}>
                  <User className="w-4 h-4" />
                  Settings
                </Button>
              </CardContent>
            </Card>

            {/* Low Battery Warning */}
            {soc < 20 && (
              <Card className="border-2 border-warning bg-warning/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-warning">Low Battery Warning</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your battery is running low. Consider charging soon.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Grid Alert */}
            {gridAlert && (
              <Card className="border-2 border-success bg-success/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Leaf className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-success">Smart Charging</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Off-peak hours - Save up to 40% on charging!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Mobile Layout - Original Single Column */}
        <div className="lg:hidden space-y-6">
          {/* Main Battery Card */}
          <Card className={`border-2 shadow-xl overflow-hidden transition-all duration-500 ${getBatteryCardColor()}`}>
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Battery className={`w-8 h-8 ${getBatteryColor()}`} />
                  <span className="font-tech text-lg">Battery Status</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor()}`}>
                  {status}
                </span>
              </div>

              {/* Circular Battery Indicator */}
              <div className="relative w-48 h-48 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted opacity-20" />
                  <circle
                    cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
                    className={getBatteryColor()}
                    strokeDasharray={`${(soc / 100) * 283} 283`}
                    style={{ filter: soc > 60 ? 'drop-shadow(0 0 8px hsl(var(--battery-full)))' : 'none', transition: 'all 0.5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`text-5xl font-tech font-bold ${getBatteryColor()}`}>{Math.round(soc)}%</div>
                  <div className="text-sm text-muted-foreground mt-1">State of Charge</div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold font-tech">{soh}%</div>
                  <div className="text-xs text-muted-foreground">SOH</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-tech flex items-center justify-center gap-1">
                    {temperature}°C
                  </div>
                  <div className="text-xs text-muted-foreground">Temp</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-tech">{dte}</div>
                  <div className="text-xs text-muted-foreground">DTE (km)</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Range Estimator - Mobile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Range Estimator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-success" />
                    <span className="font-medium">Eco Mode</span>
                  </div>
                  <span className="text-xl font-bold font-tech text-success">{ecoRange} km</span>
                </div>
                <Progress value={(ecoRange / 400) * 100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-primary" />
                    <span className="font-medium">Normal Mode</span>
                  </div>
                  <span className="text-xl font-bold font-tech text-primary">{normalRange} km</span>
                </div>
                <Progress value={(normalRange / 400) * 100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-warning" />
                    <span className="font-medium">Sport Mode</span>
                  </div>
                  <span className="text-xl font-bold font-tech text-warning">{sportRange} km</span>
                </div>
                <Progress value={(sportRange / 400) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Live Telemetry - Mobile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" />
                Live Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Voltage:</span>
                <span className="font-bold font-tech">{voltage.toFixed(2)} V</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current:</span>
                <span className="font-bold font-tech">{current.toFixed(2)} A</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Latitude:</span>
                <span className="font-bold font-tech text-xs">{sensor?.latitude?.toFixed(6) || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Longitude:</span>
                <span className="font-bold font-tech text-xs">{sensor?.longitude?.toFixed(6) || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Charging Status - Mobile */}
          {chargingSpeed > 0 && (
            <Card className="border-2 border-accent bg-gradient-to-br from-accent/10 to-accent/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent animate-pulse" />
                  Charging Active
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <div className="text-4xl font-bold font-tech text-accent">{chargingSpeed.toFixed(2)} kW</div>
                  <div className="text-sm text-muted-foreground mt-1">Charging Speed</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">To 80%</span>
                    <span className="font-tech font-bold">{calculateChargingTime(chargingSpeed * 10, 80)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">To 100%</span>
                    <span className="font-tech font-bold">{calculateChargingTime(chargingSpeed * 10, 100)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weather Impact - Mobile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <WeatherIcon className="w-5 h-5 text-primary" />
                Weather Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{weather.condition}</p>
                  <p className="text-sm text-muted-foreground">{weather.temp}°C</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Range Impact</p>
                  <p className="font-semibold">{weather.condition === 'Clear' ? 'Optimal' : 'Reduced'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Battery Warning - Mobile */}
          {soc < 20 && (
            <Card className="border-2 border-warning bg-warning/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-warning">Low Battery Warning</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your battery is running low. Consider charging soon or head to the nearest station.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grid Alert - Mobile */}
          {gridAlert && (
            <Card className="border-2 border-success bg-success/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Leaf className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-success">Smart Charging Alert</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Off-peak hours detected. Save up to 40% on charging costs right now!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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

export default Dashboard;
