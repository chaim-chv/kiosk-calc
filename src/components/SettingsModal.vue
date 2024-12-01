<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
      <h3 class="text-xl font-semibold mb-6 dark:text-white">הגדרות</h3>
      
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            תאריך התחלה ברירת מחדל
          </label>
          <input
            type="date"
            v-model="localSettings.defaultStartDate"
            class="w-full rounded-lg border dark:border-gray-600 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                   px-4 py-2
                   [&::-webkit-calendar-picker-indicator]:cursor-pointer
                   [&::-webkit-calendar-picker-indicator]:dark:filter
                   [&::-webkit-calendar-picker-indicator]:dark:invert"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            תאריך סיום ברירת מחדל
          </label>
          <input
            type="date"
            v-model="localSettings.defaultEndDate"
            class="w-full rounded-lg border dark:border-gray-600 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                   px-4 py-2
                   [&::-webkit-calendar-picker-indicator]:cursor-pointer
                   [&::-webkit-calendar-picker-indicator]:dark:filter
                   [&::-webkit-calendar-picker-indicator]:dark:invert"
          >
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button 
          @click="close"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
          ביטול
        </button>
        <button 
          @click="save"
          class="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition">
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