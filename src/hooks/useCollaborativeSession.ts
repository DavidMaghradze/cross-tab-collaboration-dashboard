import { useState, useEffect, useCallback, useRef } from 'react';
import { useBroadcastChannel } from 'react-broadcast-sync';
import { 
  User, 
  Message, 
  CounterAction, 
  CollaborativeState 
} from '../types';
import { generateRandomName, generateUserId } from '../utils/helpers';

const CHANNEL_NAME = 'collaborative-dashboard';
const TYPING_TIMEOUT = 3000; // 3 seconds
const SYNC_INTERVAL = 5000; // 5 seconds

export const useCollaborativeSession = () => {
  const currentUserRef = useRef<User>({
    id: generateUserId(),
    name: generateRandomName(),
    lastActivity: Date.now(),
    isTyping: false
  });

  const [users, setUsers] = useState<User[]>([currentUserRef.current]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [counter, setCounter] = useState(0);
  const [lastCounterAction, setLastCounterAction] = useState<CounterAction | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deletedMessageIds = useRef<Set<string>>(new Set());
  const messageTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const stateRef = useRef({ users, messages, counter, lastCounterAction, theme });
  
  const lastProcessedIndexRef = useRef<number>(-1);

  const { messages: broadcastMessages, postMessage } = useBroadcastChannel(CHANNEL_NAME);
  
  const deleteMessageRef = useRef<((messageId: string) => void) | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = { users, messages, counter, lastCounterAction, theme };
  }, [users, messages, counter, lastCounterAction, theme]);


  const deleteMessage = useCallback((messageId: string) => {
    // Clear timeout if exists
    const timeout = messageTimeoutsRef.current.get(messageId);
    if (timeout) {
      clearTimeout(timeout);
      messageTimeoutsRef.current.delete(messageId);
    }
    
    deletedMessageIds.current.add(messageId);
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    postMessage('DELETE_MESSAGE', { 
      type: 'DELETE_MESSAGE', 
      payload: { messageId, userId: currentUserRef.current.id } 
    });
  }, [postMessage]);
  
  // Keep ref in sync
  deleteMessageRef.current = deleteMessage;

  const sendMessage = useCallback((content: string, expirationSeconds?: number) => {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      userId: currentUserRef.current.id,
      userName: currentUserRef.current.name,
      content,
      timestamp: Date.now(),
      expiresAt: expirationSeconds ? Date.now() + (expirationSeconds * 1000) : undefined
    };

    setMessages(prev => [...prev, message]);
    postMessage('SEND_MESSAGE', { type: 'SEND_MESSAGE', payload: message });

    if (expirationSeconds && message.expiresAt) {
      const timeout = setTimeout(() => {
        deleteMessageRef.current?.(message.id);
      }, expirationSeconds * 1000);
      messageTimeoutsRef.current.set(message.id, timeout);
    }
  }, [postMessage]);

  const markTyping = useCallback((isTyping: boolean) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      currentUserRef.current.isTyping = true;
      postMessage('USER_TYPING', { 
        type: 'USER_TYPING', 
        payload: { userId: currentUserRef.current.id, isTyping: true } 
      });
      
      typingTimeoutRef.current = setTimeout(() => {
        currentUserRef.current.isTyping = false;
        postMessage('USER_TYPING', { 
          type: 'USER_TYPING', 
          payload: { userId: currentUserRef.current.id, isTyping: false } 
        });
      }, TYPING_TIMEOUT);
    } else {
      currentUserRef.current.isTyping = false;
      postMessage('USER_TYPING', { 
        type: 'USER_TYPING', 
        payload: { userId: currentUserRef.current.id, isTyping: false } 
      });
    }
  }, [postMessage]);

  const updateCounter = useCallback((increment: boolean) => {
    const action: CounterAction = {
      userId: currentUserRef.current.id,
      userName: currentUserRef.current.name,
      timestamp: Date.now()
    };
    
    setCounter(prev => increment ? prev + 1 : prev - 1);
    setLastCounterAction(action);
    
    postMessage(increment ? 'INCREMENT_COUNTER' : 'DECREMENT_COUNTER', { 
      type: increment ? 'INCREMENT_COUNTER' : 'DECREMENT_COUNTER', 
      payload: action 
    });
  }, [postMessage]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      postMessage('TOGGLE_THEME', { type: 'TOGGLE_THEME', payload: { theme: newTheme } });
      return newTheme;
    });
  }, [postMessage]);

  useEffect(() => {
    if (!broadcastMessages || broadcastMessages.length === 0) return;

    // Process only messages after the last processed index
    const newMessages = broadcastMessages.slice(lastProcessedIndexRef.current + 1);
    
    if (newMessages.length === 0) return;

    // Update the last processed index
    lastProcessedIndexRef.current = broadcastMessages.length - 1;

    newMessages.forEach(message => {
      const data = message.message;

      switch (data.type) {
        case 'USER_JOIN':
          setUsers(prev => {
            if (prev.find(u => u.id === data.payload.id)) return prev;
            return [...prev, data.payload];
          });
          break;

        case 'USER_LEAVE':
          setUsers(prev => prev.filter(user => user.id !== data.payload.userId));
          break;

        case 'USER_TYPING':
          setUsers(prev => {
            const user = prev.find(u => u.id === data.payload.userId);
            // Only update if user found and isTyping is different
            if (!user || user.isTyping === data.payload.isTyping) {
              return prev;
            }
            return prev.map(u => 
              u.id === data.payload.userId 
                ? { ...u, isTyping: data.payload.isTyping }
                : u
            );
          });
          break;

        case 'SEND_MESSAGE':
          setMessages(prev => {
            if (prev.find(m => m.id === data.payload.id)) return prev;
            return [...prev, data.payload];
          });
          
          // Set timeout if message expires
          if (data.payload.expiresAt && deleteMessageRef.current) {
            const now = Date.now();
            const timeUntilExpiration = data.payload.expiresAt - now;
            if (timeUntilExpiration > 0) {
              const timeout = setTimeout(() => {
                deleteMessageRef.current?.(data.payload.id);
              }, timeUntilExpiration);
              messageTimeoutsRef.current.set(data.payload.id, timeout);
            } else {
              // Already expired, delete immediately
              deleteMessageRef.current(data.payload.id);
            }
          }
          break;

        case 'DELETE_MESSAGE':
          // Clear timeout if exists
          const timeout = messageTimeoutsRef.current.get(data.payload.messageId);
          if (timeout) {
            clearTimeout(timeout);
            messageTimeoutsRef.current.delete(data.payload.messageId);
          }
          
          deletedMessageIds.current.add(data.payload.messageId);
          setMessages(prev => prev.filter(msg => msg.id !== data.payload.messageId));
          break;

        case 'INCREMENT_COUNTER':
          setCounter(prev => prev + 1);
          setLastCounterAction(data.payload);
          break;

        case 'DECREMENT_COUNTER':
          setCounter(prev => prev - 1);
          setLastCounterAction(data.payload);
          break;

        case 'TOGGLE_THEME':
          setTheme(prev => {
            if (prev !== data.payload.theme) {
              return data.payload.theme;
            }
            return prev;
          });
          break;

        case 'SYNC_STATE':
          const { users: syncedUsers, messages: syncedMessages, counter: syncedCounter, lastCounterAction: syncedAction, theme: syncedTheme } = data.payload;
          
          // Accept sync if: we have no action yet, OR the synced action is newer
          // This allows new tabs to get initial state
          const shouldAcceptSync = !lastCounterAction || 
            (syncedAction && syncedAction.timestamp > lastCounterAction.timestamp);
          
          if (shouldAcceptSync) {
            const hasCurrentUser = syncedUsers.find((u: User) => u.id === currentUserRef.current.id);
            const usersToSet = !hasCurrentUser ? [...syncedUsers, currentUserRef.current] : syncedUsers;
            
            // Only update users if different
            setUsers(prev => {
              if (JSON.stringify(prev.map((u: User) => u.id).sort()) === JSON.stringify(usersToSet.map((u: User) => u.id).sort())) {
                return prev;
              }
              return usersToSet;
            });
            
            // Merge messages, but keep any local messages that aren't in the sync
            // Also exclude any deleted messages
            setMessages(prev => {
              const merged = syncedMessages.filter((syncedMsg: Message) => !deletedMessageIds.current.has(syncedMsg.id));
              prev.forEach(msg => {
                if (!merged.find((m: Message) => m.id === msg.id) && !deletedMessageIds.current.has(msg.id)) {
                  merged.push(msg);
                }
              });
              const sorted = merged.sort((a: Message, b: Message) => a.timestamp - b.timestamp);
              
              // Only return new array if different
              if (JSON.stringify(prev.map((m: Message) => m.id)) === JSON.stringify(sorted.map((m: Message) => m.id))) {
                return prev;
              }
              return sorted;
            });
            
            setCounter(prev => prev === syncedCounter ? prev : syncedCounter);
            setLastCounterAction(syncedAction);
            setTheme(prev => prev === syncedTheme ? prev : syncedTheme);
          } else {
            // Only merge users and messages, don't touch counter/theme
            const hasCurrentUser = syncedUsers.find((u: User) => u.id === currentUserRef.current.id);
            if (!hasCurrentUser) {
              setUsers(prev => {
                const exists = prev.find((u: User) => u.id === currentUserRef.current.id);
                if (!exists) {
                  return [...syncedUsers, currentUserRef.current];
                }
                return prev;
              });
            }
            
            setMessages(prev => {
              const merged = prev.filter((msg: Message) => !deletedMessageIds.current.has(msg.id));
              syncedMessages.forEach((syncedMsg: Message) => {
                if (!merged.find((m: Message) => m.id === syncedMsg.id) && !deletedMessageIds.current.has(syncedMsg.id)) {
                  merged.push(syncedMsg);
                }
              });
              const sorted = merged.sort((a: Message, b: Message) => a.timestamp - b.timestamp);
              
              // Only return new array if different
              if (JSON.stringify(prev.map((m: Message) => m.id)) === JSON.stringify(sorted.map((m: Message) => m.id))) {
                return prev;
              }
              return sorted;
            });
          }
          break;
      }
    });
  }, [broadcastMessages]);

  // Initialize
  useEffect(() => {
    postMessage('USER_JOIN', { type: 'USER_JOIN', payload: currentUserRef.current });
    
    const syncInterval = setInterval(() => {
      const activeMessages = stateRef.current.messages.filter(
        msg => !deletedMessageIds.current.has(msg.id)
      );
      
      const state: CollaborativeState = {
        users: stateRef.current.users,
        messages: activeMessages,
        counter: stateRef.current.counter,
        lastCounterAction: stateRef.current.lastCounterAction,
        theme: stateRef.current.theme
      };
      postMessage('SYNC_STATE', { type: 'SYNC_STATE', payload: state });
    }, SYNC_INTERVAL);

    return () => {
      postMessage('USER_LEAVE', { 
        type: 'USER_LEAVE', 
        payload: { userId: currentUserRef.current.id } 
      });
      
      clearInterval(syncInterval);
      
      messageTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      messageTimeoutsRef.current.clear();
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Clear typing indicator when window loses focus
  useEffect(() => {
    const handleBlur = () => {
      if (currentUserRef.current.isTyping) {
        markTyping(false);
      }
    };
    
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [markTyping]);

  return {
    currentUser: currentUserRef.current,
    users,
    messages,
    counter,
    lastCounterAction,
    theme,
    sendMessage,
    deleteMessage,
    markTyping,
    updateCounter,
    toggleTheme
  };
};