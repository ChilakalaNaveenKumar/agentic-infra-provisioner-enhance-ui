<template>
  <div
    class="flex items-start space-x-3"
    :class="message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''"
  >
    <!-- Avatar -->
    <div
      class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg"
    >
      <span v-if="message.role === 'user'">👤</span>
      <span v-else>🤖</span>
    </div>

    <!-- Message Content -->
    <div
      class="flex-1 max-w-[80%] rounded-lg px-4 py-3"
      :class="
        message.role === 'user'
          ? 'bg-blue-50 border border-blue-200 text-gray-800'
          : 'bg-white border border-gray-200 text-gray-800'
      "
    >
      <p class="whitespace-pre-wrap break-words text-sm leading-relaxed">{{ message.content }}</p>
      <p
        class="text-xs mt-2 opacity-60 text-gray-500"
      >
        {{ formatTime(message.timestamp) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Message } from '~/composables/useChat'

interface Props {
  message: Message
}

const props = defineProps<Props>()

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}
</script>

