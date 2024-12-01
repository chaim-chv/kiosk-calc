
<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-4 shadow-xl max-w-sm w-full mx-4">
      <h3 class="text-lg font-medium mb-4">הגדרות</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            תאריך התחלה ברירת מחדל
          </label>
          <input
            type="date"
            v-model="localSettings.defaultStartDate"
            class="w-full rounded-md border-gray-300"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            תאריך סיום ברירת מחדל
          </label>
          <input
            type="date"
            v-model="localSettings.defaultEndDate"
            class="w-full rounded-md border-gray-300"
          >
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <button 
          @click="close"
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
          ביטול
        </button>
        <button 
          @click="save"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          שמור
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import { getSettings } from '../settings-service';

const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'save']);

const localSettings = ref(getSettings());

const save = () => {
  emit('save', localSettings.value);
  close();
};

const close = () => {
  emit('update:modelValue', false);
};

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    localSettings.value = getSettings();
  }
});
</script>