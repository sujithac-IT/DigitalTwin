import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface EVStation {
  id: string;
  name: string;
  location: string;
  distance: number;
  power: string;
  connectors: string[];
  slots: number;
  price: number;
  address: string;
  latitude: number;
  longitude: number;
}

interface BatteryData {
  soc: number;
  soh: number;
  temperature: number;
  dte: number;
  status: 'Normal' | 'Low Battery' | 'Overheating';
}

interface User {
  email: string;
  vehicleId: string;
}

interface EVContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  stations: EVStation[];
  notifications: Array<{ id: string; type: string; message: string; time: string }>;
  addNotification: (notification: { type: string; message: string }) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  voiceAssistantActive: boolean;
  setVoiceAssistantActive: (active: boolean) => void;
  speak: (message: string) => void;
  searchRadius: number;
  setSearchRadius: (radius: number) => void;
}

const EVContext = createContext<EVContextType | undefined>(undefined);

const mockStations: EVStation[] = [
  {
    id: '1',
    name: 'Tata Power EZ Charge',
    location: 'Anna Nagar',
    distance: 1.4,
    power: '30 kW DC',
    connectors: ['CCS2'],
    slots: 2,
    price: 18,
    address: '123 Anna Nagar Main Rd',
    latitude: 13.0869,
    longitude: 80.2093,
  },
  {
    id: '2',
    name: 'Zeon Charging Station',
    location: 'Tambaram',
    distance: 2.1,
    power: '50 kW DC',
    connectors: ['CCS2', 'Type-2'],
    slots: 1,
    price: 22,
    address: '456 GST Rd, Tambaram',
    latitude: 12.9229,
    longitude: 80.1275,
  },
  {
    id: '3',
    name: 'Ather Grid',
    location: 'T Nagar',
    distance: 0.8,
    power: '7.4 kW AC',
    connectors: ['Type-2'],
    slots: 3,
    price: 12,
    address: 'Pondy Bazaar, T Nagar',
    latitude: 13.0418,
    longitude: 80.2341,
  },
  {
    id: '4',
    name: 'Exicom Charging Hub',
    location: 'Velachery',
    distance: 3.5,
    power: '60 kW DC',
    connectors: ['CCS2', 'CHAdeMO'],
    slots: 4,
    price: 25,
    address: 'Velachery Main Rd',
    latitude: 12.9750,
    longitude: 80.2207,
  },
  {
    id: '5',
    name: 'ChargeZone Station',
    location: 'OMR',
    distance: 5.2,
    power: '120 kW DC',
    connectors: ['CCS2'],
    slots: 2,
    price: 30,
    address: 'Old Mahabalipuram Rd',
    latitude: 12.9142,
    longitude: 80.2273,
  },
];

export const EVProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [voiceAssistantActive, setVoiceAssistantActive] = useState(true);
  const [searchRadius, setSearchRadius] = useState(5);
  
  // Removed hardcoded batteryData - now using real sensor data

  const [notifications, setNotifications] = useState([
    { id: '1', type: 'info', message: 'Welcome to EV Sense!', time: 'Just now' },
  ]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Removed battery simulation and alerts - using real sensor data from Arduino

  const addNotification = (notification: { type: string; message: string }) => {
    const newNotification = {
      id: Date.now().toString(),
      ...notification,
      time: 'Just now',
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const speak = (message: string) => {
    if (voiceAssistantActive && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = 'en-IN';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      console.log('🎤 Voice Assistant:', message);
    }
  };

  return (
    <EVContext.Provider
      value={{
        user,
        setUser,
        stations: mockStations,
        notifications,
        addNotification,
        isDarkMode,
        toggleDarkMode,
        voiceAssistantActive,
        setVoiceAssistantActive,
        speak,
        searchRadius,
        setSearchRadius,
      }}
    >
      {children}
    </EVContext.Provider>
  );
};

export const useEV = () => {
  const context = useContext(EVContext);
  if (context === undefined) {
    throw new Error('useEV must be used within an EVProvider');
  }
  return context;
};
