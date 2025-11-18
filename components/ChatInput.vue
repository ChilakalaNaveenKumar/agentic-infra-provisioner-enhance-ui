<template>
  <div class="p-4 border-t border-gray-100">
    <div class="max-w-3xl mx-auto">
      <div class="relative">
        <input
          ref="inputRef"
          v-model="inputText"
          type="text"
          @keydown.enter.prevent="handleSend"
          placeholder="e.g., create a deployment with image=nginx:1.28 replicas=2"
          class="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          :class="isLoading ? 'opacity-50 cursor-not-allowed' : ''"
          :disabled="isLoading"
        />
        <button
          @click="handleSend"
          :disabled="!inputText.trim() || isLoading"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isLoading: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  send: [message: string]
}>()

const inputText = ref('')
const inputRef = ref<HTMLInputElement>()

const handleSend = () => {
  if (!inputText.value.trim() || props.isLoading) return

  emit('send', inputText.value.trim())
  inputText.value = ''
}

watch(() => props.isLoading, (newVal) => {
  if (!newVal) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

const setExample = (example: string) => {
  inputText.value = example
  nextTick(() => {
    inputRef.value?.focus()
  })
}

defineExpose({
  setExample
})
</script>
