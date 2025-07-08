"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bluetooth, BluetoothConnected, LoaderCircle } from 'lucide-react';
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
          {device ? (
             <Button onClick={disconnectGlove} size="lg" className="w-full rounded-full text-lg py-7 shadow-lg bg-destructive/80 hover:bg-destructive">
               <BluetoothConnected className="mr-3 h-6 w-6"/>
               Disconnect Glove
             </Button>
          ) : (
            <Button onClick={connectGlove} disabled={isConnecting} size="lg" className="w-full rounded-full text-lg py-7 shadow-lg bg-primary hover:bg-primary/90">
              {isConnecting ? (
                <LoaderCircle className="mr-3 h-6 w-6 animate-spin"/>
              ) : (
                <Bluetooth className="mr-3 h-6 w-6"/>
              )}
              {isConnecting ? "Connecting..." : "🔗 Connect Glove"}
            </Button>
          )}

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
