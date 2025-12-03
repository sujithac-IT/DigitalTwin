import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp,
  Battery,
  Thermometer,
  Gauge,
  Award,
  Calendar,
  Zap,
  MapPin,
  Activity,
  User,
  History as HistoryIcon,
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { useLatestSensorData } from '@/hooks/useLatestSensorData';
import { useHistoricalData } from '@/hooks/useHistoricalData';

interface SensorReading {
  timestamp: string;
  voltage: number;
  current: number;
  temperature: number;
  latitude?: number;
  longitude?: number;
}

interface ChartDataPoint {
  time: string;
  voltage: number;
  current: number;
  temperature: number;
  soc: number;
  power: number;
}

const History = () => {
  const navigate = useNavigate();
  const { data: latestSensor } = useLatestSensorData();
  const { data: historicalRawData, loading: historyLoading } = useHistoricalData(100);
  
  const [historicalData, setHistoricalData] = useState<ChartDataPoint[]>([]);
  const [stats, setStats] = useState({
    avgVoltage: 0,
    avgCurrent: 0,
    avgTemperature: 0,
    avgSOC: 0,
    maxTemperature: 0,
    minVoltage: 0,
    totalReadings: 0,
    efficiencyScore: 0,
  });

  // Process real historical data from backend
  useEffect(() => {
    if (!historicalRawData || historicalRawData.length === 0) {
      // Fallback: generate sample data if no history yet
      const generateFallbackData = () => {
        const data: ChartDataPoint[] = [];
        const now = new Date();
        
        for (let i = 23; i >= 0; i--) {
          const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
          const hour = timestamp.getHours();
          
          const baseVoltage = latestSensor?.voltage || 12;
          const baseCurrent = latestSensor?.current || 0;
          const baseTemp = latestSensor?.temperature || 30;
          
          const voltageVariation = Math.sin(hour / 24 * Math.PI) * 0.5;
          const tempVariation = Math.sin((hour - 6) / 12 * Math.PI) * 5;
          const currentVariation = Math.random() * 2 - 1;
          
          const voltage = Math.max(11, Math.min(14, baseVoltage + voltageVariation));
          const current = Math.max(-2, Math.min(5, baseCurrent + currentVariation));
          const temperature = Math.max(20, Math.min(50, baseTemp + tempVariation));
          
          const soc = Math.max(0, Math.min(100, ((voltage - 11) / 3) * 100));
          const power = voltage * Math.abs(current);
          
          data.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            voltage: parseFloat(voltage.toFixed(2)),
            current: parseFloat(current.toFixed(2)),
            temperature: parseFloat(temperature.toFixed(1)),
            soc: parseFloat(soc.toFixed(1)),
            power: parseFloat(power.toFixed(2)),
          });
        }
        return data;
      };

      setHistoricalData(generateFallbackData());
      return;
    }

    // Process real historical data from backend
    const processedData: ChartDataPoint[] = historicalRawData.map((reading) => {
      const timestamp = new Date(reading.timestamp);
      const hours = timestamp.getHours();
      const minutes = timestamp.getMinutes();
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const voltage = reading.voltage;
      const current = reading.current;
      const temperature = reading.temperature;
      
      // Calculate SOC from voltage (11V = 0%, 14V = 100%)
      const soc = Math.max(0, Math.min(100, ((voltage - 11) / 3) * 100));
      
      // Calculate power (W = V * A)
      const power = voltage * Math.abs(current);
      
      return {
        time: timeStr,
        voltage: parseFloat(voltage.toFixed(2)),
        current: parseFloat(current.toFixed(2)),
        temperature: parseFloat(temperature.toFixed(1)),
        soc: parseFloat(soc.toFixed(1)),
        power: parseFloat(power.toFixed(2)),
      };
    });

    setHistoricalData(processedData);

    // Calculate statistics from processed data
    if (processedData.length > 0) {
      const avgVoltage = processedData.reduce((sum, d) => sum + d.voltage, 0) / processedData.length;
      const avgCurrent = processedData.reduce((sum, d) => sum + Math.abs(d.current), 0) / processedData.length;
      const avgTemperature = processedData.reduce((sum, d) => sum + d.temperature, 0) / processedData.length;
      const avgSOC = processedData.reduce((sum, d) => sum + d.soc, 0) / processedData.length;
      const maxTemperature = Math.max(...processedData.map(d => d.temperature));
      const minVoltage = Math.min(...processedData.map(d => d.voltage));
      
      // Efficiency score based on temperature management and voltage stability
      const tempScore = Math.max(0, 100 - (maxTemperature - 30) * 2); // Penalty for high temps
      const voltageStability = 100 - (Math.max(...processedData.map(d => d.voltage)) - Math.min(...processedData.map(d => d.voltage))) * 10;
      const efficiencyScore = Math.round((tempScore + voltageStability) / 2);
      
      setStats({
        avgVoltage: parseFloat(avgVoltage.toFixed(2)),
        avgCurrent: parseFloat(avgCurrent.toFixed(2)),
        avgTemperature: parseFloat(avgTemperature.toFixed(1)),
        avgSOC: parseFloat(avgSOC.toFixed(1)),
        maxTemperature: parseFloat(maxTemperature.toFixed(1)),
        minVoltage: parseFloat(minVoltage.toFixed(2)),
        totalReadings: processedData.length,
        efficiencyScore,
      });
    }
  }, [latestSensor, historicalRawData]);

  const avgDailyRange = Math.round(stats.avgSOC * 3.2); // Estimate range from avg SOC

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="History & Analytics" subtitle="Track your EV performance" />

      <div className="container mx-auto px-4 md:px-8 py-6 pb-24 md:pb-8">
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Left Column - Summary Stats */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" />
                    <span className="text-sm">Efficiency Score</span>
                  </div>
                  <div className="text-2xl font-bold text-accent">{stats.efficiencyScore}</div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Voltage</span>
                    <span className="font-bold">{stats.avgVoltage} V</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Current</span>
                    <span className="font-bold">{stats.avgCurrent} A</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Temperature</span>
                    <span className="font-bold">{stats.avgTemperature} °C</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg SOC</span>
                    <span className="font-bold">{stats.avgSOC} %</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Daily Range</span>
                    <span className="font-bold">{avgDailyRange} km</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Alerts & Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.maxTemperature > 45 && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <p className="text-sm font-semibold text-destructive">High Temperature Detected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Peak: {stats.maxTemperature}°C - Consider reducing load
                    </p>
                  </div>
                )}
                
                {stats.minVoltage < 11.5 && (
                  <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <p className="text-sm font-semibold text-warning">Low Voltage Alert</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum: {stats.minVoltage}V - Charge soon
                    </p>
                  </div>
                )}

                {stats.efficiencyScore >= 80 && (
                  <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                    <p className="text-sm font-semibold text-success">Great Performance!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Efficiency score: {stats.efficiencyScore}/100
                    </p>
                  </div>
                )}

                {historicalData.length === 0 && (
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <Activity className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No historical data yet. Start driving to see analytics!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Charts */}
          <div className="lg:col-span-8 space-y-4">
            <Tabs defaultValue="voltage" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="voltage">Voltage</TabsTrigger>
                <TabsTrigger value="current">Current</TabsTrigger>
                <TabsTrigger value="temperature">Temperature</TabsTrigger>
                <TabsTrigger value="soc">SOC</TabsTrigger>
                <TabsTrigger value="power">Power</TabsTrigger>
              </TabsList>

              <TabsContent value="voltage" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Battery className="w-5 h-5 text-primary" />
                      Battery Voltage (Last 24 Hours)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={historicalData}>
                        <defs>
                          <linearGradient id="voltageGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                        <YAxis domain={[10, 15]} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="voltage" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1}
                          fill="url(#voltageGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="current" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-accent" />
                      Current Flow (Last 24 Hours)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="current" 
                          stroke="hsl(var(--accent))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--accent))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="temperature" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Thermometer className="w-5 h-5 text-destructive" />
                      Battery Temperature (Last 24 Hours)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={historicalData}>
                        <defs>
                          <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                        <YAxis domain={[20, 50]} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="temperature" 
                          stroke="hsl(var(--destructive))" 
                          fillOpacity={1}
                          fill="url(#tempGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="soc" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-success" />
                      State of Charge (Last 24 Hours)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={historicalData}>
                        <defs>
                          <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                        <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="soc" 
                          stroke="hsl(var(--success))" 
                          fillOpacity={1}
                          fill="url(#socGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="power" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-warning" />
                      Power Consumption (Last 24 Hours)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="power" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-accent" />
                  Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-tech font-bold text-accent">{stats.efficiencyScore}</div>
                <p className="text-xs text-muted-foreground mt-1">Score</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Avg Range
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-tech font-bold text-primary">{avgDailyRange}</div>
                <p className="text-xs text-muted-foreground mt-1">km/day</p>
              </CardContent>
            </Card>
          </div>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">24-Hour Averages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Voltage</span>
                <span className="font-bold font-tech">{stats.avgVoltage} V</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current</span>
                <span className="font-bold font-tech">{stats.avgCurrent} A</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Temperature</span>
                <span className="font-bold font-tech">{stats.avgTemperature} °C</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">State of Charge</span>
                <span className="font-bold font-tech">{stats.avgSOC} %</span>
              </div>
            </CardContent>
          </Card>

          {/* Charts - Mobile Tabs */}
          <Tabs defaultValue="voltage" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="voltage">Voltage</TabsTrigger>
              <TabsTrigger value="temperature">Temp</TabsTrigger>
              <TabsTrigger value="soc">SOC</TabsTrigger>
            </TabsList>

            <TabsContent value="voltage" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Battery className="w-4 h-4 text-primary" />
                    Battery Voltage (24h)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient id="voltageGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis domain={[10, 15]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip />
                      <Area type="monotone" dataKey="voltage" stroke="hsl(var(--primary))" fill="url(#voltageGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="temperature" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-destructive" />
                    Temperature (24h)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis domain={[20, 50]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip />
                      <Area type="monotone" dataKey="temperature" stroke="hsl(var(--destructive))" fill="url(#tempGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="soc" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-success" />
                    State of Charge (24h)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip />
                      <Area type="monotone" dataKey="soc" stroke="hsl(var(--success))" fill="url(#socGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Alerts */}
          {(stats.maxTemperature > 45 || stats.minVoltage < 11.5 || stats.efficiencyScore >= 80) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alerts & Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.maxTemperature > 45 && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <p className="text-sm font-semibold text-destructive">High Temperature</p>
                    <p className="text-xs text-muted-foreground mt-1">Peak: {stats.maxTemperature}°C</p>
                  </div>
                )}
                
                {stats.minVoltage < 11.5 && (
                  <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <p className="text-sm font-semibold text-warning">Low Voltage</p>
                    <p className="text-xs text-muted-foreground mt-1">Min: {stats.minVoltage}V</p>
                  </div>
                )}

                {stats.efficiencyScore >= 80 && (
                  <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                    <p className="text-sm font-semibold text-success">Great Performance!</p>
                    <p className="text-xs text-muted-foreground mt-1">Score: {stats.efficiencyScore}/100</p>
                  </div>
                )}
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')} className="flex flex-col gap-1 text-primary">
            <HistoryIcon className="w-5 h-5" />
            <span className="text-xs">History</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="flex flex-col gap-1">
            <User className="w-4 h-4" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default History;
