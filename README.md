# Agentic Infrastructure Provisioner - Enhanced UI

A modern chat interface for the Agentic Infrastructure Provisioner, built with Nuxt.js 3. This frontend provides a ChatGPT-like experience for interacting with the infrastructure provisioning system, featuring real-time streaming, decision cards, and intent parsing.

## Features

- ✅ Real-time chat via Server-Sent Events (SSE)
- ✅ Agent decision cards with Run/Edit/Cancel buttons
- ✅ Intent parsing and display
- ✅ Parameter editing support
- ✅ Execution status tracking
- ✅ Message history with timestamps
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Auto-scrolling to latest messages
- ✅ Loading states and animations
- ✅ Modern, clean UI similar to ChatGPT
- ✅ TypeScript support
- ✅ Tailwind CSS for styling

## Tech Stack

- **Nuxt 3** - Vue.js framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Vue 3 Composition API** - Modern Vue development

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
HSBC/
├── components/
│   ├── ChatContainer.vue    # Main chat container
│   ├── MessageList.vue      # Scrollable message list
│   ├── Message.vue          # Individual message component
│   ├── InfraMessage.vue     # Infrastructure-specific message display
│   ├── ChatInput.vue        # Floating input box
│   └── Sidebar.vue          # Sidebar component
├── composables/
│   └── useChat.ts           # Chat state management and API integration
├── assets/
│   └── css/
│       └── main.css         # Global styles
├── app.vue                  # Root component
├── nuxt.config.ts           # Nuxt configuration
├── INTEGRATION_GUIDE.md     # Backend integration guide
└── package.json             # Dependencies
```

## Usage

- Type a message in the input box at the bottom
- Press `Enter` to send the message
- Press `Shift + Enter` for a new line
- Review and interact with agent decision cards
- Edit parameters before execution if needed
- The interface automatically scrolls to show the latest messages

## Backend Integration

This frontend integrates with the Agentic Infrastructure Provisioner FastAPI backend. See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed setup instructions.

### Quick Start

1. Ensure the FastAPI backend is running on `http://localhost:8080`
2. Start the frontend: `npm run dev`
3. Open `http://localhost:3000` in your browser

### API Endpoints Used

- `POST /sessions` - Create a new session
- `GET /sessions/{session_id}/events` - SSE stream for real-time events
- `POST /sessions/{session_id}/messages` - Send user messages
- `POST /decisions/{decision_id}/resolve` - Resolve decisions (run/edit/cancel)

## License

MIT

