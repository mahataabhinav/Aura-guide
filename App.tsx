import React, { useState, useEffect } from 'react';
import { BlueprintView } from './components/BlueprintView';
import { LivePrototypeView } from './components/LivePrototypeView';
import { HistoryView } from './components/HistoryView';
import { AppMode, HistorySnippet } from './types';
import { Layout, Eye, Accessibility, History, Key, ShieldCheck, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [mode, setMode] = useState<AppMode>(AppMode.BLUEPRINT);
  const [hasCheckedKey, setHasCheckedKey] = useState(false);
  const [history, setHistory] = useState<HistorySnippet[]>([]);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      // VITE_API_KEY must be accessed explicitly for the bundler to replace it.
      // Dynamic access (e.g. import.meta.env[key]) does not work in Vite production builds.
      let envKey = '';
      
      try {
        // @ts-ignore
        if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) {
            // @ts-ignore
            envKey = import.meta.env.VITE_API_KEY;
        } 
        // @ts-ignore
        else if (import.meta && import.meta.env && import.meta.env.REACT_APP_API_KEY) {
            // @ts-ignore
            envKey = import.meta.env.REACT_APP_API_KEY;
        }
      } catch (err) {
        // Ignore errors if import.meta is not defined
      }

      // Fallback to process.env for other build systems
      if (!envKey && typeof process !== 'undefined' && process.env) {
          envKey = process.env.VITE_API_KEY || process.env.REACT_APP_API_KEY || process.env.API_KEY || '';
      }

      if (envKey) {
        console.log("Aura: API Key detected in environment variables.");
        setApiKey(envKey);
        setMode(AppMode.LIVE_PROTOTYPE);
        setHasCheckedKey(true);
        return;
      }

      // 2. Fallback to AI Studio (Development/Preview)
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey) {
            // In AI Studio, the key is often injected into process.env.API_KEY dynamically
            const studioKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
            setApiKey(studioKey || 'injected'); 
        }
      }
    } catch (e) {
      console.error("Error checking API key:", e);
    } finally {
      setHasCheckedKey(true);
    }
  };

  const handleKeySelection = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
        try {
            await window.aistudio.openSelectKey();
            const envKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
            setApiKey(envKey || 'injected');
        } catch(e) {
            console.error(e);
            alert("Could not select API key. Please try again.");
        }
    } else {
        alert("Public Access: To use this app without signing in, the host must configure the 'VITE_API_KEY' environment variable in Netlify. (Checked: import.meta.env.VITE_API_KEY, process.env.VITE_API_KEY)");
    }
  };

  const handleSaveSnippet = (snippet: HistorySnippet) => {
    setHistory(prev => [snippet, ...prev]);
  };

  const handleDeleteSnippet = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  if (!hasCheckedKey) return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4 animate-pulse">
            <Eye className="w-12 h-12 text-yellow-500" />
            <span className="text-xl font-bold tracking-widest uppercase text-gray-500">Initializing Aura...</span>
        </div>
    </div>
  );

  const NavButton = ({ targetMode, icon: Icon, label }: { targetMode: AppMode, icon: any, label: string }) => (
    <button 
        onClick={() => setMode(targetMode)}
        className={`flex flex-col md:flex-row items-center justify-center md:gap-2 px-3 py-2 rounded-lg transition-all w-full md:w-auto ${mode === targetMode ? 'text-yellow-500 md:bg-gray-800' : 'text-gray-400 hover:text-gray-200'}`}
        role="tab"
        aria-selected={mode === targetMode}
    >
        <Icon className={`w-6 h-6 md:w-5 md:h-5 ${mode === targetMode ? 'stroke-[3px]' : ''}`} />
        <span className="text-[10px] md:text-base font-bold uppercase md:normal-case tracking-wider md:tracking-normal mt-1 md:mt-0">{label}</span>
        {targetMode === AppMode.HISTORY && history.length > 0 && (
            <span className="absolute top-2 right-1/4 md:top-auto md:right-auto md:relative md:ml-1 bg-red-600 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[1.2rem] h-[1.2rem] flex items-center justify-center">
                {history.length}
            </span>
        )}
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      
      {/* Header - Desktop & Mobile */}
      <header className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-md border-b border-gray-800 z-50 h-16 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20">
                    <Eye className="w-5 h-5 text-black" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">Aura Guide</h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Desktop Navigation */}
                {apiKey && (
                    <nav className="hidden md:flex bg-gray-900/50 p-1 rounded-xl border border-gray-800" role="tablist">
                        <NavButton targetMode={AppMode.BLUEPRINT} icon={Layout} label="Blueprint" />
                        <NavButton targetMode={AppMode.LIVE_PROTOTYPE} icon={Accessibility} label="Live Mode" />
                        <NavButton targetMode={AppMode.HISTORY} icon={History} label="History" />
                    </nav>
                )}

                {!apiKey ? (
                    <button 
                        onClick={handleKeySelection}
                        className="bg-yellow-500 text-black text-xs md:text-sm font-bold px-4 py-2 rounded-full hover:bg-yellow-400 transition-colors shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]"
                    >
                        Connect Key
                    </button>
                ) : (
                    <div className="flex items-center gap-2 text-xs font-mono text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="hidden sm:inline">API Active</span>
                    </div>
                )}
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-20 pb-24 md:pb-12 px-4 w-full max-w-6xl mx-auto overflow-x-hidden">
        {!apiKey ? (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12 animate-fade-in relative z-10 py-10">
                {/* Hero Graphic */}
                <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500 blur-[100px] opacity-10 rounded-full"></div>
                    <div className="w-32 h-32 bg-gray-900 rounded-[2rem] flex items-center justify-center border-4 border-yellow-500/30 mb-4 relative z-10 shadow-2xl rotate-3 transform hover:rotate-0 transition-all duration-500">
                        <Eye className="w-16 h-16 text-yellow-500" />
                    </div>
                </div>
                
                <div className="space-y-6 max-w-2xl">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
                        See the World <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">With New Eyes</span>
                    </h2>
                    <p className="text-gray-400 text-lg md:text-xl leading-relaxed font-medium max-w-lg mx-auto">
                        Aura acts as a proactive spatial narrator, using Gemini's advanced multimodal reasoning to describe not just what is there, but <span className="text-white">what it means</span>.
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                    <div className="bg-gray-900/40 backdrop-blur-sm p-6 rounded-2xl border border-gray-800 flex flex-col items-center gap-3 hover:bg-gray-800/60 transition-colors">
                        <div className="bg-blue-900/30 p-3 rounded-xl">
                            <Layout className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="font-bold text-white">Spatial Reasoning</h3>
                        <p className="text-xs text-gray-500">Understands paths, blockages, and layout dynamics.</p>
                    </div>
                    <div className="bg-gray-900/40 backdrop-blur-sm p-6 rounded-2xl border border-gray-800 flex flex-col items-center gap-3 hover:bg-gray-800/60 transition-colors">
                        <div className="bg-green-900/30 p-3 rounded-xl">
                            <ShieldCheck className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="font-bold text-white">Safety First</h3>
                        <p className="text-xs text-gray-500">Proactive hazard warnings and clear path guidance.</p>
                    </div>
                    <div className="bg-gray-900/40 backdrop-blur-sm p-6 rounded-2xl border border-gray-800 flex flex-col items-center gap-3 hover:bg-gray-800/60 transition-colors">
                        <div className="bg-purple-900/30 p-3 rounded-xl">
                            <Zap className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="font-bold text-white">Real-Time</h3>
                        <p className="text-xs text-gray-500">Low latency audio streaming via Gemini Live API.</p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 w-full">
                    <button 
                        onClick={handleKeySelection}
                        className="w-full max-w-sm bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-5 rounded-2xl font-bold text-xl shadow-[0_0_40px_-10px_rgba(234,179,8,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3 group"
                    >
                        <Key className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        Connect API Key to Start
                    </button>
                    <p className="text-xs text-gray-600">
                        Powered by Google Gemini 2.5 Flash • Live API
                    </p>
                </div>
            </div>
        ) : (
            <>
                {mode === AppMode.BLUEPRINT && <BlueprintView onSimulate={handleSaveSnippet} />}
                {mode === AppMode.LIVE_PROTOTYPE && <LivePrototypeView apiKey={apiKey} onSaveSnippet={handleSaveSnippet} />}
                {mode === AppMode.HISTORY && <HistoryView snippets={history} onDelete={handleDeleteSnippet} />}
            </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      {apiKey && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 z-50 pb-safe">
            <div className="flex justify-between items-center px-6 h-20 relative">
                 <NavButton targetMode={AppMode.BLUEPRINT} icon={Layout} label="Blueprint" />
                 <NavButton targetMode={AppMode.LIVE_PROTOTYPE} icon={Accessibility} label="Live" />
                 <NavButton targetMode={AppMode.HISTORY} icon={History} label="History" />
            </div>
        </nav>
      )}

    </div>
  );
};

export default App;