import React, { useEffect, useRef, useState } from 'react';
import { GeminiLiveService } from '../services/geminiLiveService';
import { SYSTEM_INSTRUCTION_TEMPLATE } from '../constants';
import { ConnectionStatus, HistorySnippet, TranscriptUpdate } from '../types';
import { Mic, MicOff, Video, VideoOff, Power, Activity, Disc, SwitchCamera } from 'lucide-react';

interface Props {
  apiKey: string;
  onSaveSnippet: (snippet: HistorySnippet) => void;
}

export const LivePrototypeView: React.FC<Props> = ({ apiKey, onSaveSnippet }) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [userGoal, setUserGoal] = useState<string>("Navigate safely");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveServiceRef = useRef<GeminiLiveService | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const videoIntervalRef = useRef<number | null>(null);
  
  // Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recorderDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // State refs for closures
  const isMicOnRef = useRef(isMicOn);
  const statusRef = useRef(status);

  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    liveServiceRef.current = new GeminiLiveService(apiKey);
    return () => {
      stopSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        toggleSession();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerHaptics = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('stop') || lower.includes('danger') || lower.includes('wait')) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100, 200, 500, 200, 500, 200, 500, 200, 100, 50, 100, 50, 100]);
    } else if (lower.includes('caution') || lower.includes('careful') || lower.includes('warning')) {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } else if (lower.includes('clear') || lower.includes('proceed') || lower.includes('go ahead')) {
        if (navigator.vibrate) navigator.vibrate([50]);
    }
  };

  const toggleSession = () => {
    if (statusRef.current === ConnectionStatus.CONNECTED || statusRef.current === ConnectionStatus.CONNECTING) {
      stopSession();
    } else {
      startSession();
    }
  };

  const switchCamera = async () => {
    if (status === ConnectionStatus.CONNECTED) {
        // If live, we need to restart the stream
        stopSession();
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        setTimeout(() => startSession(), 500);
    } else {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }
  };

  // Helper to find a supported mimeType for MediaRecorder
  const getSupportedMimeType = () => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4' // Critical for iOS/Safari
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return ''; // Let browser choose default if none match
  };

  const startSession = async () => {
    try {
      setStatus(ConnectionStatus.CONNECTING);
      setLastTranscript("");
      recordedChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const inputContext = new AudioContext({ sampleRate: 16000 });
      
      // Request camera with fallback logic
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: { 
                width: 640, 
                height: 480, 
                frameRate: 15,
                facingMode: facingMode 
            } 
        });
      } catch (err) {
         console.warn("Specific camera constraint failed, falling back to default video", err);
         stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      }

      streamRef.current = stream;

      recorderDestRef.current = audioContextRef.current.createMediaStreamDestination();
      const micSource = audioContextRef.current.createMediaStreamSource(stream);
      micSource.connect(recorderDestRef.current);

      if (stream.getVideoTracks().length > 0) {
        const combinedStream = new MediaStream([
            stream.getVideoTracks()[0],
            recorderDestRef.current.stream.getAudioTracks()[0]
        ]);
        
        try {
            const mimeType = getSupportedMimeType();
            const options = mimeType ? { mimeType } : undefined;
            const recorder = new MediaRecorder(combinedStream, options);
            
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunksRef.current.push(e.data);
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
        } catch (e) {
            console.warn("MediaRecorder failed to initialize", e);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const source = inputContext.createMediaStreamSource(stream);
      const processor = inputContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (!isMicOnRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        if (statusRef.current === ConnectionStatus.CONNECTED || statusRef.current === ConnectionStatus.CONNECTING) {
             liveServiceRef.current?.sendAudioChunk(inputData);
        }
      };
      
      source.connect(processor);
      processor.connect(inputContext.destination);

      const systemInstruction = SYSTEM_INSTRUCTION_TEMPLATE.replace('{{USER_GOAL}}', userGoal);
      
      await liveServiceRef.current?.connect(
        systemInstruction,
        {
          onOpen: () => {
            setStatus(ConnectionStatus.CONNECTED);
            startVideoStreaming();
          },
          onClose: () => { },
          onError: () => setStatus(ConnectionStatus.ERROR),
          onAudioData: (buffer) => playAudioResponse(buffer),
          onTranscript: (update: TranscriptUpdate) => {
            if (update.source === 'ai') {
                setLastTranscript(prev => {
                    const newText = prev + update.text;
                    triggerHaptics(update.text);
                    return newText.slice(-150); 
                });
            }
          }
        },
        audioContextRef.current
      );

    } catch (err) {
      console.error(err);
      setStatus(ConnectionStatus.ERROR);
      stopSession();
    }
  };

  const stopSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.onstop = () => {
            const mimeType = getSupportedMimeType() || 'video/webm';
            const blob = new Blob(recordedChunksRef.current, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const duration = (Date.now() - recordingStartTimeRef.current) / 1000;
            if (duration > 2) {
                onSaveSnippet({
                    id: Date.now().toString(),
                    timestamp: Date.now(),
                    duration: duration,
                    videoUrl: url,
                    goal: userGoal
                });
            }
        };
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (videoIntervalRef.current) {
      window.clearInterval(videoIntervalRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    liveServiceRef.current?.disconnect();
    setStatus(ConnectionStatus.DISCONNECTED);
  };

  const startVideoStreaming = () => {
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !videoRef.current || !canvasRef.current) return;

    videoIntervalRef.current = window.setInterval(async () => {
        if (!isVideoOn) return;
        if (videoRef.current && videoRef.current.videoWidth > 0) {
            canvasRef.current!.width = videoRef.current.videoWidth;
            canvasRef.current!.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0);
            const base64 = canvasRef.current!.toDataURL('image/jpeg', 0.5).split(',')[1];
            await liveServiceRef.current?.sendVideoFrame(base64);
        }
    }, 1000); 
  };

  const playAudioResponse = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    if (nextStartTimeRef.current < now) nextStartTimeRef.current = now;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    if (recorderDestRef.current) {
        source.connect(recorderDestRef.current);
    }
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
  };

  const isActive = status === ConnectionStatus.CONNECTED;

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto gap-4 relative">
      
      {/* Goal Input Section */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 shadow-lg">
        <label htmlFor="goal-input" className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-2 block flex items-center gap-2">
            <Disc className="w-4 h-4 text-yellow-500 animate-spin-slow" />
            Active Navigation Goal
        </label>
        <input 
            id="goal-input"
            type="text" 
            value={userGoal}
            onChange={(e) => {
                setUserGoal(e.target.value);
                liveServiceRef.current?.setGoal(e.target.value);
            }}
            placeholder="E.g., Find a seat, Navigate to exit..."
            disabled={isActive}
            className="w-full bg-black/50 text-white text-lg p-3 rounded-lg border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none transition-all placeholder:text-gray-600"
        />
      </div>

      {/* Main Activation Button */}
      <button
        onClick={toggleSession}
        aria-label={isActive ? "Stop Aura Guide" : "Start Aura Guide"}
        aria-pressed={isActive}
        className={`flex-1 min-h-[300px] rounded-3xl flex flex-col items-center justify-center transition-all border-4 shadow-2xl relative overflow-hidden group ${
            isActive 
            ? 'bg-red-600 border-red-400 active:bg-red-700' 
            : status === ConnectionStatus.CONNECTING 
                ? 'bg-gray-800 border-yellow-500' 
                : 'bg-yellow-500 border-yellow-300 active:scale-[0.98]'
        }`}
      >
        {/* Recording Indicator */}
        {isActive && (
            <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
                <span className="text-white font-mono text-sm font-bold">LIVE</span>
            </div>
        )}

        {/* Live Captions Overlay */}
        {isActive && lastTranscript && (
             <div className="absolute inset-x-4 bottom-8 bg-black/80 backdrop-blur-md p-6 rounded-2xl border-l-4 border-yellow-400 shadow-2xl">
                <div className="flex items-center gap-2 mb-2 text-yellow-400 font-bold uppercase text-xs tracking-wider">
                    <Activity className="w-4 h-4 animate-pulse" />
                    Real-time Analysis
                </div>
                <p className="text-white text-2xl md:text-3xl font-bold leading-tight">
                    "{lastTranscript}"
                </p>
             </div>
        )}

        <div className={`p-8 rounded-full mb-8 transition-transform duration-500 ${isActive ? 'bg-white text-red-600 scale-110' : 'bg-black text-yellow-500 group-hover:scale-105'}`}>
            <Power className="w-20 h-20 md:w-24 md:h-24" strokeWidth={1.5} />
        </div>
        
        {!lastTranscript && (
            <div className="text-center space-y-2">
                <span className={`block text-5xl md:text-6xl font-black uppercase tracking-tighter ${isActive ? 'text-white' : 'text-black'}`}>
                    {isActive ? "STOP" : status === ConnectionStatus.CONNECTING ? "..." : "START"}
                </span>
                <span className={`block text-base font-medium uppercase tracking-widest ${isActive ? 'text-red-100' : 'text-black/60'}`}>
                    {isActive ? "Tap to Finish" : "Tap to Begin"}
                </span>
            </div>
        )}
      </button>

      {/* Bottom Controls */}
      <div className="grid grid-cols-3 gap-3 mb-safe">
        <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-3 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 border transition-colors ${isMicOn ? 'bg-gray-900 border-gray-700 text-white hover:border-gray-500' : 'bg-red-900/50 border-red-600 text-red-100'}`}
        >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            {isMicOn ? "Mic On" : "Mic Off"}
        </button>
        <button 
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-3 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 border transition-colors ${isVideoOn ? 'bg-gray-900 border-gray-700 text-white hover:border-gray-500' : 'bg-red-900/50 border-red-600 text-red-100'}`}
        >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            {isVideoOn ? "Cam On" : "Cam Off"}
        </button>
         <button 
            onClick={switchCamera}
            className="p-3 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 border bg-gray-900 border-gray-700 text-white hover:border-gray-500"
        >
            <SwitchCamera className="w-5 h-5" />
            Flip Cam
        </button>
      </div>

      <div className="hidden">
        <video ref={videoRef} muted playsInline autoPlay />
        <canvas ref={canvasRef} />
      </div>

    </div>
  );
};