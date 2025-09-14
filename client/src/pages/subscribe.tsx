import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Users } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('VITE_STRIPE_PUBLIC_KEY not configured - subscription upgrades disabled');
}
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) : null;

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  isActive: boolean;
}

interface SubscriptionStatus {
  currentTier?: string;
  tierInfo?: any;
  isActive?: boolean;
  isPaid?: boolean;
  nextPaymentDate?: string;
  currentPeriodEnd?: string;
  stripeStatus?: string;
  cancelAtPeriodEnd?: boolean;
  nextPaymentAmount?: number;
}

interface PaymentFormProps {
  clientSecret: string;
  selectedTier: SubscriptionTier;
  onSuccess: () => void;
}

const PaymentForm = ({ clientSecret, selectedTier, onSuccess }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscribe?success=true`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful!",
        description: `Welcome to ${selectedTier.name} tier! Your subscription is now active.`,
      });
      onSuccess();
    }
    
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full"
        disabled={!stripe || !elements || isProcessing}
        data-testid="button-confirm-payment"
      >
        {isProcessing ? "Processing..." : `Subscribe to ${selectedTier.name} - $${(selectedTier.price / 100).toFixed(2)}/month`}
      </Button>
    </form>
  );
};

const TierIcon = ({ tier }: { tier: string }) => {
  switch (tier) {
    case 'seeker':
      return <Users className="w-8 h-8 text-blue-500" />;
    case 'pioneer':
      return <Star className="w-8 h-8 text-purple-500" />;
    case 'visionary':
      return <Crown className="w-8 h-8 text-gold-500" />;
    default:
      return <Users className="w-8 h-8" />;
  }
};

export default function Subscribe() {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();

  // Fetch available tiers
  const { data: tiers, isLoading: tiersLoading } = useQuery<SubscriptionTier[]>({
    queryKey: ['/api/subscription/tiers'],
    enabled: true,
  });

  // Fetch current subscription status
  const { data: currentSubscription, refetch: refetchSubscription } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    enabled: true,
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (tier: string) => {
      const response = await apiRequest("POST", "/api/subscription/create", { tier });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresPayment && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPayment(true);
      } else {
        toast({
          title: "Subscription Updated!",
          description: data.message,
        });
        refetchSubscription();
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTierSelect = async (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    
    if (tier.id === 'seeker') {
      // Handle free tier immediately
      createSubscriptionMutation.mutate(tier.id);
    } else {
      // For paid tiers, proceed to payment
      createSubscriptionMutation.mutate(tier.id);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setClientSecret(null);
    refetchSubscription();
    queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `$${(price / 100).toFixed(2)}/month`;
  };

  const isCurrentTier = (tierId: string) => {
    return currentSubscription?.currentTier === tierId;
  };

  if (tiersLoading) {
    return (
      <div className="min-h-screen cosmic-gradient">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        </div>
      </div>
    );
  }

  // Show payment form if we have a client secret
  if (showPayment && clientSecret && selectedTier) {
    return (
      <div className="min-h-screen cosmic-gradient">
        <Navigation />
        
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader className="text-center">
              <TierIcon tier={selectedTier.id} />
              <CardTitle className="text-2xl">Complete Your {selectedTier.name} Subscription</CardTitle>
              <p className="text-muted-foreground">
                Secure payment powered by Stripe
              </p>
            </CardHeader>
            
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm 
                  clientSecret={clientSecret} 
                  selectedTier={selectedTier}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
              
              <div className="mt-6 pt-6 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPayment(false)}
                  className="w-full"
                  data-testid="button-back-to-tiers"
                >
                  ← Back to Tier Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-gradient">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Biblical Leadership Tiers</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the path that aligns with your spiritual calling and leadership journey
          </p>
          
          {currentSubscription && (
            <div className="mt-6">
              <Badge variant="secondary" className="text-sm">
                Current: {currentSubscription.currentTier || 'Seeker'} tier
                {currentSubscription.isPaid && currentSubscription.nextPaymentDate && (
                  <span className="ml-2">
                    • Next payment: {new Date(currentSubscription.nextPaymentDate).toLocaleDateString()}
                  </span>
                )}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {tiers && tiers.map((tier: SubscriptionTier) => (
            <Card 
              key={tier.id} 
              className={`relative bg-card/80 backdrop-blur-sm border-border transition-all duration-300 hover:scale-105 ${
                tier.id === 'pioneer' ? 'border-purple-500 shadow-purple-500/20' : 
                tier.id === 'visionary' ? 'border-gold-500 shadow-gold-500/20' : ''
              } ${isCurrentTier(tier.id) ? 'ring-2 ring-primary' : ''}`}
            >
              {tier.id === 'pioneer' && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
                  Most Popular
                </Badge>
              )}
              
              {tier.id === 'visionary' && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gold-600">
                  Premium
                </Badge>
              )}

              <CardHeader className="text-center">
                <TierIcon tier={tier.id} />
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {formatPrice(tier.price)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleTierSelect(tier)}
                  disabled={!tier.isActive || createSubscriptionMutation.isPending || isCurrentTier(tier.id)}
                  className={`w-full ${
                    tier.id === 'pioneer' ? 'bg-purple-600 hover:bg-purple-700' :
                    tier.id === 'visionary' ? 'bg-gold-600 hover:bg-gold-700' :
                    'bg-primary hover:bg-primary/90'
                  }`}
                  data-testid={`button-select-${tier.id}`}
                >
                  {createSubscriptionMutation.isPending && selectedTier?.id === tier.id
                    ? "Processing..."
                    : isCurrentTier(tier.id)
                    ? "Current Plan"
                    : tier.id === 'seeker' 
                    ? "Start Free" 
                    : `Subscribe to ${tier.name}`
                  }
                </Button>

                {!tier.isActive && (
                  <p className="text-sm text-yellow-500 text-center">
                    Configuration pending
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Information Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-center">Why Choose Our Biblical Leadership Platform?</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-3">🔥 Frequency-Based Meditation</h3>
                <p className="text-sm text-muted-foreground">
                  Experience biblical truths through sacred frequencies aligned with your generational preferences
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">🤝 Cross-Generational Teams</h3>
                <p className="text-sm text-muted-foreground">
                  Build effective teams across Gen Z, Millennial, Gen X, and Boomer perspectives
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">📜 27-Chapter Biblical Framework</h3>
                <p className="text-sm text-muted-foreground">
                  Journey through sacred geometry and Hebrew letter wisdom for comprehensive leadership development
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">🧠 AI Biblical Coaching</h3>
                <p className="text-sm text-muted-foreground">
                  Receive personalized guidance from Claude AI trained in biblical wisdom and leadership principles
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}