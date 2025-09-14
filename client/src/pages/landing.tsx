import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SkipForward } from "lucide-react";

const assessmentSchema = z.object({
  archetype: z.enum(["leader", "pioneer", "organizer"], {
    required_error: "Please select your leadership style"
  })
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

export default function Landing() {
  const { user, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(() => 
    localStorage.getItem('seenSplash') !== 'true'
  );
  const [, setLocation] = useLocation();
  
  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      archetype: undefined
    }
  });

  // If user is logged in, redirect to home
  useEffect(() => {
    if (user && !isLoading) {
      setLocation('/home');
    }
  }, [user, isLoading, setLocation]);

  // Handle splash screen dismissal
  const handleDismissSplash = () => {
    localStorage.setItem('seenSplash', 'true');
    setShowSplash(false);
  };

  // Handle assessment submission
  const onSubmit = (data: AssessmentFormData) => {
    localStorage.setItem('userType', data.archetype);
    setLocation(`/matrix?chapter=1&archetype=${data.archetype}`);
  };

  // Splash screen with Hebrew matrix rain
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden" style={{background: 'linear-gradient(135deg, #001122 0%, #000611 30%, #001a33 60%, #000408 100%)'}}>
        {/* Hebrew Matrix Rain */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="hebrew-matrix-column" style={{left: '3%', animationDelay: '0s'}}>
            <span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '9%', animationDelay: '1s'}}>
            <span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '15%', animationDelay: '2.5s'}}>
            <span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '21%', animationDelay: '0.8s'}}>
            <span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '27%', animationDelay: '3s'}}>
            <span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '33%', animationDelay: '1.2s'}}>
            <span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '39%', animationDelay: '4s'}}>
            <span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '45%', animationDelay: '0.3s'}}>
            <span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '51%', animationDelay: '2.8s'}}>
            <span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '57%', animationDelay: '1.7s'}}>
            <span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '63%', animationDelay: '3.5s'}}>
            <span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '69%', animationDelay: '0.7s'}}>
            <span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span><span>ד</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '75%', animationDelay: '2.2s'}}>
            <span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span><span>ק</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '81%', animationDelay: '4.2s'}}>
            <span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '87%', animationDelay: '1.4s'}}>
            <span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '93%', animationDelay: '3.8s'}}>
            <span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span>
          </div>
        </div>
        
        {/* Skip Button */}
        <div className="absolute top-6 right-6 z-20">
          <Button 
            variant="ghost"
            onClick={handleDismissSplash}
            className="text-blue-100 hover:text-white hover:bg-blue-900/30"
            data-testid="button-skip-splash"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Skip
          </Button>
        </div>

        {/* Center Content */}
        <div className="text-center space-y-8 relative z-10">
          <div className="hebrew-letter text-8xl animate-hebrew-glow text-white" style={{textShadow: '0 0 30px #00b4ff, 0 0 60px #0099ff', filter: 'brightness(1.8) contrast(1.2)'}}>א</div>
          <h1 className="text-4xl font-mystical text-white">In the beginning...</h1>
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto"></div>
          <p className="text-lg text-blue-100 max-w-md mx-auto">
            There is a pattern. A fractal matrix that connects all things, from the stars in the sky to the call in your heart.
          </p>
          <Button 
            onClick={handleDismissSplash}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/25"
            data-testid="button-genesis-go"
          >
            Genesis Go
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-deep">
      {/* Hebrew Matrix Background */}
      <div className="hebrew-matrix-background" />
      
      {/* Main Assessment Section */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Title */}
          <div className="hebrew-letter text-6xl md:text-8xl animate-hebrew-glow text-cosmic-golden mb-8">א</div>
          
          <h1 className="text-4xl md:text-6xl font-mystical text-white mb-6" style={{textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 0 20px rgba(251,191,36,0.3)'}}>
            Hebrew Leadership Journey
          </h1>
          
          <p className="text-xl text-cosmic-silver mb-12 max-w-md mx-auto">
            Discover your biblical leadership archetype and begin your transformational journey through the sacred matrix.
          </p>
          
          {/* Inline Assessment Form */}
          <Card className="bg-cosmic-void/80 backdrop-blur-md border-2 border-cosmic-golden/30 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-cosmic-golden text-2xl mb-2">
                What describes your leadership style?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="archetype"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="space-y-4"
                            data-testid="radio-group-archetype"
                          >
                            <div className="flex items-start space-x-3 p-4 bg-cosmic-deep/30 rounded-lg hover:bg-cosmic-deep/50 transition-colors">
                              <RadioGroupItem value="leader" id="leader" className="mt-1" data-testid="radio-leader" />
                              <Label htmlFor="leader" className="flex-1 cursor-pointer">
                                <div className="font-semibold text-cosmic-golden">Leader</div>
                                <div className="text-sm text-cosmic-silver mt-1">
                                  You naturally guide and inspire others through vision and wisdom
                                </div>
                              </Label>
                            </div>
                            
                            <div className="flex items-start space-x-3 p-4 bg-cosmic-deep/30 rounded-lg hover:bg-cosmic-deep/50 transition-colors">
                              <RadioGroupItem value="pioneer" id="pioneer" className="mt-1" data-testid="radio-pioneer" />
                              <Label htmlFor="pioneer" className="flex-1 cursor-pointer">
                                <div className="font-semibold text-cosmic-golden">Pioneer</div>
                                <div className="text-sm text-cosmic-silver mt-1">
                                  You break new ground and explore uncharted territories with courage
                                </div>
                              </Label>
                            </div>
                            
                            <div className="flex items-start space-x-3 p-4 bg-cosmic-deep/30 rounded-lg hover:bg-cosmic-deep/50 transition-colors">
                              <RadioGroupItem value="organizer" id="organizer" className="mt-1" data-testid="radio-organizer" />
                              <Label htmlFor="organizer" className="flex-1 cursor-pointer">
                                <div className="font-semibold text-cosmic-golden">Organizer</div>
                                <div className="text-sm text-cosmic-silver mt-1">
                                  You bring order, structure, and coordination to achieve collective goals
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-cosmic-golden text-cosmic-deep hover:bg-cosmic-golden/90 py-3 text-lg font-semibold transition-all duration-300"
                    data-testid="button-begin-journey"
                  >
                    Begin Your Journey
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Sign In Option */}
          <div className="mt-8">
            <Button 
              variant="outline"
              onClick={() => setLocation('/demo-login')}
              className="border-cosmic-golden/50 text-cosmic-golden hover:bg-cosmic-golden/10 px-6 py-2"
              data-testid="button-sign-in"
            >
              Already have an account? Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}