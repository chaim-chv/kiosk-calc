<template>
  <Transition name="modal">
    <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-30" @click="$emit('update:modelValue', false)"></div>
        
        <!-- Modal -->
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-semibold">ניהול מוצרים</h2>
            <div class="flex gap-2">
              <button @click="exportProducts" 
                      class="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                ייצוא מוצרים
              </button>
              <input
                type="file"
                ref="fileInput"
                accept=".json"
                class="hidden"
                @change="handleImport"
              >
              <button @click="$refs.fileInput.click()" 
                      class="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                ייבוא מוצרים
              </button>
              <button @click="$emit('update:modelValue', false)" 
                      class="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Search Input -->
          <div class="relative mb-4 flex w-full flex-wrap items-stretch">
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="חפש מוצר..."
              class="relative m-0 block flex-auto rounded-s border p-2 py-[0.25rem]"
            >
            <button @click="searchQuery = ''" class="flex items-center whitespace-nowrap rounded-e border p-2 py-[0.25rem]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Counters and filters -->
          <div class="flex items-center gap-4 mb-4">
            <span class="text-gray-600">מספר מוצרים: {{ filteredProducts.length }}</span>
            <span class="border rounded flex items-center cursor-pointer">
              <span class="px-2 py-1 border-l hover:brightness-95" :class="{ 'bg-blue-200': showAll, 'bg-blue-50': !showAll }" @click="showAllF()">
                הכל
              </span>
              <span class="px-2 py-1 border-l hover:brightness-95" :class="{ 'bg-red-200': showOnlyZeros, 'bg-red-50': !showOnlyZeros }" @click="showOnlyZerosF()">
                ללא מחיר
              </span>
              <span class="px-2 py-1 hover:brightness-95" :class="{ 'bg-green-200': showOnlyPriced, 'bg-green-50': !showOnlyPriced }" @click="showOnlyPricedF()">
                עם מחיר
              </span>
            </span>
            <span class="border rounded flex items-center cursor-pointer">
              <span class="px-2 py-1 border-l hover:brightness-95" :class="{ 'bg-blue-200': showAllValidities, 'bg-blue-50': !showAllValidities }" @click="showAllValiditiesF()">
                הכל 
              </span>
              <span class="px-2 py-1 border-l hover:brightness-95" :class="{ 'bg-red-200': showOnlyInvalids, 'bg-red-50': !showOnlyInvalids }" @click="showOnlyInvalidsF()">
                לא תקינים
              </span>
              <span class="px-2 py-1 hover:brightness-95" :class="{ 'bg-green-200': showOnlyValids, 'bg-green-50': !showOnlyValids }" @click="showOnlyValidsF()">
                תקינים
              </span>
            </span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="product in filteredProducts" :key="product.name" 
                 class="flex items-center space-x-1 p-2 gap-2 border rounded hover:bg-gray-50 cursor-pointer"
                 @click="focusAndSelectInput($event, product)">
              <span class="p-1 rounded border hover:brightness-105 cursor-pointer"
                    @click="product.valid = !product.valid; handleProductUpdate(product)"
                    :class="{
                      'bg-green-200 border-green-400': product.valid,
                      'bg-red-200 border-red-400': !product.valid
                    }"
                    tooltip="לחץ לשינוי תקינות המוצר">
                {{ product.valid ? '✓' : '✗' }}
                  </span>
              <span class="flex-grow">{{ product.name }}</span>
              <div class="flex items-center justify-end gap-2">
                <input 
                  type="number"
                  :ref="el => { if (el) inputRefs[product.name] = el }"
                  v-model="product.price"
                  @change="handleProductUpdate(product)"
                  class="w-12 rounded border-gray-300"
                  min="0"
                  step="0.1"
                >
                <span class="text-gray-600">₪</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { exportProducts as exportProductsDB, importProducts } from '../db-service'

const props = defineProps({
  modelValue: Boolean,
  products: Array
})
const emit = defineEmits(['update:modelValue', 'update-product'])

const searchQuery = ref('')

const showAll = ref(true)
const showOnlyZeros = ref(false)
const showOnlyPriced = ref(false)

const showAllF = () => {
  showAll.value = true
  showOnlyZeros.value = false
  showOnlyPriced.value = false
}

const showOnlyZerosF = () => {
  showAll.value = false
  showOnlyZeros.value = true
  showOnlyPriced.value = false
}

const showOnlyPricedF = () => {
  showAll.value = false
  showOnlyZeros.value = false
  showOnlyPriced.value = true
}

const showAllValidities = ref(true)
const showOnlyValids = ref(false)
const showOnlyInvalids = ref(false)

const showAllValiditiesF = () => {
  showAllValidities.value = true
  showOnlyValids.value = false
  showOnlyInvalids.value = false
}

const showOnlyValidsF = () => {
  showAllValidities.value = false
  showOnlyValids.value = true
  showOnlyInvalids.value = false
}

const showOnlyInvalidsF = () => {
  showAllValidities.value = false
  showOnlyValids.value = false
  showOnlyInvalids.value = true
}

const inputRefs = ref([])

// Filter products based on search query
const filteredProducts = computed(() => {
  const products = showOnlyZeros.value ? props.products.filter(product => product.price === 0) : props.products
  const productsFiltered = showOnlyInvalids.value ? products.filter(product => !product.valid) : products.filter(product => product.valid)
  if (!searchQuery.value) {
    return productsFiltered
  }
  const query = searchQuery.value;
  return productsFiltered.filter(product => product.name.includes(query))
})

const handleProductUpdate = (product) => {
  emit('update-product', product)
}

const focusAndSelectInput = async (event, product) => {
  event.preventDefault()
  await nextTick()
  const input = inputRefs.value[product.name]
  if (input) {
    input.focus()
    input.select()
  }
}

const handleImport = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  try {
    const updatedProducts = await importProducts(file);
    props.products.splice(0, props.products.length, ...updatedProducts);
    event.target.value = ''; // Reset file input
  } catch (error) {
    console.error('Import failed:', error);
    alert('Failed to import products. Please check the file format.');
  }
};

const exportProducts = () => {
  exportProductsDB();
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
