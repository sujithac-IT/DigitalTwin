import { useEffect, useState } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { useEV } from '@/contexts/EVContext';

interface VoiceAssistantProps {
  message?: string;
  autoHide?: boolean;
}

export const VoiceAssistant = ({ message, autoHide = true }: VoiceAssistantProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const { voiceAssistantActive, setVoiceAssistantActive } = useEV();

  useEffect(() => {
    if (message && voiceAssistantActive) {
      setCurrentMessage(message);
      setIsVisible(true);

      if (autoHide) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [message, voiceAssistantActive, autoHide]);

  const handleClose = () => {
    setIsVisible(false);
    setCurrentMessage('');
  };

  if (!isVisible || !currentMessage) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 voice-bubble max-w-md px-4">
      <div className="bg-card border-2 border-primary rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-card-foreground leading-relaxed">{currentMessage}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center flex-shrink-0 transition-colors"
            aria-label="Close voice message"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const VoiceToggle = () => {
  const { voiceAssistantActive, setVoiceAssistantActive } = useEV();

  return (
    <button
      onClick={() => setVoiceAssistantActive(!voiceAssistantActive)}
      className={`fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-50 p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${
        voiceAssistantActive
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground'
      }`}
      aria-label="Toggle voice assistant"
    >
      {voiceAssistantActive ? (
        <Volume2 className="w-5 h-5 animate-pulse" />
      ) : (
        <VolumeX className="w-5 h-5" />
      )}
    </button>
  );
};
