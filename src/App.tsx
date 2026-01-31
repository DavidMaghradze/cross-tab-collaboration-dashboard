import { useEffect } from 'react';
import { useCollaborativeSession } from './hooks/useCollaborativeSession';
import { UserPresence } from './components/UserPresence';
import { SharedCounter } from './components/SharedCounter';
import { Chat } from './components/Chat';
import { Sun, Moon, Zap } from 'lucide-react';

function App() {
  const {
    currentUser,
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
  } = useCollaborativeSession();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Cross-Tab Collaboration Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real-time sync across all browser tabs
                </p>
              </div>
            </div>
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>💡 Tip:</strong> Open this page in multiple tabs to see real-time synchronization in action!
            Your current session: <span className="font-mono font-semibold">{currentUser.name}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <UserPresence users={users} currentUserId={currentUser.id} />
            <SharedCounter 
              counter={counter} 
              lastAction={lastCounterAction}
              onIncrement={() => updateCounter(true)}
              onDecrement={() => updateCounter(false)}
            />
          </div>

          <div className="lg:col-span-2">
            <Chat
              messages={messages}
              users={users}
              currentUserId={currentUser.id}
              onSendMessage={sendMessage}
              onDeleteMessage={deleteMessage}
              onTyping={markTyping}
            />
          </div>
        </div>
      </main>

      <footer className="mt-12 py-6 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Built with React, TypeScript, Tailwind CSS, and react-broadcast-sync
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
