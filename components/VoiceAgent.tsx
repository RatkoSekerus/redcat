import React, { useState, useRef, useEffect } from "react";
import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Type,
  FunctionDeclaration,
  Blob,
} from "@google/genai";
import { Mic, MicOff, Radio, StopCircle } from "lucide-react";
import { SYSTEM_INSTRUCTION } from "../constants";
import { sendTelegramOrder } from "../services/telegramService";
import AudioVisualizer from "./AudioVisualizer";

// --- Audio Helper Functions (from Guidelines) ---

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: "audio/pcm;rate=16000",
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// --- Component ---

const VoiceAgent: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState<string>("Spreman za razgovor");
  const [error, setError] = useState<string | null>(null);

  // Refs for audio context and session
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then((session) => session.close());
      sessionPromiseRef.current = null;
    }

    // Stop all playing sources
    sourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
    });
    sourcesRef.current.clear();

    setConnected(false);
    setIsSpeaking(false);
    setStatus("Spreman za razgovor");
  };

  const connect = async () => {
    setError(null);
    setStatus("Povezivanje...");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Tool Definition
      const placeOrderTool: FunctionDeclaration = {
        name: "placeOrder",
        parameters: {
          type: Type.OBJECT,
          description:
            "Places an order for a specific product and sends it to the shop telegram. All fields are required.",
          properties: {
            productName: {
              type: Type.STRING,
              description: "The exact name of the product from the catalog.",
            },
            quantity: {
              type: Type.NUMBER,
              description: "The quantity to order. Must be at least 1.",
            },
            customerName: {
              type: Type.STRING,
              description: "Full name of the customer (first and last name).",
            },
            address: {
              type: Type.STRING,
              description: "Delivery address for the order.",
            },
            phone: {
              type: Type.STRING,
              description: "Customer phone number.",
            },
          },
          required: [
            "productName",
            "quantity",
            "customerName",
            "address",
            "phone",
          ],
        },
      };

      // Audio Setup
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      const inputAudioContext = new AudioContext({ sampleRate: 16000 });
      const outputAudioContext = new AudioContext({ sampleRate: 24000 });
      inputAudioContextRef.current = inputAudioContext;
      outputAudioContextRef.current = outputAudioContext;

      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Session Setup
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => {
            setConnected(true);
            setStatus("Povezano! Agent će prvi progovoriti...");

            const source = inputAudioContext.createMediaStreamSource(stream);
            sourceNodeRef.current = source;

            // Note: using ScriptProcessor for simplicity in this generated code structure
            const scriptProcessor = inputAudioContext.createScriptProcessor(
              4096,
              1,
              1
            );
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData =
                audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);

            // Trigger agent to speak first by sending a text prompt
            sessionPromise.then((session) => {
              // Send a text input to trigger the agent to speak first
              setTimeout(() => {
                try {
                  session.sendRealtimeInput({
                    text: "Dobar dan, Red Cat agent na vezi, izvolite",
                  });
                } catch (e) {
                  console.log(
                    "Could not send initial text, agent should still speak based on system instruction"
                  );
                }
              }, 500);
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            // 1. Handle Tool Calls (The core feature)
            if (message.toolCall) {
              setStatus("Obrađujem porudžbinu...");
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === "placeOrder") {
                  const {
                    productName,
                    quantity,
                    customerName,
                    address,
                    phone,
                  } = fc.args as any;

                  console.log(
                    `Placing order: ${quantity}x ${productName} for ${customerName}, ${address}, ${phone}`
                  );
                  const success = await sendTelegramOrder(
                    productName,
                    quantity,
                    customerName,
                    address,
                    phone
                  );

                  const result = success
                    ? `Porudžbina je uspešno kreirana. Tim će kontaktirati kupca u najkraćem roku.`
                    : `Greška pri slanju porudžbine. Molimo pokušajte ponovo ili kontaktirajte nas direktno.`;

                  sessionPromise.then((session) => {
                    session.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result },
                      },
                    });
                  });
                  setStatus(
                    success ? "Porudžbina poslata!" : "Greška pri poručivanju"
                  );
                }
              }
            }

            // 2. Handle Audio Output
            const base64Audio =
              message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);

              // Ensure time sync
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outputAudioContext.currentTime
              );

              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputAudioContext,
                24000,
                1
              );

              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);

              source.addEventListener("ended", () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setIsSpeaking(false);
                }
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // 3. Handle Interruptions
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach((s) => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onclose: () => {
            setConnected(false);
            setStatus("Veza prekinuta.");
          },
          onerror: (e) => {
            console.error(e);
            setError("Došlo je do greške u komunikaciji.");
            cleanup();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede",
              },
            },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [placeOrderTool] }],
        },
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error(err);
      setError("Nije moguće pristupiti mikrofonu ili API-ju.");
    }
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
      <div className="bg-red-600 p-6 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Red Cat Voice Agent</h2>
        <p className="text-red-100 text-sm">
          Razgovarajte sa nama i naručite glasom.
        </p>
      </div>

      <div className="p-8 flex flex-col items-center justify-center space-y-6">
        <div
          className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
            connected ? "bg-red-50" : "bg-gray-50"
          }`}
        >
          {connected ? (
            <AudioVisualizer isActive={isSpeaking} />
          ) : (
            <Radio className="w-12 h-12 text-gray-300" />
          )}

          {connected && (
            <div className="absolute inset-0 rounded-full border-4 border-red-500 opacity-20 animate-ping"></div>
          )}
        </div>

        <div className="text-center min-h-[3rem]">
          <p
            className={`font-medium ${
              error ? "text-red-500" : "text-gray-700"
            }`}
          >
            {error || status}
          </p>
        </div>

        <button
          onClick={connected ? cleanup : connect}
          className={`flex items-center space-x-2 px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 ${
            connected
              ? "bg-red-100 text-red-600 hover:bg-red-200"
              : "bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-500/30"
          }`}
        >
          {connected ? (
            <>
              <StopCircle className="w-5 h-5" />
              <span>Prekini vezu</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span>Započni razgovor</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-gray-50 p-4 text-xs text-gray-500 text-center border-t border-gray-100">
        Pokreće Gemini 2.5 Live API
      </div>
    </div>
  );
};

export default VoiceAgent;
