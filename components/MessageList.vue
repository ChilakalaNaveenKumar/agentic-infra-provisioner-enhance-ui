<template>
  <div
    ref="messagesContainer"
    class="flex-1 overflow-y-auto p-6"
  >
    <!-- Empty State -->
    <div v-if="messages.length === 0" class="flex items-center justify-center h-full">
      <div class="text-center text-gray-400">
        <span class="text-6xl mb-4 block">🧠</span>
        <p class="text-lg font-medium text-gray-500">Agentic Infrastructure Provisioner</p>
        <p class="text-sm mt-2 text-gray-400">Type a command below to begin</p>
        <p class="text-xs mt-4 text-gray-400">
          Examples: "list ec2 instances", "create deployment name=web image=nginx:1.28 replicas=2"
        </p>
      </div>
    </div>

    <!-- Messages -->
    <div class="max-w-3xl mx-auto space-y-6">
      <template v-for="message in messages" :key="message.id">
        <!-- User Message -->
        <div v-if="message.role === 'user'" class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span class="text-blue-600 text-sm">👤</span>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-gray-800">
            {{ message.content }}
          </div>
        </div>

        <!-- Assistant Message with Parsed Command or Decision -->
        <InfraMessage
          v-else-if="message.parsedCommand || message.isDecision"
          :message="message"
          @execute="$emit('execute', $event)"
          @resolve-decision="$emit('resolveDecision', $event[0], $event[1])"
        />

        <!-- Regular Assistant Message -->
        <div v-else class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <span class="text-yellow-600 text-sm">🧠</span>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 flex-1">
            <p class="whitespace-pre-wrap break-words text-sm leading-relaxed">{{ message.content }}</p>
          </div>
        </div>
      </template>

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
          <span class="text-yellow-600 text-sm">🧠</span>
        </div>
        <div class="bg-gray-100 rounded-lg px-4 py-3 flex-1">
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600">Thinking...</span>
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Message } from '~/composables/useChat'

interface Props {
  messages: Message[]
  isLoading: boolean
}

const props = defineProps<Props>()

defineEmits<{
  execute: [messageId: string]
  resolveDecision: [decisionId: string, optionId: string]
}>()

const messagesContainer = ref<HTMLElement>()

watch(
  () => props.messages.length,
  () => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }
)

watch(
  () => props.messages,
  () => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  },
  { deep: true }
)

onMounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
})
</script>
