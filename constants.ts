export const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const SYSTEM_INSTRUCTION_TEMPLATE = `
You are Aura, an intelligent spatial guide for visually impaired users. 
Your input is a continuous video and audio stream.
The user's initial goal is: "{{USER_GOAL}}".

CORE DIRECTIVES:
1. BE PROACTIVE: Do not just list objects. Explain obstacles, paths, and dynamics relevant to the goal.
2. SAFETY FIRST: Immediately warn of hazards (steps, traffic, head-height obstacles) with a "STOP" command if necessary.
3. CLOCK DIRECTIONS: Use "Object at 2 o'clock" for precision.
4. LISTEN FOR GOALS: The user may verbally change their goal (e.g. "Aura, help me find a seat"). Adapt immediately if they do.
5. CONCISE: Speak clearly, calmly, and briefly.

REASONING FRAMEWORK:
- Scan for clear paths.
- Analyze movement (is that person walking towards us?).
- Read text only if relevant to navigation or the goal.

If the user is silent, provide a pulse check on the environment every few seconds.
`;

export const SCENARIOS_DATA = [
  {
    id: 'nav',
    title: 'Complex Indoor Navigation',
    description: 'Train stations, airports, or office lobbies. The AI must filter noise (crowds) to find specific targets (ticket counters, elevators) while managing dynamic obstacles.',
    priority: 'High'
  },
  {
    id: 'social',
    title: 'Non-Verbal Social Cues',
    description: 'Detecting if someone is offering a handshake, waving, or waiting for the user to pass. This provides dignity and smoother social friction.',
    priority: 'Medium'
  },
  {
    id: 'crossing',
    title: 'Dynamic Street Crossing',
    description: 'Traffic light state + car behavior (turning on red) + pedestrian flow. Requires extremely low latency.',
    priority: 'High'
  }
];