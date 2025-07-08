"use client";

import { ChevronLeft, Settings, X, RotateCw, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export default function Home() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dark">
      <main className="bg-background text-foreground min-h-screen flex flex-col items-center justify-between p-6 font-sans">
        <header className="flex justify-between items-center w-full max-w-sm z-10">
          <Button variant="ghost" size="icon" className="text-neutral-400 hover:bg-muted">
            <ChevronLeft className="h-7 w-7" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-sm text-neutral-300">Listening...</span>
          </div>
          <Button variant="ghost" size="icon" className="text-neutral-400 hover:bg-muted">
            <Settings className="h-6 w-6" />
          </Button>
        </header>

        <section className="flex flex-col items-center justify-center flex-grow text-center -mt-10">
          <div className="relative w-72 h-72 flex items-center justify-center mb-12">
            <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute inset-10 bg-yellow-500/20 rounded-full blur-3xl animate-pulse [animation-delay:0.5s]"></div>
            
            <div className="relative z-10">
              <div className="flex gap-6 mb-3">
                <div className="w-3.5 h-5 bg-background rounded-full"></div>
                <div className="w-3.5 h-5 bg-background rounded-full"></div>
              </div>
              <div className="w-12 h-6 border-b-4 border-background rounded-b-full mx-auto"></div>
            </div>
          </div>
          
          <div>
            <p className="text-4xl text-neutral-400">Turn on</p>
            <h1 className="text-5xl font-bold text-white tracking-tight">
              Air conditioner<span className="w-8 inline-block text-left">{dots}</span>
            </h1>
          </div>
        </section>

        <footer className="flex justify-around items-center w-full max-w-sm z-10">
          <Button variant="ghost" size="icon" className="w-16 h-16 rounded-full bg-muted/80 text-neutral-400 hover:bg-muted">
            <X className="h-7 w-7" />
          </Button>
          <Button variant="ghost" size="icon" className="w-20 h-20 rounded-full bg-muted/80 text-white hover:bg-muted shadow-lg">
            <Waves className="h-10 w-10" />
          </Button>
          <Button variant="ghost" size="icon" className="w-16 h-16 rounded-full bg-muted/80 text-neutral-400 hover:bg-muted">
            <RotateCw className="h-7 w-7" />
          </Button>
        </footer>
      </main>
    </div>
  );
}
