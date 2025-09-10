import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Navigation from '@/components/ui/navigation';
import { Play, Pause, Square, Volume2, Waves, Timer, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FrequencyData {
  frequency: number;
  name: string;
  description: string;
  hebrewLetter: string;
  biblicalConnection: string;
  color: string;
}

// Biblical frequencies from the Sacred Matrix
const biblicalFrequencies: FrequencyData[] = [
  {
    frequency: 174,
    name: 'Foundation',
    description: 'Removes pain and stress, brings security',
    hebrewLetter: 'א',
    biblicalConnection: 'Aleph - God as the First and the One',
    color: 'bg-red-500/20 text-red-700 dark:text-red-300'
  },
  {
    frequency: 260,
    name: 'Divine Light', 
    description: 'Sacred frequency mentioned in ancient texts',
    hebrewLetter: 'י',
    biblicalConnection: 'Yod - The divine spark within',
    color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
  },
  {
    frequency: 285,
    name: 'Healing Energy',
    description: 'Influences energy fields and cellular healing', 
    hebrewLetter: 'ה',
    biblicalConnection: 'Hey - Divine breath and revelation',
    color: 'bg-green-500/20 text-green-700 dark:text-green-300'
  },
  {
    frequency: 396,
    name: 'Liberation',
    description: 'Liberating guilt and fear, grounding',
    hebrewLetter: 'ו',
    biblicalConnection: 'Vav - The connecting hook of heaven and earth',
    color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
  },
  {
    frequency: 417,
    name: 'Transformation',
    description: 'Facilitates change and removes negativity',
    hebrewLetter: 'ה',
    biblicalConnection: 'Final Hey - Manifestation of divine will',
    color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
  },
  {
    frequency: 528,
    name: 'Love & Miracle',
    description: 'DNA repair, love resonance, miracles',
    hebrewLetter: 'י',
    biblicalConnection: 'Yeshua - The miracle-working frequency',
    color: 'bg-cosmic-golden/20 text-cosmic-golden'
  },
  {
    frequency: 639,
    name: 'Relationships',
    description: 'Harmonizing relationships and community',
    hebrewLetter: 'ש',
    biblicalConnection: 'Shin - The fire of divine transformation',
    color: 'bg-pink-500/20 text-pink-700 dark:text-pink-300'
  },
  {
    frequency: 741,
    name: 'Intuition',
    description: 'Awakening intuition and spiritual insight',
    hebrewLetter: 'ו',
    biblicalConnection: 'Vav - Connection to higher wisdom',
    color: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
  },
  {
    frequency: 852,
    name: 'Spiritual Order',
    description: 'Return to spiritual order and divine alignment',
    hebrewLetter: 'ע',
    biblicalConnection: 'Ayin - The eye that sees divine truth',
    color: 'bg-teal-500/20 text-teal-700 dark:text-teal-300'
  },
  {
    frequency: 963,
    name: 'Unity Consciousness',
    description: 'Connects with divine frequency and unity',
    hebrewLetter: 'ה',
    biblicalConnection: 'Hey - Complete revelation and divine presence',
    color: 'bg-violet-500/20 text-violet-700 dark:text-violet-300'
  }
];

class FrequencyGenerator {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  async initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async playFrequency(frequency: number, volume: number = 0.1) {
    await this.initAudio();
    
    if (this.oscillator) {
      this.stopFrequency();
    }

    this.oscillator = this.audioContext!.createOscillator();
    this.gainNode = this.audioContext!.createGain();

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext!.destination);

    this.oscillator.frequency.setValueAtTime(frequency, this.audioContext!.currentTime);
    this.oscillator.type = 'sine';
    this.gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(volume, this.audioContext!.currentTime + 0.1);

    this.oscillator.start();
  }

  stopFrequency() {
    if (this.oscillator && this.gainNode) {
      this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext!.currentTime + 0.1);
      this.oscillator.stop(this.audioContext!.currentTime + 0.1);
      this.oscillator = null;
      this.gainNode = null;
    }
  }

  isPlaying() {
    return this.oscillator !== null;
  }
}

export default function Meditation() {
  const { toast } = useToast();
  const [selectedFrequency, setSelectedFrequency] = useState<FrequencyData>(biblicalFrequencies[5]); // Default to 528Hz Love & Miracle
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([20]);
  const [duration, setDuration] = useState(5); // minutes
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const frequencyGeneratorRef = useRef<FrequencyGenerator>(new FrequencyGenerator());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      frequencyGeneratorRef.current.stopFrequency();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startMeditation = async () => {
    try {
      await frequencyGeneratorRef.current.playFrequency(selectedFrequency.frequency, volume[0] / 100);
      setIsPlaying(true);
      
      // Start timer if duration is set
      if (duration > 0) {
        setTimeRemaining(duration * 60); // Convert to seconds
        setIsTimerActive(true);
        
        timerRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              stopMeditation();
              toast({
                title: 'Meditation Complete',
                description: `Your ${selectedFrequency.name} meditation session has finished.`,
              });
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      
      toast({
        title: 'Meditation Started',
        description: `Now playing ${selectedFrequency.frequency}Hz - ${selectedFrequency.name}`,
      });
    } catch (error) {
      toast({
        title: 'Audio Error',
        description: 'Could not start audio. Please check your browser permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopMeditation = () => {
    frequencyGeneratorRef.current.stopFrequency();
    setIsPlaying(false);
    setIsTimerActive(false);
    setTimeRemaining(0);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 && timeRemaining > 0 
    ? ((duration * 60 - timeRemaining) / (duration * 60)) * 100
    : 0;

  return (
    <div className="min-h-screen cosmic-gradient">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Biblical Frequency Meditation</h1>
          <p className="text-muted-foreground">
            Experience the healing power of biblical frequencies rooted in Hebrew wisdom and divine patterns
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Frequency Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <Waves className="h-5 w-5 text-primary mr-2" />
                <CardTitle>Sacred Frequencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {biblicalFrequencies.map((freq) => (
                    <div 
                      key={freq.frequency}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedFrequency.frequency === freq.frequency 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedFrequency(freq)}
                      data-testid={`frequency-card-${freq.frequency}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="hebrew-letter text-xl">{freq.hebrewLetter}</div>
                        <Badge className={freq.color}>
                          {freq.frequency}Hz
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{freq.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{freq.description}</p>
                      <p className="text-xs text-primary font-medium">{freq.biblicalConnection}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Frequency Display */}
            <Card className={`bg-card/80 backdrop-blur-sm border-border ${selectedFrequency.color.replace('text-', 'border-').replace('dark:text-', 'dark:border-')}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="hebrew-letter text-3xl">{selectedFrequency.hebrewLetter}</div>
                    <div>
                      <CardTitle className="text-xl">{selectedFrequency.frequency}Hz - {selectedFrequency.name}</CardTitle>
                      <p className="text-muted-foreground">{selectedFrequency.biblicalConnection}</p>
                    </div>
                  </div>
                  <Badge className={`text-lg px-4 py-2 ${selectedFrequency.color}`}>
                    {selectedFrequency.frequency}Hz
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground mb-4">{selectedFrequency.description}</p>
                
                {isTimerActive && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Meditation Progress</span>
                      <span className="text-sm font-medium">{formatTime(timeRemaining)} remaining</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                )}
                
                <div className="flex items-center space-x-4">
                  <Button
                    size="lg"
                    onClick={isPlaying ? stopMeditation : startMeditation}
                    className={`px-8 py-3 ${isPlaying ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}
                    data-testid={isPlaying ? 'button-stop' : 'button-play'}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="mr-2 h-4 w-4" />
                        Stop Meditation
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Begin Meditation
                      </>
                    )}
                  </Button>
                  
                  {isPlaying && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Playing {selectedFrequency.frequency}Hz</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <Volume2 className="h-5 w-5 text-primary mr-2" />
                <CardTitle>Audio Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Volume</label>
                  <Slider
                    value={volume}
                    onValueChange={(value) => {
                      setVolume(value);
                      if (isPlaying) {
                        // Update volume in real-time
                        startMeditation();
                      }
                    }}
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                    data-testid="slider-volume"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Quiet</span>
                    <span>{volume[0]}%</span>
                    <span>Loud</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium mb-2 block">Duration (minutes)</label>
                  <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                    <SelectTrigger data-testid="select-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Continuous</SelectItem>
                      <SelectItem value="3">3 minutes</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="20">20 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <Zap className="h-5 w-5 text-primary mr-2" />
                <CardTitle>Meditation Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p><strong>Preparation:</strong></p>
                  <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                    <li>Find a quiet, comfortable space</li>
                    <li>Use headphones for best experience</li>
                    <li>Set volume to a comfortable level</li>
                  </ul>
                </div>
                
                <div className="text-sm space-y-2">
                  <p><strong>During Meditation:</strong></p>
                  <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                    <li>Close your eyes and breathe naturally</li>
                    <li>Focus on the frequency's biblical meaning</li>
                    <li>Let the sound wash over you</li>
                    <li>Pray or meditate as led by the Spirit</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}