import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { startFrequencyMeditation, stopFrequencyMeditation, getMatrixFrequency, isMeditationActive } from "@/lib/frequency-meditation";
import { renderBiblicalGeometry } from "@/lib/sacred-geometry";
import * as d3 from 'd3';

export default function BiblicalMatrixExplorer() {
  const [selectedBook, setSelectedBook] = useState(1);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: matrix } = useQuery({
    queryKey: ['/api/biblical-matrix'],
  });

  const { data: currentBookData } = useQuery<any[]>({
    queryKey: ['/api/biblical-matrix/book', selectedBook],
    enabled: !!selectedBook,
  });

  const { data: currentChapterData } = useQuery<any>({
    queryKey: ['/api/biblical-matrix/chapter', selectedChapter],
    enabled: !!selectedChapter,
  });

  useEffect(() => {
    setIsPlaying(isMeditationActive());
    
    const handleMeditationStart = () => setIsPlaying(true);
    const handleMeditationStop = () => setIsPlaying(false);
    
    window.addEventListener('meditationStarted', handleMeditationStart);
    window.addEventListener('meditationStopped', handleMeditationStop);
    
    return () => {
      window.removeEventListener('meditationStarted', handleMeditationStart);
      window.removeEventListener('meditationStopped', handleMeditationStop);
    };
  }, []);

  const handlePlayFrequency = async (spiritualFrequency: string) => {
    const frequency = getMatrixFrequency(spiritualFrequency);
    
    if (isPlaying) {
      await stopFrequencyMeditation();
    } else {
      await startFrequencyMeditation(frequency, 120); // 2 minutes
    }
  };

  const books = [
    { number: 1, name: "Yod - Becoming Rooted", color: "Red", element: "Fire" },
    { number: 2, name: "Heh - Becoming Aligned", color: "Blue", element: "Air" },
    { number: 3, name: "Vav - Becoming Clear", color: "Teal", element: "Water" },
    { number: 4, name: "Final Heh - Becoming Embodied", color: "Green", element: "Earth" },
    { number: 5, name: "YESHUA - The Pattern Manifesto", color: "Gold/White", element: "Plasma" },
  ];

  const getBookColor = (bookNumber: number) => {
    switch (bookNumber) {
      case 1: return 'bg-red-500/20 border-red-500/40 text-red-300';
      case 2: return 'bg-blue-500/20 border-blue-500/40 text-blue-300';
      case 3: return 'bg-teal-500/20 border-teal-500/40 text-teal-300';
      case 4: return 'bg-green-500/20 border-green-500/40 text-green-300';
      case 5: return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300';
      default: return 'bg-gray-500/20 border-gray-500/40 text-gray-300';
    }
  };

  const getElementBadgeColor = (element: string) => {
    switch (element.toLowerCase()) {
      case 'fire': return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'air': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'water': return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'earth': return 'bg-green-500/20 text-green-300 border-green-500/40';
      case 'plasma': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    }
  };

  // Geometry rendering component
  const GeometryRenderer = ({ geometryIcon, element }: { geometryIcon: string; element: string }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    
    useEffect(() => {
      if (!svgRef.current) return;
      
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      renderBiblicalGeometry(svg as any, geometryIcon, element, 200, 200);
    }, [geometryIcon, element]);

    return (
      <div className="flex justify-center">
        <svg
          ref={svgRef}
          width={200}
          height={200}
          className="border border-border rounded-lg bg-card"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border" data-testid="card-sacred-matrix">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-cosmic-golden">
            Biblical Leadership Framework
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Explore the 5-book Hebrew letter framework based on YHWH + Yeshua with divine patterns, biblical frequencies, and Spirit-led leadership insights
          </p>
        </CardHeader>

        <CardContent>
          <Tabs value={selectedBook.toString()} onValueChange={(value) => setSelectedBook(parseInt(value))}>
            <TabsList className="grid w-full grid-cols-5">
              {books.map((book) => (
                <TabsTrigger 
                  key={book.number} 
                  value={book.number.toString()}
                  className="text-xs"
                >
                  Book {book.number}
                </TabsTrigger>
              ))}
            </TabsList>

            {books.map((book) => (
              <TabsContent key={book.number} value={book.number.toString()}>
                <div className={`rounded-lg border-2 p-4 ${getBookColor(book.number)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{book.name}</h3>
                      <Badge className={`${getElementBadgeColor(book.element)} border`}>
                        {book.element}
                      </Badge>
                    </div>
                  </div>

                  {currentBookData && (
                    <div className="grid gap-4">
                      {currentBookData?.map((chapter: any) => (
                        <Card 
                          key={chapter.id} 
                          className="bg-card/50 border-border cursor-pointer hover:bg-card/70 transition-colors"
                          onClick={() => setSelectedChapter(chapter.chapterNumber)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    Chapter {chapter.chapterNumber}
                                  </Badge>
                                  <Badge className={getElementBadgeColor(chapter.element)}>
                                    {chapter.element}
                                  </Badge>
                                  <Badge variant="outline">
                                    {chapter.templeSpace}
                                  </Badge>
                                </div>
                                
                                <h4 className="font-medium mb-1">{chapter.chapterTitle}</h4>
                                
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                                  <div>
                                    <span className="font-medium">Stone:</span> {chapter.stone}
                                  </div>
                                  <div>
                                    <span className="font-medium">Geometry:</span> {chapter.geometryIcon}
                                  </div>
                                  <div>
                                    <span className="font-medium">Stage:</span> {chapter.storyStage}
                                  </div>
                                  <div>
                                    <span className="font-medium">Dimension:</span> {chapter.dimension}
                                  </div>
                                  {chapter.tribe && (
                                    <div>
                                      <span className="font-medium">Tribe:</span> {chapter.tribe}
                                    </div>
                                  )}
                                  {chapter.prophet && (
                                    <div>
                                      <span className="font-medium">Prophet:</span> {chapter.prophet}
                                    </div>
                                  )}
                                  {chapter.apostle && (
                                    <div>
                                      <span className="font-medium">Apostle:</span> {chapter.apostle}
                                    </div>
                                  )}
                                  {chapter.directionalMapping && (
                                    <div className="col-span-2">
                                      <span className="font-medium">Direction:</span> 
                                      <Badge className="ml-1 text-xs bg-cosmic-golden/20 text-cosmic-golden border-cosmic-golden/40">
                                        {chapter.directionalMapping}
                                      </Badge>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePlayFrequency(chapter.spiritualFrequency);
                                    }}
                                    className="flex items-center gap-1"
                                  >
                                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                    <span className="text-xs">{chapter.spiritualFrequency}</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {currentChapterData && (
            <Card className="mt-6 bg-cosmic-purple/5 border-cosmic-purple/20">
              <CardHeader>
                <CardTitle className="text-lg text-cosmic-golden">
                  Chapter {currentChapterData?.chapterNumber} - Biblical Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <GeometryRenderer 
                      geometryIcon={currentChapterData?.geometryIcon}
                      element={currentChapterData?.element}
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-cosmic-golden mb-2">
                        {currentChapterData?.chapterTitle}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        {currentChapterData?.bookTheme}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Divine Name:</span>
                        <Badge className="bg-cosmic-golden/20 text-cosmic-golden border-cosmic-golden/40">
                          {currentChapterData?.divineName}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Fractal Gate:</span>
                        <span className="text-sm">{currentChapterData?.fractalGate}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Frequency:</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePlayFrequency(currentChapterData?.spiritualFrequency)}
                          className="h-auto p-1 text-cosmic-golden hover:text-cosmic-golden"
                        >
                          {currentChapterData?.spiritualFrequency} 
                          ({getMatrixFrequency(currentChapterData?.spiritualFrequency)} Hz)
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}