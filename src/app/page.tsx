"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Power, LoaderCircle, Settings } from 'lucide-react';
import { textToSpeech } from '@/ai/flows/tts-flow';

// IMPORTANT: Replace with your actual glove's service and characteristic UUIDs
const GLOVE_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const GLOVE_CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";

export default function Home() {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState("Waiting for glove...");
  const [subtitle, setSubtitle] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const textBuffer = useRef("");
  const audioRef = useRef<HTMLAudioElement>(null);
  
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

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio playback failed", e));
    }
  }, [audioUrl]);

  const handleAudioPlay = () => {
    setSubtitle(message);
  }

  const handleAudioEnd = () => {
    setSubtitle("");
  }
  
  if (device) {
    return (
      <main className="bg-background text-foreground flex flex-col min-h-screen items-center justify-between p-8 font-sans text-center">
        
        <header className="w-full max-w-lg">
          <h1 className="text-4xl font-bold text-primary-foreground tracking-tight shadow-sm">
            Nereus Glove Translator
          </h1>
        </header>
        
        <section className="flex flex-col items-center justify-center flex-grow w-full max-w-lg">
          <div className="w-full h-52 bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center p-6 my-6 transition-all duration-300 ease-in-out">
            <p className="text-5xl font-semibold text-primary break-words">
              {message}
            </p>
          </div>
          <div className="h-12 text-2xl text-accent font-medium">
            {subtitle}
          </div>
        </section>

        <footer className="w-full max-w-lg flex flex-col items-center">
             <Button onClick={disconnectGlove} size="lg" className="w-full rounded-full text-lg py-7 shadow-lg bg-destructive/80 hover:bg-destructive">
               <Power className="mr-3 h-6 w-6"/>
               Disconnect Glove
             </Button>
          <p className="mt-6 text-base text-muted-foreground font-light">
            Powered by AceOfMaze
          </p>
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
      <main className="bg-[#08090C] text-white flex flex-col min-h-screen items-center justify-between p-8 font-sans">
        <header className="w-full flex justify-end items-center text-sm opacity-50">
            {/* Status bar elements can go here */}
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
          <p className="mt-12 text-center text-neutral-400 text-lg">
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
          <Button variant="link" className="text-neutral-400 hover:text-white mt-2 text-base font-normal">
            START WITHOUT NEREUS
          </Button>
          <div className="flex justify-between w-full items-center mt-2 px-2">
            <div className="w-6"/>
            <p className="text-neutral-500 text-sm">NEREUS 1.0</p>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white h-8 w-8">
              <Settings className="w-5 h-5"/>
            </Button>
          </div>
        </footer>
      </main>
  );
}
