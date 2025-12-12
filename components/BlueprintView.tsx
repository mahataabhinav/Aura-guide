import React, { useState } from 'react';
import { SCENARIOS_DATA } from '../constants';
import { HistorySnippet } from '../types';
import { ShieldCheck, BrainCircuit, Activity, Eye, AlertTriangle, PlayCircle, Loader2 } from 'lucide-react';

interface Props {
  onSimulate?: (snippet: HistorySnippet) => void;
}

export const BlueprintView: React.FC<Props> = ({ onSimulate }) => {
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = async () => {
    if (!onSimulate) return;
    setIsSimulating(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        onSimulate({
          id: `sim-${Date.now()}`,
          timestamp: Date.now(),
          duration: 5,
          videoUrl: url,
          goal: "Find a park bench (Simulation)"
        });
        
        setIsSimulating(false);
        alert("Simulation Complete! Check 'History' tab to view the recording.");
      };

      recorder.start();

      let frame = 0;
      const maxFrames = 150;
      
      const animate = () => {
        if (frame >= maxFrames) {
          recorder.stop();
          return;
        }

        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, 640, 240);
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, 240, 640, 240);
        
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.moveTo(300, 240);
        ctx.lineTo(340, 240);
        ctx.lineTo(440, 480);
        ctx.lineTo(200, 480);
        ctx.fill();

        const shakeX = Math.sin(frame * 0.5) * 2;
        const shakeY = Math.cos(frame * 0.8) * 2;
        ctx.save();
        ctx.translate(shakeX, shakeY);

        const personX = 320 + Math.sin(frame * 0.05) * 100;
        ctx.fillStyle = '#FF6347'; 
        ctx.beginPath();
        ctx.arc(personX, 300, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000'; 
        ctx.beginPath();
        ctx.arc(personX, 270, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8B4513';
        ctx.fillRect(400 - (frame * 0.5), 350 + (frame * 0.5), 100 + frame, 40);

        ctx.restore();

        ctx.font = '24px monospace';
        ctx.fillStyle = '#00FF00';
        ctx.fillText(`AURA VISION [REC]`, 20, 40);
        
        if (frame > 50 && frame < 100) {
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 4;
            ctx.strokeRect(personX - 25, 250, 50, 100);
            ctx.fillText(`DETECTED: PEDESTRIAN`, personX - 50, 240);
        }
        
        if (frame > 100) {
             ctx.strokeStyle = '#00FFFF';
             ctx.lineWidth = 4;
             ctx.strokeRect(380, 380, 180, 60);
             ctx.fillText(`TARGET: BENCH`, 380, 370);
        }

        frame++;
        requestAnimationFrame(animate);
      };

      animate();

    } catch (e) {
      console.error(e);
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      
      {/* Simulation Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 border-l-4 border-green-500 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <PlayCircle className="w-8 h-8 text-green-400" />
                    Demo Simulation
                </h2>
                <p className="text-gray-400 max-w-lg">
                    Generate a synthetic "Blind User in Park" scenario to test features without walking outside.
                </p>
            </div>
            
            <button
                onClick={runSimulation}
                disabled={isSimulating}
                className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${isSimulating ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:scale-105 active:scale-95'}`}
            >
                {isSimulating ? (
                    <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        Start Park Simulation
                    </>
                )}
            </button>
        </div>
      </section>

      {/* Section 1: Scenarios */}
      <section className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
        <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6" /> 
          Critical User Scenarios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCENARIOS_DATA.map((scenario) => (
            <div key={scenario.id} className="bg-gray-900 p-5 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${scenario.priority === 'High' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'}`}>
                  {scenario.priority}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{scenario.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{scenario.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Reasoning Chain */}
      <section className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
        <h2 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-2">
          <BrainCircuit className="w-6 h-6" />
          The Reasoning Chain
        </h2>
        
        <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700"></div>
            
            <div className="space-y-8">
                <div className="relative pl-12">
                    <div className="absolute left-2 top-1.5 w-4 h-4 rounded-full bg-purple-500 ring-4 ring-gray-900"></div>
                    <h3 className="text-lg font-bold text-white">1. Perception Layer</h3>
                    <p className="text-gray-400 text-sm mt-1">"I identify a person, a suitcase, a turnstile, and a digital sign."</p>
                </div>

                <div className="relative pl-12">
                    <div className="absolute left-2 top-1.5 w-4 h-4 rounded-full bg-purple-500 ring-4 ring-gray-900"></div>
                    <h3 className="text-lg font-bold text-white">2. Spatial & Temporal Analysis</h3>
                    <p className="text-gray-400 text-sm mt-1">"The person is moving left-to-right, cutting off the direct path. The suitcase is a trip hazard."</p>
                </div>

                <div className="relative pl-12">
                    <div className="absolute left-2 top-1.5 w-4 h-4 rounded-full bg-purple-500 ring-4 ring-gray-900"></div>
                    <h3 className="text-lg font-bold text-white">3. Contextual Integration</h3>
                    <p className="text-gray-400 text-sm mt-1">"The blocked path is irrelevant if I guide them around the suitcase."</p>
                </div>

                <div className="relative pl-12">
                    <div className="absolute left-2 top-1.5 w-4 h-4 rounded-full bg-green-500 ring-4 ring-gray-900 animate-pulse"></div>
                    <h3 className="text-lg font-bold text-green-400">4. Actionable Narrative</h3>
                    <div className="bg-gray-900 p-4 rounded-lg mt-3 border-l-4 border-green-500 italic text-gray-200">
                        "Wait one second for a traveler to pass... Okay, proceed forward. Bear slightly left towards 11 o'clock."
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Section 3: Ethics */}
      <section className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
        <h2 className="text-2xl font-bold text-orange-400 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" />
          Ethics & Pitfalls
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded-xl">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-orange-500"/> Hallucination Risks
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    AI might "guess" text on a blurry sign.
                    <span className="block text-gray-300 mt-1 font-medium">Mitigation: Confidence thresholds.</span>
                </p>
            </div>
            <div className="bg-gray-900 p-4 rounded-xl">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-orange-500"/> Privacy
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Describing strangers in detail can be intrusive.
                    <span className="block text-gray-300 mt-1 font-medium">Mitigation: Focus on behavior, not identity.</span>
                </p>
            </div>
        </div>
      </section>
    </div>
  );
};