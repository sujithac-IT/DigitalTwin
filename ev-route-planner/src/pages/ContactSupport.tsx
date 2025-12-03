import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  Mail,
  MessageSquare,
  Clock,
  MapPin,
  HeadphonesIcon,
  AlertCircle,
  CheckCircle,
  Send,
  FileText,
  Video,
  Users,
} from 'lucide-react';
import { useEV } from '@/contexts/EVContext';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/hooks/use-toast';

interface SupportOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  available: boolean;
  action: () => void;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const ContactSupport = () => {
  const { speak } = useEV();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const supportOptions: SupportOption[] = [
    {
      id: 'phone',
      title: '24/7 Phone Support',
      description: 'Speak with a support specialist',
      icon: Phone,
      available: true,
      action: () => {
        speak('Connecting you to customer support. Please wait.');
        toast({
          title: 'Calling Support',
          description: 'Connecting to +1-800-EV-SENSE...',
        });
      },
    },
    {
      id: 'chat',
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: MessageSquare,
      available: true,
      action: () => {
        speak('Opening live chat. An agent will be with you shortly.');
        toast({
          title: 'Chat Started',
          description: 'Average wait time: 2 minutes',
        });
      },
    },
    {
      id: 'video',
      title: 'Video Call Support',
      description: 'Schedule a video consultation',
      icon: Video,
      available: false,
      action: () => {
        toast({
          title: 'Video Support',
          description: 'Available Mon-Fri, 9 AM - 6 PM',
          variant: 'default',
        });
      },
    },
    {
      id: 'roadside',
      title: 'Roadside Assistance',
      description: 'Emergency vehicle support',
      icon: AlertCircle,
      available: true,
      action: () => {
        speak('Activating roadside assistance. Help is on the way.');
        toast({
          title: 'Roadside Assistance',
          description: 'Emergency services dispatched to your location',
          variant: 'destructive',
        });
      },
    },
  ];

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I optimize my battery health?',
      answer: 'Maintain charge between 20-80%, avoid frequent fast charging, and precondition battery before DC charging.',
      category: 'battery',
    },
    {
      id: '2',
      question: 'What should I do if my range decreases suddenly?',
      answer: 'Check tire pressure, driving mode, climate control usage, and temperature. Contact support if issues persist.',
      category: 'battery',
    },
    {
      id: '3',
      question: 'How often should I service my EV?',
      answer: 'Battery check every 6 months, brake inspection annually, coolant service every 1-2 years depending on model.',
      category: 'service',
    },
    {
      id: '4',
      question: 'Can I charge in the rain?',
      answer: 'Yes, EV charging systems are weatherproof and safe to use in all weather conditions.',
      category: 'charging',
    },
    {
      id: '5',
      question: 'How do I reset the SOC simulation?',
      answer: 'Simply refresh the page and the battery simulation will automatically reset to 85%. The SOC will then decrease by 2% every 6 seconds.',
      category: 'general',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    speak(`Thank you ${formData.name}. Your support request has been submitted. We will respond to your email within 24 hours.`);
    toast({
      title: 'Request Submitted',
      description: 'We will contact you within 24 hours',
    });
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const categories = [
    { id: 'general', label: 'General' },
    { id: 'battery', label: 'Battery' },
    { id: 'charging', label: 'Charging' },
    { id: 'service', label: 'Service' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-6">
      <PageHeader 
        title="Contact Support" 
        subtitle="We're here to help 24/7"
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Support Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {supportOptions.map((option) => (
            <Card 
              key={option.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                option.available 
                  ? 'hover:border-primary hover:bg-primary/5' 
                  : 'opacity-60 hover:opacity-80'
              }`}
              onClick={option.action}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className={`p-4 rounded-full transition-all duration-300 ${
                  option.available 
                    ? 'bg-primary/10 hover:bg-primary/20' 
                    : 'bg-muted'
                }`}>
                  <option.icon className={`w-6 h-6 transition-transform duration-300 hover:scale-110 ${
                    option.available ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{option.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                </div>
                {option.available ? (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Available Now
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Limited Hours
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary cursor-pointer">
            <CardContent className="p-6 flex items-start space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg transition-all duration-300 hover:bg-primary/20">
                <Phone className="w-5 h-5 text-primary transition-transform duration-300 hover:scale-110" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Phone</h3>
                <p className="text-sm text-muted-foreground">+1-800-EV-SENSE</p>
                <p className="text-xs text-muted-foreground mt-1">24/7 Available</p>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary cursor-pointer">
            <CardContent className="p-6 flex items-start space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg transition-all duration-300 hover:bg-primary/20">
                <Mail className="w-5 h-5 text-primary transition-transform duration-300 hover:scale-110" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Email</h3>
                <p className="text-sm text-muted-foreground">support@evsense.com</p>
                <p className="text-xs text-muted-foreground mt-1">Response within 24h</p>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary cursor-pointer">
            <CardContent className="p-6 flex items-start space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg transition-all duration-300 hover:bg-primary/20">
                <MapPin className="w-5 h-5 text-primary transition-transform duration-300 hover:scale-110" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Service Center</h3>
                <p className="text-sm text-muted-foreground">123 EV Boulevard</p>
                <p className="text-xs text-muted-foreground mt-1">Open Mon-Sat 8AM-6PM</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="w-5 h-5" />
              <span>Submit a Request</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Brief description"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Describe your issue or question in detail..."
                  rows={5}
                  required
                />
              </div>

              <Button type="submit" className="w-full transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Send className="w-4 h-4 mr-2 transition-transform duration-300 hover:translate-x-1" />
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Frequently Asked Questions</span>
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  className="cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-md"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqs
                .filter((faq) => selectedCategory === 'general' || faq.category === selectedCategory)
                .map((faq) => (
                  <div key={faq.id} className="border-b pb-4 last:border-b-0 transition-all duration-300 hover:bg-muted/30 hover:px-3 hover:py-2 rounded-md cursor-pointer">
                    <h3 className="font-semibold text-sm mb-2">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary hover:bg-primary/5">
            <CardContent className="p-6 flex items-start space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg transition-all duration-300 hover:bg-primary/20">
                <FileText className="w-5 h-5 text-primary transition-transform duration-300 hover:scale-110" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Documentation</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  User manuals, guides, and technical documentation
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary hover:bg-primary/5">
            <CardContent className="p-6 flex items-start space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg transition-all duration-300 hover:bg-primary/20">
                <Users className="w-5 h-5 text-primary transition-transform duration-300 hover:scale-110" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Community Forum</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect with other EV Sense users and share experiences
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex justify-around items-center z-40">
        <Button variant="ghost" size="icon" className="transition-all duration-300 hover:scale-110 hover:bg-primary/10" onClick={() => window.history.back()}>
          <MapPin className="w-5 h-5 transition-transform duration-300 hover:rotate-12" />
        </Button>
        <Button variant="ghost" size="icon" className="transition-all duration-300 hover:scale-110 hover:bg-primary/10" onClick={() => speak('Contact support page')}>
          <HeadphonesIcon className="w-5 h-5 transition-transform duration-300 hover:rotate-12" />
        </Button>
        <Button variant="ghost" size="icon" className="transition-all duration-300 hover:scale-110 hover:bg-primary/10">
          <Users className="w-5 h-5 transition-transform duration-300 hover:rotate-12" />
        </Button>
      </div>
    </div>
  );
};

export default ContactSupport;
