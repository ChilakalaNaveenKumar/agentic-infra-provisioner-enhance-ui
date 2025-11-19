<template>
  <div class="flex h-screen bg-white font-sans">
    <!-- Sidebar -->
    <Sidebar @use-example="handleExample" @new-chat="clearChat" />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <div class="flex justify-end items-center p-4 border-b border-gray-100">
        <button class="text-gray-600 hover:text-gray-900 font-medium text-sm">
          Deploy
        </button>
        <button class="ml-4 text-gray-400 hover:text-gray-600">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
          </svg>
        </button>
      </div>

      <!-- Message List -->
      <MessageList
        :messages="messages"
        :is-loading="isLoading"
        @execute="executeCommand"
        @resolve-decision="handleResolveDecision"
        @save-params="handleSaveParams"
        @cancel-edit="handleCancelEdit"
      />

      <!-- Input Area -->
      <ChatInput @send="sendMessage" :is-loading="isLoading" ref="chatInputRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { messages, isLoading, sendMessage, executeCommand, resolveDecision, sendParamUpdate, clearChat } = useChat()
const chatInputRef = ref()

const handleExample = (example: string) => {
  if (chatInputRef.value) {
    chatInputRef.value.setExample(example)
  }
}

const handleResolveDecision = (decisionId: string, optionId: string) => {
  console.log('ChatContainer: handleResolveDecision called with:', { decisionId, optionId })
  if (!decisionId || decisionId.length < 10) {
    console.error('Invalid decision ID received:', decisionId)
    return
  }
  resolveDecision(decisionId, optionId)
}

const handleSaveParams = (intentId: string, params: Record<string, any>) => {
  sendParamUpdate(intentId, params)
  // Remove edit mode from message
  const message = messages.value.find(m => m.intentId === intentId)
  if (message) {
    message.isEditMode = false
  }
}

const handleCancelEdit = (messageId: string) => {
  const message = messages.value.find(m => m.id === messageId)
  if (message) {
    message.isEditMode = false
  }
}
</script>
