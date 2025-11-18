// API Configuration
const API_BASE_URL = 'http://localhost:8080'

// Types matching the FastAPI backend
export interface ParsedCommand {
  action: string
  resource: string
  provider: string
  tool: string
  parameters: Record<string, any>
}

export interface ExecutionStatus {
  isRunning: boolean
  isComplete: boolean
  success: boolean
  message: string
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  parsedCommand?: ParsedCommand
  summary?: string
  executionStatus?: ExecutionStatus
  // New fields for API integration
  intentId?: string
  decisionId?: string
  decisionOptions?: Array<{ id: string; label: string; description?: string }>
  isDecision?: boolean
  rawContent?: string // For code blocks, artifacts, etc.
  eventType?: 'log' | 'token' | 'artifact' | 'operation_update' | 'decision'
}

export interface Decision {
  id: string
  sessionId: string
  kind: string
  prompt: string
  options: Array<{ id: string; label: string; description?: string }>
  metadata: Record<string, any>
}

export const useChat = () => {
  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  const sessionId = ref<string | null>(null)
  const eventSource = ref<EventSource | null>(null)
  const currentDecision = ref<Decision | null>(null)
  const currentIntent = ref<any>(null)

  // Create session on mount
  const createSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      sessionId.value = data.session_id
      connectSSE()
      return data.session_id
    } catch (error) {
      console.error('Failed to create session:', error)
      return null
    }
  }

  // Connect to SSE stream
  const connectSSE = () => {
    if (!sessionId.value) return

    // Close existing connection
    if (eventSource.value) {
      eventSource.value.close()
    }

    const url = `${API_BASE_URL}/sessions/${sessionId.value}/events`
    eventSource.value = new EventSource(url)

    eventSource.value.addEventListener('ready', () => {
      console.log('SSE connected')
    })

    eventSource.value.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        handleEvent(data)
      } catch (error) {
        console.error('Failed to parse SSE event:', error)
      }
    })

    eventSource.value.onerror = (error) => {
      console.error('SSE error:', error)
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (sessionId.value) {
          connectSSE()
        }
      }, 3000)
    }
  }

  // Handle different event types from the API
  const handleEvent = (event: any) => {
    const { type, payload } = event

    switch (type) {
      case 'log':
        // Optionally show logs in UI
        if (payload.level === 'info' && payload.role === 'user') {
          // User message logged - we already added it
        }
        break

      case 'token':
        // Streaming text tokens
        if (payload.text) {
          const lastMessage = messages.value[messages.value.length - 1]
          if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.isDecision) {
            lastMessage.content += payload.text
          } else {
            addMessage(payload.text, 'assistant', {
              eventType: 'token'
            })
          }
        }
        break

      case 'artifact':
        // Intent parsed, decision cards, etc.
        if (payload.kind === 'intent') {
          const intent = payload.data.intent
          currentIntent.value = intent
          
          // Update or create message with parsed intent
          const intentMessage = addMessage('', 'assistant', {
            intentId: payload.data.intent_id,
            parsedCommand: {
              action: intent.action || '',
              resource: intent.resource || '',
              provider: intent.provider || '',
              tool: intent.tool || '',
              parameters: intent.params || {}
            },
            summary: `Reviewing summary ~ ${intent.action} ${intent.resource}`,
            eventType: 'artifact'
          })
        } else if (payload.kind === 'intent_for_edit') {
          // Show edit mode
          currentIntent.value = payload.data.intent
          addMessage('✏️ You can now edit parameters (e.g., region, instance_type, tags) and send a param_update message.', 'assistant')
        }
        break

      case 'operation_update':
        // Status updates (parsing, executing, etc.)
        if (payload.status === 'running') {
          isLoading.value = true
          if (payload.kind === 'intent_parse') {
            const lastMessage = messages.value[messages.value.length - 1]
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = '🔄 Parsing intent...'
            } else {
              addMessage('🔄 Parsing intent...', 'assistant')
            }
          }
        } else if (payload.status === 'succeeded' || payload.status === 'failed') {
          isLoading.value = false
          if (payload.kind === 'infra_execute') {
            const lastMessage = messages.value[messages.value.length - 1]
            if (lastMessage) {
              lastMessage.executionStatus = {
                isRunning: false,
                isComplete: true,
                success: payload.status === 'succeeded',
                message: payload.detail || (payload.status === 'succeeded' ? 'Operation completed successfully' : 'Operation failed')
              }
            }
          }
        }
        break

      case 'decision':
        // Decision card (run/edit/cancel)
        const decision = payload as Decision
        currentDecision.value = decision
        
        const decisionMessage = addMessage('', 'assistant', {
          decisionId: decision.id,
          isDecision: true,
          parsedCommand: decision.metadata.intent ? {
            action: decision.metadata.intent.action || '',
            resource: decision.metadata.intent.resource || '',
            provider: decision.metadata.intent.provider || '',
            tool: decision.metadata.intent.tool || '',
            parameters: decision.metadata.intent.params || {}
          } : undefined,
          summary: decision.prompt,
          decisionOptions: decision.options,
          eventType: 'decision'
        })
        break
    }
  }

  const addMessage = (content: string, role: 'user' | 'assistant', extra?: Partial<Message>) => {
    const message: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      content,
      role,
      timestamp: new Date(),
      ...extra
    }
    messages.value.push(message)
    return message
  }

  const updateMessage = (id: string, updates: Partial<Message>) => {
    const index = messages.value.findIndex(m => m.id === id)
    if (index !== -1) {
      messages.value[index] = { ...messages.value[index], ...updates }
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading.value) return

    // Ensure session exists
    if (!sessionId.value) {
      await createSession()
    }

    // Add user message
    addMessage(content, 'user')

    // Send to API
    isLoading.value = true
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId.value}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      // Events will come via SSE
    } catch (error) {
      console.error('Failed to send message:', error)
      addMessage('❌ Failed to send message. Please try again.', 'assistant')
      isLoading.value = false
    }
  }

  const resolveDecision = async (decisionId: string, optionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: optionId })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      // Update message to show decision was made
      const message = messages.value.find(m => m.decisionId === decisionId)
      if (message) {
        message.isDecision = false
        if (optionId === 'run') {
          message.executionStatus = {
            isRunning: true,
            isComplete: false,
            success: false,
            message: 'Running...'
          }
        } else if (optionId === 'cancel') {
          message.content = '🛑 Operation cancelled. No infra command was run.'
          message.executionStatus = {
            isRunning: false,
            isComplete: true,
            success: false,
            message: 'Cancelled'
          }
        }
      }
    } catch (error) {
      console.error('Failed to resolve decision:', error)
      addMessage('❌ Failed to process decision. Please try again.', 'assistant')
    }
  }

  const sendParamUpdate = async (intentId: string, paramOverrides: Record<string, any>) => {
    if (!sessionId.value) return

    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId.value}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'param_update',
          intent_id: intentId,
          param_overrides: paramOverrides
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to send param update:', error)
      addMessage('❌ Failed to update parameters. Please try again.', 'assistant')
    }
  }

  const executeCommand = async (messageId: string) => {
    const message = messages.value.find(m => m.id === messageId)
    if (!message || !message.decisionId) return

    await resolveDecision(message.decisionId, 'run')
  }

  const clearChat = () => {
    messages.value = []
    if (eventSource.value) {
      eventSource.value.close()
      eventSource.value = null
    }
    sessionId.value = null
    createSession()
  }

  // Initialize on first use
  onMounted(() => {
    createSession()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (eventSource.value) {
      eventSource.value.close()
    }
  })

  return {
    messages: readonly(messages),
    isLoading: readonly(isLoading),
    sendMessage,
    executeCommand,
    resolveDecision,
    sendParamUpdate,
    clearChat,
    currentIntent: readonly(currentIntent)
  }
}
