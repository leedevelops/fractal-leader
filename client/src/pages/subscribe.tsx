import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('VITE_STRIPE_PUBLIC_KEY not configured - subscription upgrades disabled');
}
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) : null;

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
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
        title: "Payment Successful",
        description: "You are now subscribed to Fractal Leader!",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full"
        disabled={!stripe || !elements}
        data-testid="button-subscribe"
      >
        Subscribe to Pioneer Tier
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    apiRequest("POST", "/api/create-subscription")
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error("Error creating subscription:", error);
        toast({
          title: "Error",
          description: "Failed to create subscription. Please try again.",
          variant: "destructive",
        });
      });
  }, [toast]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen cosmic-gradient">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-gradient">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader className="text-center">
            <div className="hebrew-letter text-3xl mb-4">פ</div>
            <CardTitle className="text-2xl">Upgrade to Pioneer Tier</CardTitle>
            <p className="text-muted-foreground">
              Unlock advanced fractal analytics and team management features
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="mb-8">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">Included Features:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="text-green-400">✓</span>
                      <span>Unlimited team pacts</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-400">✓</span>
                      <span>Advanced fractal analytics</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-400">✓</span>
                      <span>Custom frequency packs</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-400">✓</span>
                      <span>Cross-generational insights</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold">Coming Soon:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <span>⏳</span>
                      <span>AR leadership overlay</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span>⏳</span>
                      <span>AI-powered coaching</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span>⏳</span>
                      <span>Global team synchronization</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
