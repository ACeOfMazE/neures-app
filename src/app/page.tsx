"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, LoaderCircle, Settings, Moon, Sun } from 'lucide-react';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { cn } from "@/lib/utils";

const GLOVE_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const GLOVE_CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";

export default function Home() {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState("Waiting for glove...");
  const [subtitle, setSubtitle] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const [theme, setTheme] = useState("dark");

  const textBuffer = useRef("");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    // Persist theme choice
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // On initial load, check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };
  
  const handleNotifications = useCallback(async (event: Event) => {
    const target = event.target as BluetoothRemoteGattCharacteristic;
    const value = target.value;
    if (!value) return;

    const decoder = new TextDecoder('utf-8');
    textBuffer.current += decoder.decode(value);
    
    const lines = textBuffer.current.split('\n');
    if (lines.length > 1) {
      const fullMessage = lines.shift()?.trim();
      if(fullMessage) {
        setMessage(fullMessage);
        try {
          const { media } = await textToSpeech(fullMessage);
          if (media) {
            setAudioUrl(media);
          }
        } catch (error) {
          console.error("TTS Error:", error);
          setSubtitle("Sorry, I can't speak right now.");
        }
      }
      textBuffer.current = lines.join('\n');
    }
  }, []);

  const disconnectListener = useCallback(() => {
    setDevice(null);
    setMessage("Glove disconnected.");
    setSubtitle("");
    setIsSpeaking(false);
  }, []);

  const connectGlove = useCallback(async () => {
    if (!navigator.bluetooth) {
      alert("Web Bluetooth API is not available in this browser.");
      return;
    }
    setIsConnecting(true);
    setMessage("Searching for glove...");
    try {
      const btDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [GLOVE_SERVICE_UUID] }],
        optionalServices: [GLOVE_SERVICE_UUID]
      });
      
      setMessage("Connecting to GATT server...");
      btDevice.addEventListener('gattserverdisconnected', disconnectListener);
      const server = await btDevice.gatt?.connect();
      
      setMessage("Getting service...");
      const service = await server?.getPrimaryService(GLOVE_SERVICE_UUID);
      
      setMessage("Getting characteristic...");
      const characteristic = await service?.getCharacteristic(GLOVE_CHARACTERISTIC_UUID);
      
      await characteristic?.startNotifications();
      characteristic?.addEventListener('characteristicvaluechanged', handleNotifications);
      
      setDevice(btDevice);
      setIsSkipped(false); // No longer in skipped mode
      setMessage("Glove Connected!");
    } catch (error) {
      console.error("Bluetooth Connection Error:", error);
      setMessage("Connection failed. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }, [handleNotifications, disconnectListener]);

  const disconnectGlove = useCallback(async () => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
  }, [device]);

  const handleSkip = () => {
    setIsSkipped(true);
  };
  
  const handleGoBack = () => {
    setIsSkipped(false);
    setDevice(null);
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(e => console.error("Audio playback failed", e));
    }
  }, [audioUrl]);

  const handleAudioPlay = () => {
    setSubtitle(message);
    setIsSpeaking(true);
  }

  const handleAudioEnd = () => {
    setSubtitle("");
    setIsSpeaking(false);
  }
  
  const ThemeToggleButton = () => (
    <Button onClick={toggleTheme} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );

  if (device || isSkipped) {
    const isActuallyConnected = device !== null;
    return (
      <main className="relative bg-background text-foreground flex flex-col min-h-screen items-center justify-between p-4 font-sans text-center overflow-hidden">
        <header className="w-full flex items-center justify-between z-10 p-2">
          <ThemeToggleButton />
          {isActuallyConnected && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background/40 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse"></div>
              <span className="text-sm font-medium">Live</span>
            </div>
          )}
           <div className="w-10"/> {/* Spacer */}
        </header>

        <section className="flex-grow flex items-center justify-center z-10">
          <p className="text-3xl font-medium text-foreground/90 max-w-lg px-4 transition-opacity duration-300">
             {isActuallyConnected ? subtitle : "Not Connected"}
          </p>
        </section>

        <div
          className={cn(
              "absolute bottom-0 left-0 right-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,_hsl(var(--primary)/0.25)_0%,_transparent_70%)] transition-all duration-500 ease-in-out origin-bottom pointer-events-none",
              isSpeaking && isActuallyConnected ? "animate-glow-pulse opacity-100" : "opacity-0 scale-y-50"
          )}
        />

        <footer className="w-full flex items-center justify-center p-6 z-10">
          {isActuallyConnected ? (
            <Button onClick={disconnectGlove} variant="destructive" size="icon" className="w-16 h-16 rounded-full shadow-lg shadow-destructive/30 ring-2 ring-foreground/20">
              <X className="h-7 w-7"/>
            </Button>
          ) : (
             <Button onClick={handleGoBack} variant="outline" className="rounded-full px-6">
                Go Back
            </Button>
          )}
        </footer>

        <audio
          ref={audioRef}
          src={audioUrl ?? undefined}
          onPlay={handleAudioPlay}
          onEnded={handleAudioEnd}
          className="hidden"
        />
      </main>
    );
  }
  
  return (
      <main className="bg-background text-foreground flex flex-col min-h-screen items-center justify-between p-8 font-sans">
        <header className="w-full flex justify-start items-center text-sm">
            <ThemeToggleButton />
        </header>
        
        <section className="flex flex-col items-center justify-center flex-grow">
          <div className="relative flex items-center justify-center w-64 h-64">
            <div className="absolute w-full h-full rounded-full bg-primary/10 animate-pulse"></div>
            <div className="absolute w-2/3 h-2/3 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="relative w-1/2 h-1/2 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
                 <svg className="w-10 h-10 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 7l10 10-5 5V2l5 5L7 17"/>
                 </svg>
            </div>
        </div>
          <p className="mt-12 text-center text-muted-foreground text-lg">
            Turn on the Bluetooth connection<br />of this device.
          </p>
        </section>

        <footer className="w-full max-w-xs flex flex-col items-center gap-2">
          <Button onClick={connectGlove} disabled={isConnecting} size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-full text-lg shadow-lg shadow-primary/20">
            {isConnecting ? (
              <div className="flex items-center justify-center">
                <LoaderCircle className="animate-spin mr-2 h-6 w-6"/>
                <span>CONNECTING...</span>
              </div>
            ) : (
                'CONNECT'
            )}
          </Button>
          <Button onClick={handleSkip} variant="link" className="text-muted-foreground hover:text-foreground mt-2 text-base font-normal">
            START WITHOUT NEREUS
          </Button>
          <div className="flex justify-between w-full items-center mt-2 px-2">
            <div className="w-6"/>
            <p className="text-muted-foreground text-sm">NEREUS 1.0</p>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
              <Settings className="w-5 h-5"/>
            </Button>
          </div>
        </footer>
      </main>
  );
}
