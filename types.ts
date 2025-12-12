import React from 'react';

export enum AppMode {
  BLUEPRINT = 'BLUEPRINT',
  LIVE_PROTOTYPE = 'LIVE_PROTOTYPE',
  HISTORY = 'HISTORY'
}

export interface HistorySnippet {
  id: string;
  timestamp: number;
  duration: number; // in seconds
  videoUrl: string; // Blob URL
  goal: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  icon: React.ReactNode;
}

export interface ReasoningStep {
  stage: string;
  input: string;
  process: string;
  output: string;
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface AudioStreamConfig {
  sampleRate: number;
}

export interface TranscriptUpdate {
    source: 'user' | 'ai';
    text: string;
    isFinal: boolean;
}