export interface User {
  id: string;
  name: string;
  lastActivity: number;
  isTyping: boolean;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  expiresAt?: number;
}

export interface CounterAction {
  userId: string;
  userName: string;
  timestamp: number;
}

export interface CollaborativeState {
  users: User[];
  messages: Message[];
  counter: number;
  lastCounterAction: CounterAction | null;
  theme: 'light' | 'dark';
}

export type BroadcastAction =
  | { type: 'USER_JOIN'; payload: User }
  | { type: 'USER_LEAVE'; payload: { userId: string } }
  | { type: 'USER_ACTIVITY'; payload: { userId: string; timestamp: number } }
  | { type: 'USER_TYPING'; payload: { userId: string; isTyping: boolean } }
  | { type: 'SEND_MESSAGE'; payload: Message }
  | { type: 'DELETE_MESSAGE'; payload: { messageId: string; userId: string } }
  | { type: 'INCREMENT_COUNTER'; payload: CounterAction }
  | { type: 'DECREMENT_COUNTER'; payload: CounterAction }
  | { type: 'TOGGLE_THEME'; payload: { theme: 'light' | 'dark' } }
  | { type: 'SYNC_STATE'; payload: CollaborativeState };
