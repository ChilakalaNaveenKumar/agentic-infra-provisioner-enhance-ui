# Vue.js/Nuxt.js Integration with FastAPI Backend

This Vue.js/Nuxt.js chat interface integrates with the Agentic Infrastructure Provisioner FastAPI backend.

## Setup Instructions

### 1. Backend Setup

Make sure the FastAPI server is running:

```bash
cd /Users/chilakalanaveenkumar/agentic-infra-provisioner-enhance
export $(cat .env | xargs)
python3 -m uvicorn api_app:app --reload --host 0.0.0.0 --port 8080
```

### 2. Enable CORS in FastAPI

The FastAPI backend needs CORS enabled to accept requests from the Vue.js frontend. Add this to `api_app.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Nuxt dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Frontend Setup

Install dependencies (if not already done):

```bash
cd /Users/chilakalanaveenkumar/HSBC
npm install
```

### 4. Run the Frontend

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 5. Configure API URL

If your backend runs on a different port or host, update the `API_BASE_URL` in `composables/useChat.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8080'  // Change if needed
```

## Features

- ✅ Real-time chat via Server-Sent Events (SSE)
- ✅ Agent decision cards with Run/Edit/Cancel buttons
- ✅ Intent parsing and display
- ✅ Parameter editing support
- ✅ Execution status tracking
- ✅ Message history
- ✅ Same UI layout as Chainlit

## API Integration

The frontend uses these endpoints:

- `POST /sessions` - Create a new session
- `GET /sessions/{session_id}/events` - SSE stream for real-time events
- `POST /sessions/{session_id}/messages` - Send user messages
- `POST /decisions/{decision_id}/resolve` - Resolve decisions (run/edit/cancel)

## Event Types Handled

- `log` - Log messages (optional display)
- `token` - Streaming text tokens
- `artifact` - Intent data, decision cards
- `operation_update` - Status updates (parsing, executing)
- `decision` - Decision cards requiring user action

## Troubleshooting

1. **CORS errors**: Make sure CORS is enabled in FastAPI (see step 2)
2. **SSE not connecting**: Check that the backend is running on port 8080
3. **Messages not appearing**: Check browser console for errors
4. **Decisions not working**: Verify the decision_id is being passed correctly

