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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Get all biblical matrix data for 27-chapter display
  const { data: allChapters } = useQuery({
    queryKey: ['/api/biblical-matrix'],
    enabled: true,
  });

  // Generate 27-chapter matrix data
  const fractalData: FMData = useMemo(() => {
    const chapterTitles = {
      1: "Leadership Begins at the Altar", 2: "The Tripartite Leader", 3: "Why We Had to Leave Eden",
      4: "Formation in Exile", 5: "The Seed Hidden in the Dust", 6: "Jesus as the Tree of Life",
      7: "The Divine Pattern", 8: "The Pattern Keeper", 9: "The Fractal Pattern of Leadership",
      10: "The Invisible Root System", 11: "Vision of God", 12: "Vision of Self", 13: "Vision of Mission",
      14: "The Wounded Visionary", 15: "Sacred Sight", 16: "Emotional Intelligence and Passion",
      17: "Intelligent Action", 18: "Embodied Leadership", 19: "Mentors and Mirrors", 20: "The Body of Christ",
      21: "Yeshua: The Embodiment of YHWH", 22: "The Spiral and the Sword", 23: "The Name and the Nations",
      24: "Pentecost, Fire, and the Echo of Eden", 25: "The Commissioning Pattern", 26: "The Apostolic Flame",
      27: "The Pattern Complete"
    };

    const yhwhBooks = [
      { name: "Yod", chapters: [1,2,3,4,5], element: "Fire" as const },
      { name: "Heh", chapters: [6,7,8,9,10], element: "Air" as const },
      { name: "Vav", chapters: [11,12,13,14,15], element: "Water" as const },
      { name: "Final Heh", chapters: [16,17,18,19,20], element: "Earth" as const },
      { name: "YESHUA", chapters: [21,22,23,24,25,26,27], element: "Spirit" as const }
    ];

    // Create all 27 chapter nodes
    const nodes: FMNode[] = [
      // Central hub
      { id: "hub-center", kind: "Hub", label: "YHWH → YESHUA", element: "Spirit" },
      
      // All 27 chapters
      ...Array.from({length: 27}, (_, i) => {
        const chapterNum = i + 1;
        const book = yhwhBooks.find(b => b.chapters.includes(chapterNum));
        return {
          id: `chapter-${chapterNum}`,
          kind: "Chapter" as const,
          label: `Ch ${chapterNum}: ${chapterTitles[chapterNum as keyof typeof chapterTitles]}`,
          element: book?.element || "Fire",
          chapter: chapterNum
        };
      }),

      // YHWH letter nodes
      ...yhwhBooks.map((book) => ({
        id: `book-${book.name}`,
        kind: "Book" as const,
        label: book.name,
        element: book.element
      })),

      // Special gates
      { id: "gate-identity", kind: "Stone", label: "Identity Gate (Ch 1)", element: "Fire" },
      { id: "gate-shofar", kind: "Stone", label: "Shofar Gate (Ch 25)", element: "Spirit" },
      { id: "gate-network", kind: "Stone", label: "Network Gate (Ch 26)", element: "Spirit" },
      { id: "gate-convergence", kind: "Stone", label: "Convergence Gate (Ch 27)", element: "Spirit" }
    ];

    // Create edges connecting the hub to books, books to chapters, and special gates
    const edges = [
      // Hub to books
      ...yhwhBooks.map(book => ({ 
        source: "hub-center", 
        target: `book-${book.name}` 
      })),
      
      // Books to their chapters
      ...yhwhBooks.flatMap(book => 
        book.chapters.map(chapterNum => ({
          source: `book-${book.name}`,
          target: `chapter-${chapterNum}`
        }))
      ),

      // Sequential chapter connections (Golden Path)
      ...Array.from({length: 26}, (_, i) => ({
        source: `chapter-${i + 1}`,
        target: `chapter-${i + 2}`,
        relation: "Sequential" as const
      })),

      // Special gate connections
      { source: "chapter-1", target: "gate-identity", relation: "Default" as const },
      { source: "chapter-25", target: "gate-shofar", relation: "Default" as const },
      { source: "chapter-26", target: "gate-network", relation: "Default" as const },
      { source: "chapter-27", target: "gate-convergence", relation: "Default" as const }
    ];

    return { nodes, edges };
  }, [allChapters, user]);

  const startFrequency = () => {
    setIsPlaying(true);
    const frequency = getMatrixFrequency(1); // Default to chapter 1
    startFrequencyMeditation(frequency, 30000); // 30 seconds
    
    setTimeout(() => {
      setIsPlaying(false);
    }, 30000);
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleExport = (data: { png: string; svg: string; json: string; url: string; }) => {
    console.log('Exporting fractal data:', data);
  };

  return (
    <Card className="w-full bg-cosmic-void/20 border-cosmic-golden/30" data-testid="card-fractal-visualization">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-cosmic-golden">
            27-Chapter Biblical Matrix
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-cosmic-golden/50 text-cosmic-golden text-xs">
              YHWH → YESHUA Pattern
            </Badge>
            <Button 
              onClick={startFrequency}
              disabled={isPlaying}
              size="sm"
              variant="outline"
              className="border-cosmic-golden/30 hover:border-cosmic-golden"
              data-testid="button-frequency-meditation"
            >
              {isPlaying ? (
                <>
                  <Headphones className="w-4 h-4 mr-2" />
                  Playing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Sacred Frequency
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative w-full h-[80vh] bg-cosmic-void/30 rounded-lg overflow-hidden mb-4">
          <FractalMatrix
            data={fractalData}
            width={1400}
            height={800}
            enableAudio={true}
            mysteryMode={false}
            initialFocus="Hub"
            sacredOverlays={["Hub", "Chapter"]}
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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="bg-red-900/20 p-2 rounded border border-red-500/30">
            <div className="font-semibold text-red-400">Yod (י) - Chapters 1-5</div>
            <div className="text-muted-foreground">Identity & Formation</div>
          </div>
          <div className="bg-blue-900/20 p-2 rounded border border-blue-500/30">
            <div className="font-semibold text-blue-400">Heh (ה) - Chapters 6-10</div>
            <div className="text-muted-foreground">Patterns & Alignment</div>
          </div>
          <div className="bg-teal-900/20 p-2 rounded border border-teal-500/30">
            <div className="font-semibold text-teal-400">Vav (ו) - Chapters 11-15</div>
            <div className="text-muted-foreground">Vision & Clarity</div>
          </div>
          <div className="bg-green-900/20 p-2 rounded border border-green-500/30">
            <div className="font-semibold text-green-400">Final Heh (ה) - Chapters 16-20</div>
            <div className="text-muted-foreground">Embodied Wisdom</div>
          </div>
          <div className="bg-yellow-900/20 p-2 rounded border border-yellow-500/30">
            <div className="font-semibold text-yellow-400">YESHUA (ש) - Chapters 21-27</div>
            <div className="text-muted-foreground">Christ Pattern</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}