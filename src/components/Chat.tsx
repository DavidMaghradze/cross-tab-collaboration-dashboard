import React, { useState, useRef, useEffect } from 'react';
import { Message, User } from '../types';
import { formatTimestamp, getInitials, getAvatarColor } from '../utils/helpers';
import { MessageCircle, Send, Trash2, Clock } from 'lucide-react';

interface ChatProps {
  messages: Message[];
  users: User[];
  currentUserId: string;
  onSendMessage: (content: string, expirationSeconds?: number) => void;
  onDeleteMessage: (messageId: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  users,
  currentUserId,
  onSendMessage,
  onDeleteMessage,
  onTyping
}) => {
  const [inputValue, setInputValue] = useState('');
  const [expirationTime, setExpirationTime] = useState<number | ''>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevMessageCountRef = useRef(messages.length);
  const userScrolledRef = useRef(false);

  // Check if user is near bottom of scroll
  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const threshold = 150;
    const position = container.scrollTop + container.clientHeight;
    const height = container.scrollHeight;
    
    return height - position < threshold;
  };

  const handleScroll = () => {
    if (isNearBottom()) {
      userScrolledRef.current = false;
    } else {
      userScrolledRef.current = true;
    }
  };

  // Auto-scroll to bottom only when appropriate
  useEffect(() => {
    const newMessageAdded = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    // Only auto-scroll if:
    // 1. A new message was added AND
    // 2. User hasn't manually scrolled up OR the new message is from current user
    if (newMessageAdded) {
      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage?.userId === currentUserId;
      
      if (!userScrolledRef.current || isOwnMessage) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [messages, currentUserId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      onTyping(true);
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    } else {
      onTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    const expiration = expirationTime ? Number(expirationTime) : undefined;
    onSendMessage(inputValue.trim(), expiration);
    setInputValue('');
    setExpirationTime('');
    onTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const typingUsers = users.filter(u => u.isTyping && u.id !== currentUserId);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col h-[600px]">
      <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
        <MessageCircle className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Real-time Chat
        </h2>
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map(message => {
              const isOwnMessage = message.userId === currentUserId;
              const timeLeft = message.expiresAt ? Math.max(0, message.expiresAt - Date.now()) : null;
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getAvatarColor(message.userId)} flex items-center justify-center text-white text-xs font-semibold`}>
                    {getInitials(message.userName)}
                  </div>

                  <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-sm font-medium text-gray-900 dark:text-white ${isOwnMessage ? 'order-2' : ''}`}>
                        {message.userName}
                      </span>
                      <span className={`text-xs text-gray-500 dark:text-gray-400 ${isOwnMessage ? 'order-1' : ''}`}>
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    
                    <div className={`inline-block max-w-md`}>
                      <div className={`px-4 py-2 rounded-lg ${
                        isOwnMessage 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      
                      {timeLeft !== null && (
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          isOwnMessage ? 'justify-end' : ''
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span className="text-orange-500 dark:text-orange-400">
                            Expires in {Math.ceil(timeLeft / 1000)}s
                          </span>
                        </div>
                      )}
                      
                      {isOwnMessage && (
                        <button
                          onClick={() => onDeleteMessage(message.id)}
                          className="mt-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
          <span className="inline-flex gap-1 ml-1">
            <span className="animate-bounce">.</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 mb-2">
          <input
            type="number"
            value={expirationTime}
            onChange={(e) => setExpirationTime(e.target.value ? Number(e.target.value) : '')}
            placeholder="Expire in (seconds)"
            min="1"
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          {expirationTime && (
            <button
              type="button"
              onClick={() => setExpirationTime('')}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (Shift+Enter for new line)"
            rows={2}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
