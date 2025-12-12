import React, { useState } from 'react';
import { HistorySnippet } from '../types';
import { Play, Clock, Calendar, Trash2 } from 'lucide-react';

interface Props {
  snippets: HistorySnippet[];
  onDelete: (id: string) => void;
}

export const HistoryView: React.FC<Props> = ({ snippets, onDelete }) => {
  const [selectedSnippet, setSelectedSnippet] = useState<HistorySnippet | null>(null);

  if (snippets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
          <Clock className="w-8 h-8 text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-300">No History Yet</h2>
        <p className="text-gray-500 max-w-md">
          Record snippets in Live Mode to review navigation actions here. 
          Use these recordings to analyze how Aura guided you.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-yellow-500 mb-6 flex items-center gap-2">
        <Clock className="w-6 h-6" />
        Session History
      </h2>

      {selectedSnippet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-gray-900 rounded-xl overflow-hidden max-w-4xl w-full border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-lg">{selectedSnippet.goal}</h3>
                <span className="text-gray-400 text-sm">
                  {new Date(selectedSnippet.timestamp).toLocaleString()}
                </span>
              </div>
              <button 
                onClick={() => setSelectedSnippet(null)}
                className="text-gray-400 hover:text-white px-4 py-2"
              >
                Close
              </button>
            </div>
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
               <video 
                 src={selectedSnippet.videoUrl} 
                 controls 
                 autoPlay 
                 className="max-h-full max-w-full"
               />
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {snippets.map((snippet) => (
          <div key={snippet.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-yellow-500 transition-colors group">
            <div className="aspect-video bg-black relative flex items-center justify-center">
              <video 
                src={snippet.videoUrl} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />
              <button 
                onClick={() => setSelectedSnippet(snippet)}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-black fill-current ml-1" />
                </div>
              </button>
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono">
                {formatDuration(snippet.duration)}
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-bold text-white truncate" title={snippet.goal}>
                  {snippet.goal}
                </h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(snippet.id);
                  }}
                  className="text-gray-600 hover:text-red-500 transition-colors"
                  title="Delete Snippet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Calendar className="w-3 h-3" />
                <span>{new Date(snippet.timestamp).toLocaleDateString()}</span>
                <span>•</span>
                <span>{new Date(snippet.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
