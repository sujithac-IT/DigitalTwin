import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fingerprint, Mail, Chrome, Zap } from 'lucide-react';
import { useEV } from '@/contexts/EVContext';
import { useToast } from '@/hooks/use-toast';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { login as apiLogin, register as apiRegister } from '@/api/auth';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();
  const { setUser, speak } = useEV();
  const { toast } = useToast();

  useEffect(() => {
    setTimeout(() => {
      setShowWelcome(true);
      speak('Welcome to EV Sense! Your intelligent EV companion.');
    }, 500);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: for login, only email and password are required
    // For register, email, password, and vehicleId are all required
    if (!email || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in email and password',
        variant: 'destructive',
      });
      return;
    }

    if (!isLogin && !vehicleId) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a Vehicle ID to create an account',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const resp = isLogin
        ? await apiLogin(email, password)
        : await apiRegister(email, password, vehicleId);

      // Persist token for subsequent requests
      localStorage.setItem('token', resp.access_token);

      setUser({ email, vehicleId });
      toast({
        title: isLogin ? 'Login Successful' : 'Account Created',
        description: `Welcome${isLogin ? ' back' : ''}, ${email}`,
      });
      speak(`${isLogin ? 'Welcome back' : 'Welcome'} to EV Sense. Your vehicle ${vehicleId} is now connected.`);
      navigate('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Authentication failed',
        description: err?.message ?? 'Please check your credentials and try again',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBiometric = () => {
    toast({
      title: 'Biometric Authentication',
      description: 'Fingerprint verified successfully',
    });
    setUser({ email: 'biometric@user.com', vehicleId: 'BIO-VEH-001' });
    navigate('/dashboard');
  };

  const handleGoogleLogin = () => {
    toast({
      title: 'Google Login',
      description: 'Redirecting to Google...',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <VoiceAssistant 
        message={showWelcome ? "Welcome to EV Sense! Your intelligent EV companion." : undefined}
        autoHide={true}
      />
      
      <Card className="w-full max-w-md border-2 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
            <Zap className="w-12 h-12 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <CardTitle className="text-3xl font-tech">EV Sense</CardTitle>
            <CardDescription className="text-base mt-2">
              Your intelligent EV telematics companion
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email / Phone Number
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder="your@email.com or +91 98765 43210"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="vehicleId" className="text-sm font-medium">
                  Vehicle ID
                </Label>
                <Input
                  id="vehicleId"
                  type="text"
                  placeholder="e.g., VEH-2024-1234"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting}>
              {submitting ? 'Please wait…' : isLogin ? 'Login' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {isLogin
                ? "Don't have an account? Create one"
                : 'Already have an account? Login'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
