import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function SubscriptionTier() {
  const { user } = useAuth() as any;
  const [, setLocation] = useLocation();

  const currentTier = user?.subscriptionTier || 'seeker';

  const tierFeatures = {
    seeker: {
      name: 'Seeker',
      price: 'Free',
      hebrew: 'ש',
      color: 'text-muted-foreground',
      features: [
        { name: 'Basic fractal visualization', included: true },
        { name: 'R1-R2 assessments', included: true },
        { name: 'Individual practices', included: true },
        { name: 'Team pacts (1)', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'Custom frequencies', included: false },
      ],
    },
    pioneer: {
      name: 'Pioneer',
      price: '$45/month',
      hebrew: 'פ',
      color: 'text-primary',
      features: [
        { name: 'Advanced fractal analytics', included: true },
        { name: 'All R1-R5 + Hidden Track', included: true },
        { name: 'Unlimited team pacts', included: true },
        { name: 'Custom frequency packs', included: true },
        { name: 'Cross-gen insights', included: true },
        { name: 'AR leadership overlay', included: false },
      ],
    },
    visionary: {
      name: 'Visionary',
      price: '$99/month',
      hebrew: 'ח',
      color: 'text-cosmic-golden',
      features: [
        { name: 'Everything in Pioneer', included: true },
        { name: 'AR leadership overlay', included: true },
        { name: 'AI-powered coaching', included: true },
        { name: 'Global team sync', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'White-label options', included: true },
      ],
    },
  };

  const currentTierData = tierFeatures[currentTier as keyof typeof tierFeatures];
  const nextTier = currentTier === 'seeker' ? 'pioneer' : 'visionary';
  const nextTierData = tierFeatures[nextTier as keyof typeof tierFeatures];

  const handleUpgrade = () => {
    setLocation('/subscribe');
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-primary/20" data-testid="card-subscription-tier">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={`font-semibold ${currentTierData.color}`}>
              {currentTierData.name} Tier
            </CardTitle>
            <p className="text-sm text-muted-foreground">{currentTierData.price}</p>
          </div>
          <div className={`hebrew-letter text-2xl ${currentTierData.color}`}>
            {currentTierData.hebrew}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 mb-6">
          {currentTierData.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              {feature.included ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
              <span className={feature.included ? '' : 'text-muted-foreground'}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>
        
        {currentTier !== 'visionary' && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              Upgrade to {nextTierData.name}:
            </div>
            <div className="text-xs space-y-1">
              {nextTierData.features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-muted-foreground">
                  <ArrowRight className="w-3 h-3" />
                  <span>{feature.name}</span>
                </div>
              ))}
            </div>
            <Button 
              onClick={handleUpgrade}
              className="w-full mt-4 py-2"
              data-testid="button-upgrade-tier"
            >
              Upgrade to {nextTierData.name}
            </Button>
          </div>
        )}
        
        {currentTier === 'visionary' && (
          <div className="text-center">
            <Badge variant="secondary" className="bg-cosmic-golden/20 text-cosmic-golden">
              Maximum Tier Achieved
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              You have access to all available features
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
