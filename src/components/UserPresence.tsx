import React from 'react';
import { User } from '../types';
import { formatTimestamp, getInitials, getAvatarColor } from '../utils/helpers';
import { Users, Circle } from 'lucide-react';

interface UserPresenceProps {
  users: User[];
  currentUserId: string;
}

export const UserPresence: React.FC<UserPresenceProps> = ({ users, currentUserId }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Active Users ({users.length})
        </h2>
      </div>
      
      <div className="space-y-3">
        {users.map(user => {
          const isCurrentUser = user.id === currentUserId;
          
          return (
            <div 
              key={user.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className={`relative flex-shrink-0 w-10 h-10 rounded-full ${getAvatarColor(user.id)} flex items-center justify-center text-white font-semibold`}>
                {getInitials(user.name)}
                <Circle 
                  className="absolute -bottom-1 -right-1 w-3 h-3 fill-green-500 text-green-500"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  {isCurrentUser && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatTimestamp(user.lastActivity)}</span>
                  {user.isTyping && (
                    <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                      <span className="animate-pulse">●</span>
                      typing...
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
