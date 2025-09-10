// 260 Hz frequency meditation and sound generation utilities

interface MeditationSession {
  frequency: number;
  duration: number;
  waveform: OscillatorType;
  volume: number;
}

interface AudioNodes {
  audioContext: AudioContext;
  oscillator: OscillatorNode;
  gainNode: GainNode;
  analyser: AnalyserNode;
}

/**
 * Biblical frequencies and their properties
 */
export const biblicalFrequencies = {
  260: { name: "Divine Transformation", chakra: "root", intention: "Grounding and stability" },
  396: { name: "Liberation", chakra: "root", intention: "Liberating fear and guilt" },
  417: { name: "Transmutation", chakra: "sacral", intention: "Facilitating change" },
  528: { name: "Love", chakra: "heart", intention: "DNA repair and love" },
  639: { name: "Connection", chakra: "heart", intention: "Harmonious relationships" },
  741: { name: "Expression", chakra: "throat", intention: "Self-expression and solutions" },
  852: { name: "Awakening", chakra: "third-eye", intention: "Returning to spiritual order" },
  963: { name: "Transcendence", chakra: "crown", intention: "Connection to divine consciousness" },
};

let currentAudioNodes: AudioNodes | null = null;
let meditationTimer: NodeJS.Timeout | null = null;

/**
 * Initialize Web Audio API context
 */
function initializeAudioContext(): AudioContext {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  return new AudioContextClass();
}

/**
 * Create audio nodes for frequency generation
 */
function createAudioNodes(audioContext: AudioContext): AudioNodes {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const analyser = audioContext.createAnalyser();
  
  // Configure analyser for visualization
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  
  // Connect the audio graph
  oscillator.connect(gainNode);
  gainNode.connect(analyser);
  analyser.connect(audioContext.destination);
  
  return { audioContext, oscillator, gainNode, analyser };
}

/**
 * Start frequency meditation session
 */
export async function startFrequencyMeditation(
  frequency: number = 260,
  duration: number = 300, // 5 minutes default
  options: Partial<MeditationSession> = {}
): Promise<void> {
  try {
    // Stop any existing session
    await stopFrequencyMeditation();
    
    const audioContext = initializeAudioContext();
    
    // Resume context if suspended (required by browser autoplay policies)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    const nodes = createAudioNodes(audioContext);
    currentAudioNodes = nodes;
    
    // Configure oscillator
    nodes.oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    nodes.oscillator.type = options.waveform || 'sine';
    
    // Configure volume with gentle fade-in
    const volume = options.volume || 0.1;
    nodes.gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    nodes.gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 2);
    
    // Start the oscillator
    nodes.oscillator.start();
    
    // Set up meditation timer
    meditationTimer = setTimeout(() => {
      stopFrequencyMeditation();
    }, duration * 1000);
    
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('meditationStarted', {
      detail: { frequency, duration, ...options }
    }));
    
    console.log(`Starting ${frequency} Hz meditation for ${duration} seconds`);
    
  } catch (error) {
    console.error('Error starting frequency meditation:', error);
    throw error;
  }
}

/**
 * Stop frequency meditation session
 */
export async function stopFrequencyMeditation(): Promise<void> {
  try {
    if (currentAudioNodes) {
      const { audioContext, oscillator, gainNode } = currentAudioNodes;
      
      // Fade out
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);
      
      // Stop oscillator after fade
      setTimeout(() => {
        try {
          oscillator.stop();
          audioContext.close();
        } catch (e) {
          // Oscillator may already be stopped
          console.warn('Oscillator stop warning:', e);
        }
      }, 1100);
      
      currentAudioNodes = null;
    }
    
    if (meditationTimer) {
      clearTimeout(meditationTimer);
      meditationTimer = null;
    }
    
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('meditationStopped'));
    
  } catch (error) {
    console.error('Error stopping frequency meditation:', error);
  }
}

/**
 * Check if meditation is currently active
 */
export function isMeditationActive(): boolean {
  return currentAudioNodes !== null;
}

/**
 * Get current meditation state
 */
export function getMeditationState(): { active: boolean; frequency?: number; nodes?: AudioNodes } {
  return {
    active: currentAudioNodes !== null,
    frequency: currentAudioNodes?.oscillator.frequency.value,
    nodes: currentAudioNodes || undefined,
  };
}

/**
 * Create binaural beats for enhanced meditation
 */
export async function startBinauralMeditation(
  baseFrequency: number = 260,
  beatFrequency: number = 4, // Hz difference for binaural effect
  duration: number = 300
): Promise<void> {
  try {
    const audioContext = initializeAudioContext();
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Create separate oscillators for left and right channels
    const leftOscillator = audioContext.createOscillator();
    const rightOscillator = audioContext.createOscillator();
    const leftGain = audioContext.createGain();
    const rightGain = audioContext.createGain();
    const merger = audioContext.createChannelMerger(2);
    
    // Configure frequencies for binaural beats
    leftOscillator.frequency.setValueAtTime(baseFrequency, audioContext.currentTime);
    rightOscillator.frequency.setValueAtTime(baseFrequency + beatFrequency, audioContext.currentTime);
    
    // Set waveform
    leftOscillator.type = 'sine';
    rightOscillator.type = 'sine';
    
    // Configure volume
    const volume = 0.05; // Lower volume for binaural
    leftGain.gain.setValueAtTime(0, audioContext.currentTime);
    rightGain.gain.setValueAtTime(0, audioContext.currentTime);
    leftGain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 2);
    rightGain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 2);
    
    // Connect audio graph for stereo
    leftOscillator.connect(leftGain);
    rightOscillator.connect(rightGain);
    leftGain.connect(merger, 0, 0); // Left channel
    rightGain.connect(merger, 0, 1); // Right channel
    merger.connect(audioContext.destination);
    
    // Start oscillators
    leftOscillator.start();
    rightOscillator.start();
    
    // Store references for cleanup
    currentAudioNodes = {
      audioContext,
      oscillator: leftOscillator, // Store one for reference
      gainNode: leftGain,
      analyser: audioContext.createAnalyser(), // Dummy for interface
    };
    
    // Set timer
    meditationTimer = setTimeout(() => {
      stopFrequencyMeditation();
    }, duration * 1000);
    
    window.dispatchEvent(new CustomEvent('binauralMeditationStarted', {
      detail: { baseFrequency, beatFrequency, duration }
    }));
    
  } catch (error) {
    console.error('Error starting binaural meditation:', error);
    throw error;
  }
}

/**
 * Generate frequency sequence for progressive meditation
 */
export async function startProgressiveMeditation(
  frequencies: number[] = [260, 396, 528],
  intervalDuration: number = 120 // 2 minutes per frequency
): Promise<void> {
  let currentIndex = 0;
  
  const playNextFrequency = async () => {
    if (currentIndex >= frequencies.length) {
      await stopFrequencyMeditation();
      return;
    }
    
    const frequency = frequencies[currentIndex];
    await startFrequencyMeditation(frequency, intervalDuration);
    
    window.dispatchEvent(new CustomEvent('progressiveMeditationUpdate', {
      detail: { 
        frequency, 
        index: currentIndex, 
        total: frequencies.length,
        progress: (currentIndex + 1) / frequencies.length 
      }
    }));
    
    currentIndex++;
    
    // Schedule next frequency
    setTimeout(playNextFrequency, intervalDuration * 1000);
  };
  
  await playNextFrequency();
}

/**
 * Get frequency analysis data for visualization
 */
export function getFrequencyAnalysis(): Uint8Array | null {
  if (!currentAudioNodes?.analyser) return null;
  
  const dataArray = new Uint8Array(currentAudioNodes.analyser.frequencyBinCount);
  currentAudioNodes.analyser.getByteFrequencyData(dataArray);
  return dataArray;
}

/**
 * Generate meditation session based on user archetype
 */
export function createArchetypeMeditation(archetype: string): {
  frequencies: number[];
  duration: number;
  intention: string;
} {
  const meditations = {
    pioneer: {
      frequencies: [260, 741], // Grounding + Expression
      duration: 300,
      intention: "Ground your vision and express your pioneering spirit",
    },
    organizer: {
      frequencies: [396, 639], // Liberation + Connection
      duration: 360,
      intention: "Release limiting patterns and strengthen team bonds",
    },
    builder: {
      frequencies: [417, 528], // Transmutation + Love
      duration: 420,
      intention: "Transform challenges into loving structures",
    },
    guardian: {
      frequencies: [528, 852, 963], // Love + Awakening + Transcendence
      duration: 480,
      intention: "Protect through love, awaken wisdom, transcend boundaries",
    },
  };
  
  return meditations[archetype as keyof typeof meditations] || meditations.pioneer;
}

/**
 * Map Biblical Matrix spiritual frequency names to Hz values
 */
export const matrixFrequencies: Record<string, number> = {
  "Deep Stillness": 136.1, // Om frequency for deep contemplation
  "Triune Tone": 528, // DNA repair frequency for spiritual integration
  "Exilic Echo": 396, // Liberation frequency for exile/transformation
  "Structure Hum": 741, // Expression frequency for divine order
  "Subterranean Hum": 174, // Pain relief frequency for hidden depths
  "Tree Flame Pulse": 639, // Love frequency for divine connection
  "Wings of Wisdom Vibration": 852, // Intuition frequency
  "Guardian Harmonic": 417, // Facilitating change frequency
  "Recursive Tone": 528, // Transformation frequency for patterns
  "Root Resonance": 396, // Grounding liberation frequency
  "Visionary Call": 963, // Divine consciousness frequency
  "Soul Frequency": 741, // Expression of authentic self
  "Mission Tuning": 528, // DNA repair for divine purpose
  "Wounded Harmony": 417, // Healing and change frequency
  "Sight Pulse": 852, // Awakening intuitive sight
  "Passion Current": 639, // Heart connection frequency
  "Aligned Decision Pulse": 741, // Clear expression frequency
  "Embodied Presence": 528, // Transformation in physical form
  "Mirror Tone": 396, // Liberation through reflection
  "Radiant Bloom": 528, // Full transformation frequency
  "Incarnational Wave": 963, // Highest divine consciousness
  "Sword Spiral Resonance": 741, // Cutting through with truth
  "Global Pulse": 528, // Universal transformation
  "Covenant Flame Ring": 852, // Awakening to divine covenant
  "Shofar commission Resonance": 963, // Divine commissioning
};

/**
 * Get frequency Hz value from Biblical Matrix spiritual frequency name
 */
export function getMatrixFrequency(spiritualFrequencyName: string): number {
  return matrixFrequencies[spiritualFrequencyName] || 528; // Default to love/transformation
}
