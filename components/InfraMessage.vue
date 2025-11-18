<template>
  <div class="flex items-start gap-3">
    <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
      <span class="text-yellow-600 text-sm">🧠</span>
    </div>
    <div class="flex-1">
      <!-- Agent Decision Card -->
      <div v-if="message.isDecision" class="bg-white border border-gray-200 rounded-lg p-6 mb-4">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">🧠 Agent decision</h2>

        <!-- Action Details Grid -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <div class="grid grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <div class="text-gray-500 text-xs uppercase tracking-wide mb-1">Action</div>
              <div class="font-semibold text-gray-900">{{ message.parsedCommand?.action || 'N/A' }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-xs uppercase tracking-wide mb-1">Resource</div>
              <div class="font-semibold text-gray-900">{{ message.parsedCommand?.resource || 'N/A' }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-xs uppercase tracking-wide mb-1">Provider</div>
              <div class="font-semibold text-gray-900">{{ message.parsedCommand?.provider || 'N/A' }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-xs uppercase tracking-wide mb-1">Tool</div>
              <div class="font-semibold text-gray-900">{{ message.parsedCommand?.tool || 'N/A' }}</div>
            </div>
          </div>

          <!-- Key Parameters -->
          <div v-if="message.parsedCommand?.parameters && Object.keys(message.parsedCommand.parameters).length > 0" class="border-t border-gray-200 pt-3">
            <div class="text-gray-500 text-xs uppercase tracking-wide mb-2">Key parameters:</div>
            <div class="space-y-1">
              <div
                v-for="(value, key) in message.parsedCommand.parameters"
                :key="key"
                class="text-sm"
              >
                <span class="text-gray-600">{{ key }} =</span>
                <span class="text-blue-600 ml-1 font-mono">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Decision Prompt -->
        <div class="mb-4 text-sm text-gray-700">
          {{ message.summary || message.content }}
        </div>

        <!-- Decision Buttons -->
        <div class="flex gap-3">
          <button
            v-for="option in message.decisionOptions"
            :key="option.id"
            @click="handleDecision(option.id)"
            :disabled="message.executionStatus?.isRunning"
            class="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            :class="getButtonClass(option.id)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Regular Intent Display (after decision resolved) -->
      <div v-else-if="message.parsedCommand" class="bg-white border border-gray-200 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">✅ Intent parsed.</h2>

        <!-- Action Details -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <div class="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div class="text-gray-500 text-xs uppercase tracking-wide mb-1">Action</div>
              <div class="font-semibold text-gray-900">{{ message.parsedCommand.action }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-xs uppercase tracking-wide mb-1">Resource</div>
              <div class="font-semibold text-gray-900">{{ message.parsedCommand.resource }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-xs uppercase tracking-wide mb-1">Provider</div>
              <div class="font-semibold text-gray-900">{{ message.parsedCommand.provider }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-xs uppercase tracking-wide mb-1">Tool</div>
              <div class="font-semibold text-gray-900">{{ message.parsedCommand.tool }}</div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div v-if="message.summary" class="mb-4 text-sm text-gray-700">
          {{ message.summary }}
        </div>

        <!-- Execution Status -->
        <div v-if="message.executionStatus" class="mt-4 space-y-3">
          <!-- Running -->
          <div
            v-if="message.executionStatus.isRunning"
            class="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 rounded-lg p-3"
          >
            <div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Running...</span>
          </div>

          <!-- Complete -->
          <div
            v-if="message.executionStatus.isComplete"
            class="flex items-center gap-2 text-sm border rounded-lg p-3"
            :class="message.executionStatus.success 
              ? 'text-gray-700 border-gray-200' 
              : 'text-red-700 border-red-200 bg-red-50'"
          >
            <div
              v-if="message.executionStatus.success"
              class="w-4 h-4 bg-green-500 rounded flex items-center justify-center flex-shrink-0"
            >
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <span>{{ message.executionStatus.message }}</span>
          </div>
        </div>
      </div>

      <!-- Regular Assistant Message -->
      <div v-else class="bg-white border border-gray-200 rounded-lg px-4 py-3">
        <p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">
          {{ message.content }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Message } from '~/composables/useChat'

interface Props {
  message: Message
}

const props = defineProps<Props>()
const emit = defineEmits<{
  execute: [messageId: string]
  resolveDecision: [decisionId: string, optionId: string]
}>()

const getButtonClass = (optionId: string) => {
  switch (optionId) {
    case 'run':
      return 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
    case 'edit':
      return 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
    case 'cancel':
      return 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
    default:
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }
}

const handleDecision = (optionId: string) => {
  if (props.message.decisionId) {
    emit('resolveDecision', props.message.decisionId, optionId)
  }
  
  if (optionId === 'run') {
    emit('execute', props.message.id)
  }
}
</script>
