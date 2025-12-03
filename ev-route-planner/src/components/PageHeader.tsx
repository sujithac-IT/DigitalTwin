import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, Shield, User, LogOut } from 'lucide-react';
import { useEV } from '@/contexts/EVContext';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  const navigate = useNavigate();
  const { user, setUser, speak } = useEV();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    speak('Logging out. See you soon!');
    navigate('/');
  };

  const handleSOS = () => {
    speak('Emergency SOS activated. Contacting nearest service center and emergency contacts.');
  };

  return (
    <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-4">
            <Zap className="w-8 h-8 text-primary hidden md:block" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-xs md:text-sm text-muted-foreground hidden md:block">{subtitle}</p>
              )}
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
  );
};
