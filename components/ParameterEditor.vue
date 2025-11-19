<template>
  <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
    <h3 class="text-sm font-semibold text-gray-900 mb-3">✏️ Edit Parameters</h3>
    
    <div class="space-y-3">
      <div
        v-for="(value, key) in parameters"
        :key="key"
        class="flex items-center gap-3"
      >
        <label class="text-sm text-gray-700 w-32 flex-shrink-0">{{ key }}:</label>
        <input
          v-model="editedParams[key]"
          :type="getInputType(key, value)"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          :placeholder="String(value)"
        />
      </div>
    </div>

    <div class="flex gap-3 mt-4">
      <button
        @click="handleSave"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Save & Update
      </button>
      <button
        @click="$emit('cancel')"
        class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  parameters: Record<string, any>
  intentId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  save: [params: Record<string, any>]
  cancel: []
}>()

const editedParams = ref<Record<string, any>>({ ...props.parameters })

const getInputType = (key: string, value: any): string => {
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'checkbox'
  return 'text'
}

const handleSave = () => {
  emit('save', editedParams.value)
}
</script>

