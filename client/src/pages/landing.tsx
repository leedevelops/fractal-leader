import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import TheologicalPreface from "@/components/theological-preface";
import patternManifestoUrl from "@assets/the pattern_1757381372025.png";
import { 
  adaptContentForGeneration, 
  getUIAdaptationSettings, 
  generateOnboardingFlow,
  type Generation 
} from "@/lib/generational-adaptation";

export default function Landing() {
  const { user, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [splashTimer, setSplashTimer] = useState<NodeJS.Timeout | null>(null);
  const [, setLocation] = useLocation();
  const [previewGeneration, setPreviewGeneration] = useState<Generation | null>(null);
  
  // Get user's generation or use preview generation
  const currentGeneration = previewGeneration || ((user as any)?.generation as Generation) || 'millennial';
  const uiSettings = getUIAdaptationSettings(currentGeneration);
  const onboardingFlow = generateOnboardingFlow(currentGeneration);
  
  // Adapt content for current generation
  const baseContent = {
    welcome: {
      title: 'Lead with pattern',
      description: 'There is a pattern. A fractal matrix that connects all things, from the stars in the sky to the call in your heart.',
      callToAction: 'Request Access',
      duration: '5 min setup'
    },
    matrix: {
      title: 'The Fractal Leadership Matrix',
      description: '25 Fractal Tiers: The Pattern (Christ) & The Ripple (Paul)',
      callToAction: 'Explore Matrix',
      duration: '10 min'
    }
  };
  
  const adaptedContent = adaptContentForGeneration(currentGeneration, baseContent);

  // Splash screen stays up until user clicks "genisi go"

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
          <div className="hebrew-matrix-column" style={{left: '6%', animationDelay: '2.1s'}}>
            <span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '12%', animationDelay: '0.4s'}}>
            <span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '18%', animationDelay: '3.2s'}}>
            <span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '24%', animationDelay: '1.6s'}}>
            <span>ת</span><span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '30%', animationDelay: '4.1s'}}>
            <span>ס</span><span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '36%', animationDelay: '0.9s'}}>
            <span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '42%', animationDelay: '2.7s'}}>
            <span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '48%', animationDelay: '1.3s'}}>
            <span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '54%', animationDelay: '3.9s'}}>
            <span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '60%', animationDelay: '0.6s'}}>
            <span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '66%', animationDelay: '2.4s'}}>
            <span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '72%', animationDelay: '1.9s'}}>
            <span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '78%', animationDelay: '3.6s'}}>
            <span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '84%', animationDelay: '0.2s'}}>
            <span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span><span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '90%', animationDelay: '2.9s'}}>
            <span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span><span>ק</span><span>ר</span><span>ש</span><span>ת</span><span>א</span><span>ב</span><span>ג</span>
          </div>
          <div className="hebrew-matrix-column" style={{left: '97%', animationDelay: '1.1s'}}>
            <span>ד</span><span>ה</span><span>ו</span><span>ז</span><span>ח</span><span>ט</span><span>י</span><span>כ</span><span>ל</span><span>מ</span><span>נ</span><span>ס</span><span>ע</span><span>פ</span><span>צ</span>
          </div>
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
            onClick={() => setShowSplash(false)}
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
      {/* Header with navigation */}
      <header className="flex items-center justify-between p-6 border-b border-cosmic-golden/20">
        <div className="flex items-center space-x-3">
          <img 
            src="https://i.imgur.com/l5Ed97D.png" 
            alt="Fractal Leader" 
            className="h-12 w-auto filter drop-shadow-lg" 
            style={{filter: 'brightness(1.6) contrast(1.3) drop-shadow(0 0 20px rgba(251,191,36,0.6))'}}
          />
          <span className="text-2xl font-bold text-cosmic-golden">Fractal Leader</span>
        </div>
        
        {/* Generation Preview Selector */}
        {!user && (
          <div className="flex items-center space-x-1 bg-cosmic-void/80 rounded-full p-1 backdrop-blur-md border border-cosmic-golden/20">
            {[
              { key: 'gen_z', label: 'Gen Z', icon: '⚡', color: 'from-purple-500 to-pink-500', borderColor: 'border-purple-400' },
              { key: 'millennial', label: 'Millennial', icon: '🌟', color: 'from-blue-500 to-cyan-500', borderColor: 'border-blue-400' },
              { key: 'gen_x', label: 'Gen X', icon: '📈', color: 'from-gray-500 to-slate-500', borderColor: 'border-gray-400' },
              { key: 'boomer', label: 'Boomer', icon: '📚', color: 'from-indigo-600 to-purple-600', borderColor: 'border-indigo-400' }
            ].map(({ key, label, icon, color, borderColor }) => (
              <button
                key={key}
                onClick={() => setPreviewGeneration(key as Generation)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  currentGeneration === key 
                    ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105 border-2 ${borderColor}` 
                    : 'text-cosmic-silver hover:text-white hover:bg-cosmic-ethereal/30 border-2 border-transparent'
                }`}
              >
                <span className="text-lg">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
        
        <nav className="hidden md:flex space-x-8">
          <button 
            onClick={() => setLocation('/assessment')}
            className="text-cosmic-silver hover:text-cosmic-golden transition-colors"
          >
            Assessment
          </button>
          <button 
            onClick={() => setLocation('/matrix')}
            className="text-cosmic-silver hover:text-cosmic-golden transition-colors"
          >
            Matrix Map
          </button>
          <button 
            onClick={() => setLocation('/subscribe')}
            className="text-cosmic-silver hover:text-cosmic-golden transition-colors"
          >
            Pricing
          </button>
        </nav>
      </header>

      {/* Hero with cosmic background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Pattern Manifesto background */}
        <div 
          className="absolute inset-0 bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(135deg, 
              hsl(240, 15%, 8%, 0.85) 0%, 
              hsl(240, 15%, 8%, 0.75) 50%, 
              hsl(245, 20%, 5%, 0.85) 100%), 
              url(${patternManifestoUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center'
          }}
        />
        
        
        {/* Hero content */}
        <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
          {/* Generation Indicator */}
          {!user && previewGeneration && (
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-6 backdrop-blur-sm border ${
              currentGeneration === 'gen_z' ? 'bg-purple-500/20 border-purple-400/30 text-purple-200' :
              currentGeneration === 'millennial' ? 'bg-blue-500/20 border-blue-400/30 text-blue-200' :
              currentGeneration === 'gen_x' ? 'bg-gray-500/20 border-gray-400/30 text-gray-200' :
              'bg-indigo-500/20 border-indigo-400/30 text-indigo-200'
            }`}>
              <span className="text-sm font-medium">
                Viewing as: {
                  currentGeneration === 'gen_z' ? '🔥 Gen Z Experience' :
                  currentGeneration === 'millennial' ? '👥 Millennial Experience' :
                  currentGeneration === 'gen_x' ? '⚡ Gen X Experience' :
                  '📚 Boomer Experience'
                }
              </span>
            </div>
          )}
          
          <h1 className={`font-semibold text-amber-100/90 drop-shadow-2xl ${
            currentGeneration === 'gen_z' ? 'text-4xl md:text-6xl' :
            currentGeneration === 'boomer' ? 'text-6xl md:text-8xl' :
            'text-5xl md:text-7xl'
          }`} style={{textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 0 20px rgba(251,191,36,0.3)', marginBottom: '-240px'}}>
            {adaptedContent.welcome.title}
          </h1>
          
          
          {/* CTAs */}
          <div className="flex flex-wrap gap-6 justify-center" style={{marginTop: '300px'}}>
            <Button 
              onClick={() => setLocation('/assessment')}
              className={`px-10 py-4 font-semibold hover:shadow-2xl transition-all duration-300 ${
                currentGeneration === 'gen_z' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl hover:shadow-purple-500/25 text-lg' :
                currentGeneration === 'millennial' ? 'bg-gradient-to-r from-cosmic-golden to-cosmic-silver text-cosmic-deep rounded-2xl hover:shadow-cosmic-golden/25' :
                currentGeneration === 'gen_x' ? 'bg-slate-700 text-white rounded-xl hover:shadow-slate-500/25' :
                'bg-indigo-900 text-white rounded-lg hover:shadow-indigo-500/25 text-xl px-12 py-5'
              }`}
            >
              {adaptedContent.welcome.callToAction}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation('/matrix')}
              className={`px-10 py-4 font-semibold transition-all duration-300 ${
                currentGeneration === 'gen_z' ? 'border-2 border-purple-400/50 text-purple-300 rounded-3xl hover:bg-purple-400/10 hover:border-purple-400' :
                currentGeneration === 'millennial' ? 'border-2 border-cosmic-golden/50 text-cosmic-golden rounded-2xl hover:bg-cosmic-golden/10 hover:border-cosmic-golden' :
                currentGeneration === 'gen_x' ? 'border-2 border-slate-400/50 text-slate-300 rounded-xl hover:bg-slate-400/10 hover:border-slate-400' :
                'border-2 border-indigo-400/50 text-indigo-300 rounded-lg hover:bg-indigo-400/10 hover:border-indigo-400 text-xl px-12 py-5'
              }`}
            >
              {adaptedContent.matrix.callToAction}
            </Button>
          </div>
        </div>
      </section>

      {/* Matrix Map Section */}
      <section id="matrix-section" className="py-20 px-6 bg-cosmic-void relative">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className={`font-bold mb-8 text-cosmic-golden font-hebrew ${
            currentGeneration === 'gen_z' ? 'text-3xl' :
            currentGeneration === 'boomer' ? 'text-5xl' :
            'text-4xl'
          }`}>
            {adaptedContent.matrix.title}
          </h2>
          <p className={`text-cosmic-silver mb-12 mx-auto ${
            currentGeneration === 'boomer' ? 'max-w-3xl text-lg' :
            currentGeneration === 'gen_z' ? 'max-w-xl text-sm' :
            'max-w-2xl'
          }`}>
            {adaptedContent.matrix.description}
          </p>
          
          {/* Interactive matrix grid */}
          <div className="relative inline-block mb-16">
            <div className="grid grid-cols-2 grid-rows-2 gap-8 max-w-2xl mx-auto">
              {[
                { name: 'Identity', hebrew: 'י', desc: 'Revelation of Divine Design' },
                { name: 'Alignment', hebrew: 'ה', desc: 'Establishing Foundations' },
                { name: 'Vision', hebrew: 'ו', desc: 'Clarifying the Inner Compass' },
                { name: 'Action', hebrew: 'ה', desc: 'Walking in Wisdom' }
              ].map(({ name, hebrew, desc }) => (
                <div 
                  key={name}
                  className="flex flex-col items-center justify-center p-8 cursor-pointer group hover:bg-cosmic-ethereal/30 rounded-3xl transition-all duration-500 border-2 border-cosmic-golden/30 hover:border-cosmic-golden hover:shadow-2xl hover:shadow-cosmic-golden/20 backdrop-blur-sm bg-cosmic-void/20"
                  onClick={() => setLocation('/assessment')}
                >
                  <span className="hebrew-letter text-6xl mb-4 text-cosmic-golden group-hover:scale-110 transition-transform">{hebrew}</span>
                  <h3 className="text-cosmic-silver group-hover:text-cosmic-golden font-bold text-xl mb-2">
                    {name}
                  </h3>
                  <p className="text-cosmic-silver/70 text-sm text-center">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rest of content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">


        {/* Generation Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Adapted for Every Generation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
              <div className="text-4xl mb-4 flex justify-center items-center h-16">
                <span className="text-purple-400">⚡</span>
              </div>
              <h3 className="font-semibold mb-2">Gen Z</h3>
              <p className="text-sm text-muted-foreground">
                Gamified learning, micro-content, streak mechanics
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
              <div className="text-4xl mb-4 flex justify-center items-center h-16">
                <span className="text-blue-400">🌟</span>
              </div>
              <h3 className="font-semibold mb-2">Millennial</h3>
              <p className="text-sm text-muted-foreground">
                Collaborative challenges, peer feedback, cohort experiences
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg">
              <div className="text-4xl mb-4 flex justify-center items-center h-16">
                <span className="text-green-400">📈</span>
              </div>
              <h3 className="font-semibold mb-2">Gen X</h3>
              <p className="text-sm text-muted-foreground">
                Practical templates, KPI integration, case studies
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg">
              <div className="text-4xl mb-4 flex justify-center items-center h-16">
                <span className="text-amber-400">📚</span>
              </div>
              <h3 className="font-semibold mb-2">Boomer</h3>
              <p className="text-sm text-muted-foreground">
                Structured curricula, milestone tracking, printable resources
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-primary/20 p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Leadership?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of leaders discovering their biblical patterns and building 
            multi-generational teams that thrive.
          </p>
          <div className="flex flex-wrap gap-6 justify-center">
            <Button 
              size="lg" 
              onClick={() => setLocation('/assessment')}
              className="px-12 py-4 text-lg"
              data-testid="button-start-journey"
            >
              Start Your Journey
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              onClick={() => document.getElementById('matrix-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-12 py-4 text-lg"
              data-testid="button-explore-matrix"
            >
              Explore the Matrix
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
