import { useEffect, useRef, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, Headphones, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { generateFractal } from "@/lib/hebrew-conversion";
import { startFrequencyMeditation, getMatrixFrequency } from "@/lib/frequency-meditation";
import FractalMatrix from "./fractal-matrix/FractalMatrix";
import { FMData, FMNode } from "./fractal-matrix/types";

export default function FractalVisualization() {
  const { user } = useAuth() as any;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDay, setCurrentDay] = useState(3);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Get current chapter data from Biblical Matrix
  const { data: currentChapter } = useQuery({
    queryKey: ['/api/biblical-matrix/chapter', currentDay],
    enabled: !!currentDay,
  });

  // Generate fractal data based on Hebrew name and biblical data
  const fractalData: FMData = useMemo(() => {
    if (!user?.hebrewName) {
      return {
        nodes: [
          { id: "hub-center", kind: "Hub", label: "פ", element: "Spirit" },
          { id: "chapter-1", kind: "Chapter", label: "Genesis", element: "Fire", chapter: 1 },
          { id: "stone-aleph", kind: "Stone", label: "א", element: "Air" },
          { id: "tribe-judah", kind: "Tribe", label: "Judah", element: "Fire" },
          { id: "prophet-moses", kind: "Prophet", label: "Moses", element: "Earth" },
          { id: "apostle-paul", kind: "Apostle", label: "Paul", element: "Water" },
          { id: "frequency-260", kind: "Frequency", label: "260Hz", element: "Spirit" },
          { id: "book-torah", kind: "Book", label: "Torah", element: "Fire" },
          { id: "dimension-alpha", kind: "Dimension", label: "Aleph", element: "Spirit" }
        ],
        edges: [
          { source: "hub-center", target: "chapter-1", relation: "Default" },
          { source: "chapter-1", target: "stone-aleph", relation: "Default" },
          { source: "stone-aleph", target: "tribe-judah", relation: "Default" },
          { source: "prophet-moses", target: "apostle-paul", relation: "PropheticApostolic" },
          { source: "frequency-260", target: "book-torah", relation: "Default" }
        ]
      };
    }

    const hebrewLetters = user.hebrewName.split('');
    const fractalPoints = generateFractal(user.hebrewName);
    
    const nodes: FMNode[] = [
      // Hub - center with main Hebrew letter
      { 
        id: "hub-center", 
        kind: "Hub", 
        label: hebrewLetters[0] || "פ", 
        element: "Spirit" 
      },
      // Chapter - current day/chapter
      { 
        id: `chapter-${currentDay}`, 
        kind: "Chapter", 
        label: (currentChapter as any)?.name || `Day ${currentDay}`, 
        element: "Fire",
        chapter: currentDay 
      },
      // Stones - Hebrew letters
      ...hebrewLetters.slice(1, 4).map((letter: string, index: number) => ({
        id: `stone-${index}`,
        kind: "Stone" as const,
        label: letter,
        element: (["Air", "Water", "Earth"] as const)[index % 3]
      })),
      // Tribes - based on fractal points
      ...fractalPoints.slice(0, 3).map((point: any, index: number) => ({
        id: `tribe-${index}`,
        kind: "Tribe" as const,
        label: `Tribe ${index + 1}`,
        element: (["Fire", "Air", "Water"] as const)[index % 3]
      })),
      // Prophet and Apostle - biblical pairing
      {
        id: "prophet-current",
        kind: "Prophet",
        label: user.archetype === "Pioneer" ? "Abraham" : user.archetype === "Builder" ? "Moses" : "David",
        element: "Earth"
      },
      {
        id: "apostle-current",
        kind: "Apostle", 
        label: user.archetype === "Pioneer" ? "Paul" : user.archetype === "Builder" ? "Peter" : "John",
        element: "Water"
      },
      // Frequency - sacred frequency for current day
      {
        id: "frequency-current",
        kind: "Frequency",
        label: "260Hz",
        element: "Spirit"
      },
      // Book - current biblical context
      {
        id: "book-current",
        kind: "Book",
        label: "Genesis",
        element: "Fire"
      },
      // Dimension - spiritual dimension
      {
        id: "dimension-current",
        kind: "Dimension",
        label: "Aleph",
        element: "Spirit"
      }
    ];

    const edges = [
      { source: "hub-center", target: `chapter-${currentDay}` },
      { source: `chapter-${currentDay}`, target: "stone-0" },
      { source: "stone-0", target: "tribe-0" },
      { source: "tribe-0", target: "prophet-current" },
      { source: "prophet-current", target: "apostle-current", relation: "PropheticApostolic" as const },
      { source: "frequency-current", target: "book-current" },
      { source: "book-current", target: "dimension-current" },
      // Connect frequency to hub for meditation
      { source: "hub-center", target: "frequency-current" }
    ];

    return { nodes, edges };
  }, [user?.hebrewName, user?.archetype, currentDay, currentChapter]);

  const handleMeditation = async () => {
    setIsPlaying(true);
    try {
      await startFrequencyMeditation(260);
    } catch (error) {
      console.error("Error starting meditation:", error);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleRegenerate = () => {
    // Trigger fractal regeneration by advancing day
    setCurrentDay(prev => (prev % 6) + 1);
    setSelectedNodeId(null);
  };

  const handleNodeSelect = (nodeId: string, node?: FMNode) => {
    setSelectedNodeId(nodeId);
    if (node?.kind === "Frequency") {
      // Auto-trigger meditation when frequency node is selected
      handleMeditation();
    }
  };

  const handleExport = (data: { png: string; svg: string; json: string; url: string }) => {
    // Download the PNG
    const link = document.createElement('a');
    link.download = `fractal-pattern-${user?.hebrewName || 'pattern'}-day${currentDay}.png`;
    link.href = data.png;
    link.click();
  };

  return (
    <Card className="bg-card rounded-lg border border-border" data-testid="card-fractal-visualization">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-semibold">Your Fractal Pattern</CardTitle>
          <div className="text-sm text-muted-foreground">
            <span data-testid="text-hebrew-name">{user?.hebrewName || "יהושע"}</span> • Day <span data-testid="text-current-day">{currentDay}</span> of 6
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative h-96 bg-cosmic-void/30 rounded-lg overflow-hidden mb-4">
          <FractalMatrix
            data={fractalData}
            width={800}
            height={384}
            enableAudio={true}
            mysteryMode={false}
            initialFocus="Hub"
            sacredOverlays={["Hub"]}
            onSelect={handleNodeSelect}
            onExport={handleExport}
            theme={{
              background: "transparent",
              nodeColors: {
                Hub: "#ffd43b",
                Chapter: "#74c0fc", 
                Stone: "#69db7c",
                Tribe: "#ff6b6b",
                Prophet: "#da77f2",
                Apostle: "#fd7e14",
                Frequency: "#20c997",
                Book: "#6f42c1",
                Dimension: "#e83e8c"
              }
            }}
          />
          
          {isPlaying && (
            <div className="absolute bottom-4 left-4 text-sm text-cosmic-golden">
              <Headphones className="inline w-4 h-4 mr-2" />
              260 Hz Resonance Active
            </div>
          )}
          
          {selectedNodeId && (
            <div className="absolute top-4 left-4 bg-cosmic-void/80 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-cosmic-golden">
              Selected: {fractalData.nodes.find(n => n.id === selectedNodeId)?.label}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleMeditation}
              disabled={isPlaying}
              className="px-4 py-2"
              data-testid="button-meditate"
            >
              <Play className="w-4 h-4 mr-2" />
              {isPlaying ? "Meditating..." : "Meditate"}
            </Button>
            <Button 
              variant="secondary"
              onClick={handleRegenerate}
              className="px-4 py-2"
              data-testid="button-regenerate"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Biblical Archetype: <span className="text-cosmic-golden" data-testid="text-biblical-archetype">
                {user?.archetype || "The Pioneer"}
              </span>
            </div>
            {selectedNodeId && (
              <Badge variant="outline" className="text-cosmic-golden border-cosmic-golden/50">
                Node Selected
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}