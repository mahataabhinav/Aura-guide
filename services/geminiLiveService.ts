import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { LIVE_MODEL } from '../constants';
import { pcmToBase64, base64ToUint8Array, decodeAudioData } from '../utils/audioUtils';
import { TranscriptUpdate } from '../types';

interface LiveServiceCallbacks {
  onOpen: () => void;
  onClose: () => void;
  onError: (error: Error) => void;
  onAudioData: (audioBuffer: AudioBuffer) => void;
  onTranscript: (update: TranscriptUpdate) => void;
}

export class GeminiLiveService {
  private client: GoogleGenAI | null = null;
  private sessionPromise: Promise<any> | null = null;
  private currentGoal: string = "Navigate safely";

  constructor(private apiKey: string) {
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  public setGoal(goal: string) {
    this.currentGoal = goal;
  }

  public async connect(
    systemInstruction: string,
    callbacks: LiveServiceCallbacks,
    audioContext: AudioContext
  ): Promise<void> {
    if (!this.client) return;

    this.sessionPromise = this.client.live.connect({
      model: LIVE_MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: systemInstruction,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        // Enable transcription to show captions and trigger haptics based on text
        // Passing an empty object enables it. Do not pass 'model' here.
        outputAudioTranscription: {}, 
      },
      callbacks: {
        onopen: () => {
          console.log("Gemini Live Connected");
          callbacks.onOpen();
        },
        onclose: () => {
          console.log("Gemini Live Closed");
          callbacks.onClose();
        },
        onerror: (err) => {
          console.error("Gemini Live Error", err);
          callbacks.onError(new Error("Connection error"));
        },
        onmessage: async (message: LiveServerMessage) => {
          // 1. Handle Audio Output
          const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData) {
            try {
              const uint8Array = base64ToUint8Array(audioData);
              const audioBuffer = await decodeAudioData(uint8Array, audioContext, 24000);
              callbacks.onAudioData(audioBuffer);
            } catch (e) {
              console.error("Error decoding audio", e);
            }
          }

          // 2. Handle Text Transcription (Captions)
          const transcription = message.serverContent?.outputTranscription;
          if (transcription && transcription.text) {
             callbacks.onTranscript({
                 source: 'ai',
                 text: transcription.text,
                 isFinal: true 
             });
          }
        },
      },
    });
    
    await this.sessionPromise;
  }

  public async sendAudioChunk(data: Float32Array) {
    if (!this.sessionPromise) return;
    
    const base64PCM = pcmToBase64(data);
    
    this.sessionPromise.then(session => {
        session.sendRealtimeInput({
            media: {
                mimeType: 'audio/pcm;rate=16000',
                data: base64PCM
            }
        });
    });
  }

  public async sendVideoFrame(base64Image: string) {
    if (!this.sessionPromise) return;

    this.sessionPromise.then(session => {
        session.sendRealtimeInput({
            media: {
                mimeType: 'image/jpeg',
                data: base64Image
            }
        });
    });
  }

  public async disconnect() {
    this.sessionPromise = null;
  }
}