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
  isEditMode?: boolean // Show parameter editor
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
        console.log('SSE event received:', JSON.stringify(data, null, 2))
        handleEvent(data)
      } catch (error) {
        console.error('Failed to parse SSE event:', error, 'Raw data:', event.data)
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
    // The SSE event structure is: { "id": ..., "session_id": ..., "type": ..., "payload": ..., "timestamp": ... }
    // But it might also be wrapped as: { "data": { "type": ..., "payload": ... } }
    let eventType = event.type
    let payload = event.payload
    
    // If it's wrapped in a "data" field, unwrap it
    if (event.data && event.data.type) {
      eventType = event.data.type
      payload = event.data.payload || event.data
    }
    
    // If payload is the whole event, extract type and payload
    if (!eventType && payload && payload.type) {
      eventType = payload.type
      payload = payload.payload || payload
    }
    
    console.log('Handling event type:', eventType, 'Payload:', JSON.stringify(payload, null, 2))

    switch (eventType) {
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
          
          // Check if we already have a decision message for this intent - if so, don't create duplicate
          const existingDecision = messages.value.find(m => 
            m.isDecision && 
            m.parsedCommand?.action === intent.action &&
            m.parsedCommand?.resource === intent.resource
          )
          
          if (!existingDecision) {
            // Only create new intent message if there's no existing decision
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
          }
        } else if (payload.kind === 'intent_for_edit') {
          // Show edit mode - find and convert the decision message to edit mode
          currentIntent.value = payload.data.intent
          
          // Find the decision message by matching the intent
          const decisionMessage = messages.value.find(m => 
            m.isDecision && 
            m.parsedCommand?.action === payload.data.intent.action &&
            m.parsedCommand?.resource === payload.data.intent.resource
          )
          
          if (decisionMessage) {
            // Convert decision message to edit mode
            decisionMessage.isDecision = false
            decisionMessage.isEditMode = true
            decisionMessage.intentId = payload.data.intent_id
            decisionMessage.parsedCommand = {
              action: payload.data.intent.action || '',
              resource: payload.data.intent.resource || '',
              provider: payload.data.intent.provider || '',
              tool: payload.data.intent.tool || '',
              parameters: payload.data.intent.params || {}
            }
            decisionMessage.content = '✏️ Edit Parameters'
            decisionMessage.decisionOptions = undefined
            console.log('Converted decision message to edit mode:', decisionMessage.id)
          } else {
            // Create new edit message if no decision message found
            console.log('No decision message found, creating new edit message')
            addMessage('', 'assistant', {
              intentId: payload.data.intent_id,
              isEditMode: true,
              parsedCommand: {
                action: payload.data.intent.action || '',
                resource: payload.data.intent.resource || '',
                provider: payload.data.intent.provider || '',
                tool: payload.data.intent.tool || '',
                parameters: payload.data.intent.params || {}
              },
              content: '✏️ Edit Parameters',
              eventType: 'artifact'
            })
          }
        } else if (payload.kind === 'infra_result') {
          // Show execution result
          const result = payload.data.result || ''
          const stdout = payload.data.stdout || ''
          const lastMessage = messages.value[messages.value.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.rawContent = result + (stdout ? '\n\n' + stdout : '')
            lastMessage.executionStatus = {
              isRunning: false,
              isComplete: true,
              success: true,
              message: 'Operation completed'
            }
          } else {
            addMessage(result + (stdout ? '\n\n' + stdout : ''), 'assistant', {
              rawContent: result + (stdout ? '\n\n' + stdout : ''),
              executionStatus: {
                isRunning: false,
                isComplete: true,
                success: true,
                message: 'Operation completed'
              }
            })
          }
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
        // Payload structure from API: { decision_id, kind, prompt, options, metadata }
        console.log('Decision event received, full payload:', JSON.stringify(payload, null, 2))
        
        // Extract decision_id - it should be directly in payload
        const decisionId = payload.decision_id
        const decisionPrompt = payload.prompt || ''
        const decisionOptions = payload.options || []
        const decisionMetadata = payload.metadata || {}
        const decisionIntent = decisionMetadata.intent || {}
        
        console.log('Extracted decision ID:', decisionId)
        console.log('Extracted options:', decisionOptions)
        
        if (!decisionId) {
          console.error('No decision_id found in payload! Full event:', event, 'Payload:', payload)
          addMessage('❌ Error: Could not extract decision ID from event.', 'assistant')
          break
        }
        
        // Validate decision ID is a UUID format (not just a number)
        if (decisionId.length < 10) {
          console.error('Invalid decision ID format:', decisionId, 'Expected UUID')
          addMessage('❌ Error: Invalid decision ID format.', 'assistant')
          break
        }
        
        currentDecision.value = {
          id: decisionId,
          sessionId: sessionId.value || '',
          kind: payload.kind || '',
          prompt: decisionPrompt,
          options: decisionOptions,
          metadata: decisionMetadata
        } as Decision
        
        const decisionMessage = addMessage('', 'assistant', {
          decisionId: decisionId,
          isDecision: true,
          parsedCommand: decisionIntent ? {
            action: decisionIntent.action || '',
            resource: decisionIntent.resource || '',
            provider: decisionIntent.provider || '',
            tool: decisionIntent.tool || '',
            parameters: decisionIntent.params || {}
          } : undefined,
          summary: decisionPrompt,
          decisionOptions: decisionOptions,
          eventType: 'decision'
        })
        
        console.log('Created decision message with ID:', decisionMessage.id, 'Decision ID:', decisionId)
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
    console.log('resolveDecision called with:', { decisionId, optionId, decisionIdType: typeof decisionId, optionIdType: typeof optionId })
    
    // Validate inputs
    if (!decisionId || typeof decisionId !== 'string') {
      console.error('Invalid decision ID:', decisionId, typeof decisionId)
      addMessage('❌ Error: Invalid decision ID.', 'assistant')
      return
    }
    
    if (!optionId || typeof optionId !== 'string') {
      console.error('Invalid option ID:', optionId, typeof optionId)
      addMessage('❌ Error: Invalid option ID.', 'assistant')
      return
    }
    
    // Validate decision ID is a UUID (should be at least 36 characters for UUID)
    if (decisionId.length < 30) {
      console.error('Decision ID too short, expected UUID:', decisionId)
      addMessage('❌ Error: Decision ID format invalid.', 'assistant')
      return
    }
    
    try {
      const url = `${API_BASE_URL}/decisions/${decisionId}/resolve`
      const body = { option_id: optionId }
      console.log('Calling API:', url, 'with body:', body)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: optionId })
      })

      console.log('API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error:', response.status, errorText)
        throw new Error(`API error: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('API response:', result)

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
      } else {
        console.warn('Message not found for decision ID:', decisionId)
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

