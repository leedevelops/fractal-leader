import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Info, Book, Shield } from "lucide-react";

export default function TheologicalPreface() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Info size={16} />
          Theological Foundation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Book className="text-cosmic-golden" />
            Theological Clarification: Biblical Leadership Framework
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-sm">
          {/* Introduction */}
          <Card className="bg-cosmic-purple/5 border-cosmic-purple/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="text-cosmic-golden" size={20} />
                A Word to the Reader
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This platform begins where all leadership must begin: in the soil of identity. It explores how God's 
                covenant Name (YHWH) forms the inner architecture of who we are—spirit, soul, and body. It follows the 
                fractal structure of God's own pattern for calling, formation, and transformation.
              </p>
              <p>
                This work is deeply theological, emotionally honest, and symbolically rich. As such, it may occasionally 
                use terms such as <em>sacred geometry</em>, <em>pattern</em>, or <em>fractal</em>—words that have been 
                co-opted by other traditions. <strong>This is not that.</strong>
              </p>
            </CardContent>
          </Card>

          {/* What This Is Not */}
          <Card className="bg-red-500/5 border-red-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-red-600 dark:text-red-400">
                What This Platform Is NOT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc list-inside">
                <li>New Age mysticism or universalist theology</li>
                <li>Gnostic teaching that hides knowledge behind inner circles</li>
                <li>Energy or manifestation doctrine centered on self-divinization</li>
                <li>A syncretic blend of world religions or metaphysics</li>
              </ul>
            </CardContent>
          </Card>

          {/* What This Is */}
          <Card className="bg-green-500/5 border-green-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-green-600 dark:text-green-400">
                What This Platform IS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc list-inside">
                <li>A Christ-centered model of leadership rooted in biblical identity</li>
                <li>A deep dive into how God's Name (יהוה) reveals His character—and ours</li>
                <li>A covenantal, Spirit-led framework for discipleship, emotional growth, and glory formation</li>
                <li>A restoration of the priestly and prophetic pattern of leadership through Jesus the Messiah (Yeshua)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Why Use Symbols */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why Use Symbols, Shapes, and Fractals?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc list-inside">
                <li>The tabernacle was built according to divine pattern (Exodus 25:9)</li>
                <li>The Name of God is constructed in sequence (Yod–Heh–Vav–Heh), mirroring identity formation</li>
                <li>Creation itself is patterned (Genesis 1), layered with symbolic language and structure</li>
                <li>Jesus is the full embodiment of divine order—"the radiance of God's glory and the exact imprint of His nature" (Hebrews 1:3)</li>
              </ul>
              <Separator className="my-4" />
              <p className="font-medium">
                This platform reclaims symbolic language as a discipleship tool, not a mystical system. You will encounter 
                squares, spirals, and story patterns—not for esoteric power, but to mirror the divine intentionality embedded in the soul.
              </p>
            </CardContent>
          </Card>

          {/* Scripture Roots */}
          <Card className="bg-cosmic-golden/5 border-cosmic-golden/20">
            <CardHeader>
              <CardTitle className="text-lg text-cosmic-golden">
                Scripture Roots for Key Concepts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Identity:</strong> Genesis 1:26, Exodus 3:14, John 17:6</p>
                  <p><strong>Calling:</strong> Jeremiah 1:5, Romans 8:30, Ephesians 2:10</p>
                  <p><strong>Glory:</strong> 2 Corinthians 3:18, John 17:22, Habakkuk 2:14</p>
                </div>
                <div>
                  <p><strong>Fractal Design:</strong> Romans 1:20, Hebrews 8:5, Psalm 19:1</p>
                  <p><strong>Sacred Geometry:</strong> Job 38:4–7, Proverbs 8:27–30</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final Clarification */}
          <Card className="bg-cosmic-purple/5 border-cosmic-purple/20">
            <CardHeader>
              <CardTitle className="text-lg">Final Clarification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p>This is <strong>not</strong> about becoming divine.<br />
                  It <strong>is</strong> about becoming rooted in the One who is.</p>
                  
                  <p className="mt-3">It is <strong>not</strong> about unlocking hidden knowledge.<br />
                  It <strong>is</strong> about responding to the revealed Name.</p>
                </div>
                <div>
                  <p>It is <strong>not</strong> about ascending into power.<br />
                  It <strong>is</strong> about descending into glory—formed through fire, struggle, and surrender.</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-center space-y-2 italic text-cosmic-golden">
                <p>"You will be a crown of beauty in the hand of the LORD, a royal diadem in the hand of your God." 
                   <span className="text-xs ml-2">– Isaiah 62:3</span></p>
                <p>"That Christ may dwell in your hearts through faith… that you may be rooted and grounded in love." 
                   <span className="text-xs ml-2">– Ephesians 3:17</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}