"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bot, Bluetooth, Loader, Volume2, XCircle } from "lucide-react";

// Using Nordic UART Service UUIDs which are common for BLE serial communication
const BLE_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const BLE_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

export default function Home() {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messageLog, setMessageLog] = useState<string>("");
  const [currentSubtitle, setCurrentSubtitle] = useState<string>
    ("Connect to start translating.");
  const [error, setError] = useState<string | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  const handleNotifications = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (value) {
      const decoder = new TextDecoder("utf-8");
      const text = decoder.decode(value);

      setMessageLog((prevLog) => prevLog + text + "\n");
      setCurrentSubtitle(text);

      // Text-to-Speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    if (characteristicRef.current) {
        characteristicRef.current.removeEventListener(
          "characteristicvaluechanged",
          handleNotifications
        );
    }
    setDevice(null);
    characteristicRef.current = null;
    setMessageLog("");
    setCurrentSubtitle("Connect to start translating.");
    console.log("Device disconnected.");
  }, [device, handleNotifications]);

  const connectToDevice = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      if (!navigator.bluetooth) {
        throw new Error("Web Bluetooth API is not available on this browser.");
      }
      
      const requestedDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [BLE_SERVICE_UUID] }],
      });

      setDevice(requestedDevice);
      
      requestedDevice.addEventListener('gattserverdisconnected', handleDisconnect);

      const server = await requestedDevice.gatt?.connect();
      if (!server) {
        throw new Error("GATT Server not found.");
      }

      const service = await server.getPrimaryService(BLE_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(BLE_CHARACTERISTIC_UUID);
      characteristicRef.current = characteristic;

      await characteristic.startNotifications();
      characteristic.addEventListener(
        "characteristicvaluechanged",
        handleNotifications
      );
      
      setCurrentSubtitle("Connected. Waiting for signal...");

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Connection failed: ${errorMessage}`);
      handleDisconnect();
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    // This is a defensive cleanup. 
    // The primary cleanup is now in handleDisconnect.
    return () => {
       if (device) {
           handleDisconnect();
       }
    };
  }, [device, handleDisconnect]);

  return (
    <div className="dark">
      <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-body">
        <Card className="w-full max-w-2xl rounded-xl shadow-2xl bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-4xl font-headline font-bold text-primary">
              Nereus Glove Translator
            </CardTitle>
            <CardDescription className="text-accent-foreground/70">
              Connect your glove and see the translation in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Textarea
                  id="message-log"
                  readOnly
                  value={messageLog}
                  placeholder="Received messages will appear here..."
                  className="h-48 resize-none rounded-lg text-base shadow-inner bg-background/50 focus-visible:ring-primary"
                  aria-label="Message Log"
                />
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={device ? handleDisconnect : connectToDevice}
                  disabled={isConnecting}
                  className="w-full max-w-xs rounded-full text-lg py-6 px-8 shadow-lg transition-all duration-300 hover:shadow-primary/40 focus-visible:ring-offset-background focus-visible:ring-offset-2"
                  size="lg"
                  variant={device ? "destructive" : "default"}
                >
                  {isConnecting ? (
                    <Loader className="mr-2 h-5 w-5 animate-spin" />
                  ) : device ? (
                    <XCircle className="mr-2 h-5 w-5" />
                  ) : (
                    <Bluetooth className="mr-2 h-5 w-5" />
                  )}
                  {isConnecting
                    ? "Connecting..."
                    : device
                    ? "Disconnect Glove"
                    : "🔗 Connect Glove"}
                </Button>
              </div>

              {error && (
                <p className="text-center text-destructive/90">{error}</p>
              )}

              <div className="mt-6 text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Real-time Subtitle
                </p>
                <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-background/50 shadow-inner min-h-[4rem]">
                  <Volume2 className="h-6 w-6 text-accent flex-shrink-0" />
                  <p className="text-xl font-medium text-accent-foreground tracking-wide">
                    {currentSubtitle}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
