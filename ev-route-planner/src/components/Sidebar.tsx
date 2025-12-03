import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Gauge, 
  MapPin, 
  Wrench, 
  Settings, 
  History,
  LogOut,
  Zap,
  User as UserIcon,
} from 'lucide-react';
import { useEV } from '@/contexts/EVContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useEV();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out',
    });
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', icon: Gauge, label: 'Dashboard' },
    { path: '/map', icon: MapPin, label: 'Map' },
    { path: '/services', icon: Wrench, label: 'Services' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={cn(
      "hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:left-0 lg:top-0 lg:h-screen",
      "bg-card border-r border-border z-40",
      className
    )}>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">EV Sense</h1>
            <p className="text-xs text-muted-foreground">Digital Twin</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.email?.split('@')[0] || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.vehicleId || 'No vehicle'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Button
              key={item.path}
              variant={active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11",
                active && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
              onClick={() => navigate(item.path)}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </Button>
        
        {/* Version */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">EV Sense v1.0.0</p>
        </div>
      </div>
    </div>
  );
};
