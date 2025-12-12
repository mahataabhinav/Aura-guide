import React, { useState, useEffect } from 'react';
import { BlueprintView } from './components/BlueprintView';
import { LivePrototypeView } from './components/LivePrototypeView';
import { HistoryView } from './components/HistoryView';
import { AppMode, HistorySnippet } from './types';
import { Layout, Eye, Accessibility, History, Key } from 'lucide-react';

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
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey) {
            const envKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
            setApiKey(envKey || 'injected'); 
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
        alert("This app requires the AI Studio environment with paid API keys.");
    }
  };

  const handleSaveSnippet = (snippet: HistorySnippet) => {
    setHistory(prev => [snippet, ...prev]);
  };

  const handleDeleteSnippet = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  if (!hasCheckedKey) return <div className="min-h-screen flex items-center justify-center bg-black text-white text-2xl font-bold">Loading Aura...</div>;

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
      <header className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-md border-b border-gray-800 z-50 h-16">
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
                        className="bg-yellow-500 text-black text-xs md:text-sm font-bold px-4 py-2 rounded-full hover:bg-yellow-400 transition-colors"
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in">
                <div className="w-24 h-24 bg-gray-900 rounded-3xl flex items-center justify-center border-4 border-gray-800 mb-4">
                    <Key className="w-10 h-10 text-yellow-500" />
                </div>
                <div className="space-y-4 max-w-md">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">Welcome to Aura</h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        To activate high-bandwidth video processing and spatial reasoning, please connect a paid Google Cloud API Key.
                    </p>
                </div>
                <button 
                    onClick={handleKeySelection}
                    className="w-full max-w-xs bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold text-xl shadow-xl shadow-yellow-900/20 transition-all active:scale-95"
                >
                    Connect API Key
                </button>
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