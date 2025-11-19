<template>
  <div class="w-72 border-r border-gray-200 p-6 flex-shrink-0 overflow-y-auto">
    <!-- Logo and Title -->
    <div class="mb-6">
      <h1 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <span>&#x1F32E;</span>
        <span>Agentic Infra Provisioner — UI</span>
      </h1>
      <p class="text-sm text-gray-500 mt-1">
        Natural-language → Terraform / boto3 / kubectl
      </p>
    </div>

    <!-- Divider -->
    <div class="border-t border-gray-200 my-4"></div>

    <!-- Tips Section -->
    <div>
      <h2 class="text-sm font-medium text-gray-700 mb-3">Tips</h2>

      <ul class="space-y-4 text-sm">
        <!-- AWS Tips -->
        <li>
          <span class="font-medium text-gray-900">AWS:</span>
          <span
            class="text-blue-600 cursor-pointer hover:underline"
            @click="$emit('use-example', 'list ec2')"
          > list ec2</span>
          <span class="text-gray-600">,</span>
          <span
            class="text-blue-600 cursor-pointer hover:underline"
            @click="$emit('use-example', 'list eks clusters')"
          > list eks clusters</span>
          <span class="text-gray-600">,</span>
          <span
            class="text-blue-600 cursor-pointer hover:underline"
            @click="$emit('use-example', 'replicate staging from dev ec2')"
          > replicate staging from dev ec2</span>
          <span class="text-gray-600">,</span>
          <span
            class="text-blue-600 cursor-pointer hover:underline"
            @click="$emit('use-example', 'plan ec2 name=demo')"
          > plan ec2 name=demo</span>
        </li>

        <!-- K8s Tips -->
        <li>
          <span class="font-medium text-gray-900">K8s:</span>
          <span
            class="text-blue-600 cursor-pointer hover:underline"
            @click="$emit('use-example', 'create pod name=nginx image=nginx')"
          > create pod name=nginx image=nginx</span>
          <span class="text-gray-600">,</span>
          <span
            class="text-blue-600 cursor-pointer hover:underline"
            @click="$emit('use-example', 'create deployment image=nginx:1.28 replicas=2')"
          > create deployment image=nginx:1.28 replicas=2</span>
          <span class="text-gray-600">,</span>
          <span
            class="text-blue-600 cursor-pointer hover:underline"
            @click="$emit('use-example', 'scale deployment web to 3')"
          > scale deployment web to 3</span>
          <span class="text-gray-600">,</span>
          <span
            class="text-blue-600 cursor-pointer hover:underline"
            @click="$emit('use-example', 'list pods in ns default')"
          > list pods in ns default</span>
          <span class="text-gray-600">,</span>
          <span
            class="text-blue-600 cursor-pointer hover:underline"
            @click="$emit('use-example', 'rollback deployment web')"
          > rollback deployment web</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'use-example': [example: string]
  'new-chat': []
}>()
</script>


