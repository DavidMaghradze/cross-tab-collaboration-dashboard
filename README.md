# Cross-Tab Collaboration Dashboard

A real-time collaboration dashboard that synchronizes user activity across multiple browser tabs using React and `react-broadcast-sync`.

## 🎯 Live Demo
[View Live Demo](https://cross-tab-collaboration-dashboard.vercel.app/)

## 📦 Setup Instructions

### Prerequisites

- Node.js v16 or higher
- npm or yarn package manager

### Installation

1. Clone or extract the project
```bash
   cd cross-tab-dashboard
```

2. Install dependencies
```bash
   npm install
```

3. Start the development server
```bash
   npm run dev
```

4. Open in browser
   - Application will be available at `http://localhost:5173`
   - Open multiple tabs to see real-time synchronization

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🏗️ Architecture

### Project Structure
```
src/
├── components/          # React components
│   ├── UserPresence.tsx    # User list display
│   ├── SharedCounter.tsx   # Counter component
│   ├── Chat.tsx            # Chat interface
├── hooks/              # Custom React hooks
│   └── useCollaborativeSession.ts  # Main collaboration hook
├── types/              # TypeScript definitions
│   └── index.ts
├── utils/              # Utilities
│   └── helpers.ts
├── App.tsx             # Main component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## 📝 Implementation Notes

### Core Hook: `useCollaborativeSession`

The `useCollaborativeSession` hook manages all collaborative state and handles cross-tab communication:

- **State Management**: Manages users, messages, counter, and theme
- **Broadcast Communication**: Uses `react-broadcast-sync` to send/receive messages
- **Index-Based Message Tracking**: Uses last processed index to prevent duplicate handling and reprocessing
- **Automatic Cleanup**: Removes expired messages and manages timeouts
- **Optimistic Updates**: Local state updates immediately, then broadcasts to other tabs
- **Stable State Management**: Prevents random state changes during extended idle periods

### Key Implementation Decisions

1. **BroadcastChannel API**: Uses `react-broadcast-sync` which wraps the BroadcastChannel API for cross-tab communication
2. **State Synchronization**: Periodic SYNC_STATE messages (every 5 seconds) keep tabs synchronized
3. **Message Expiration**: Each message can have an optional expiration time, with automatic cleanup using setTimeout
4. **Index-Based Duplicate Prevention**: Tracks the last processed message index instead of individual IDs for memory efficiency and reliability
5. **Deleted Message Tracking**: Keeps track of deleted message IDs to prevent them from reappearing via sync
6. **Optimistic UI**: All actions update local state immediately for instant feedback
7. **Smart Initialization**: New tabs listen for existing state without sending empty initial state

### Important Technical Details

- **Ref-based State**: Uses refs to avoid dependency issues in callbacks
- **Timeout Management**: Tracks and cleans up all timeouts on unmount
- **Event Listeners**: Clears typing indicator when window loses focus
- **Memory Efficient**: Index tracking uses O(1) space vs O(n) for ID sets
- **No Message Reprocessing**: Index-based approach prevents old messages from being reprocessed after accumulation

### Broadcast Message Types
```typescript
USER_JOIN          // User joined the session
USER_LEAVE         // User left the session
USER_TYPING        // User typing status
SEND_MESSAGE       // New message
DELETE_MESSAGE     // Message deleted
INCREMENT_COUNTER  // Counter incremented
DECREMENT_COUNTER  // Counter decremented
TOGGLE_THEME       // Theme changed
SYNC_STATE         // Full state synchronization
```

### Performance Considerations

- All message processing happens in useEffect with proper dependency management
- Intervals and timeouts are properly cleaned up on unmount
- State updates use functional form when accessing previous state
- No unnecessary re-renders through careful use of refs and memoization
- Index-based tracking prevents memory growth and ensures stable long-running sessions
- Messages are processed only once, preventing duplicate actions

## 🔧 Technical Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **react-broadcast-sync** - Cross-tab communication
- **Lucide React** - Icons