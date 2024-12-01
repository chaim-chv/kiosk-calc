<template>
  <div dir="rtl" class="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 text-gray-900 dark:text-gray-100">
    <div class="max-w-7xl mx-auto">
      <div class="float-left flex gap-4 mb-4">
        <button @click="showSettingsModal = true" 
                class="bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-600 dark:hover:bg-gray-700 transition">
          הגדרות
        </button>
        <input type="file"
               accept=".zip"
               @change="handleFileUpload"
               class="text-sm text-gray-600 dark:text-gray-300
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-500 file:text-white
                      dark:file:bg-blue-600
                      hover:file:bg-blue-600 dark:hover:file:bg-blue-700
                      file:transition"
        >
        <button @click="showProductsModal = true" 
                class="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 dark:hover:bg-blue-700 transition">
          ניהול טבלת המוצרים
        </button>
      </div>
      <h1 class="text-4xl font-bold mb-8">ניתוח צ'אט קיוסק דירה</h1>
      
      <!-- Products Modal -->
      <ProductsModal 
        v-model="showProductsModal" 
        :products="products"
        @update-product="handleProductUpdate"
      />

      <!-- Add Settings Modal -->
      <SettingsModal 
        v-model="showSettingsModal"
        @save="handleSettingsSave"
      />

      <!-- Filters -->
      <div v-if="messages.length" class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Author Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              כותב ההודעה:
            </label>
            <select 
              v-model="selectedAuthor"
              class="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer">
            >
              <option value="">כולם, ללא סינון</option>
              <option v-for="author in authors" :key="author" :value="author">
                {{ author }}
              </option>
            </select>
          </div>

          <!-- Date Range Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              תאריך התחלה:
            </label>
            <input
              type="date"
              v-model="dateRange.start"
              class="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     [&::-webkit-calendar-picker-indicator]:cursor-pointer
                     [&::-webkit-calendar-picker-indicator]:dark:filter
                     [&::-webkit-calendar-picker-indicator]:dark:invert"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              תאריך סיום:
            </label>
            <input
              type="date"
              v-model="dateRange.end"
              class="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     [&::-webkit-calendar-picker-indicator]:cursor-pointer
                     [&::-webkit-calendar-picker-indicator]:dark:filter
                     [&::-webkit-calendar-picker-indicator]:dark:invert"
            >
          </div>
        </div>
      </div>

      <!-- Author Totals -->
      <div v-if="Object.keys(authorTotals).length" class="sticky top-0 bg-white rounded-lg shadow p-2 mb-2">
        <h2 class="text-xl font-semibold text-gray-700 mb-1">חישוב כללי:</h2>
        <div class="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-4 gap-1">
          <div v-for="(total, author) in authorTotals" :key="author" class="flex justify-between items-center p-1 border rounded">
            <span class="font-medium text-gray-600">{{ author }}</span>
            <span class="text-gray-600">₪{{ total.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- Messages Display -->
      <div v-if="filteredMessages.length" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <div v-for="(message, index) in filteredMessages" :key="index" 
             class="mb-4 p-3 rounded-lg" 
             :class="message.author === selectedAuthor ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-700/30'">
          <div class="text-sm text-gray-500">
            {{ formatDateTime(message.datetime) }} - <strong>{{ message.author }}</strong>
            <span v-if="message.isEdited" 
                  class="mr-1 inline-flex items-center text-gray-400" 
                  title="הודעה שנערכה">
              <svg xmlns="http://www.w3.org/2000/svg" 
                   viewBox="0 0 24 24" 
                   fill="currentColor" 
                   class="w-3.5 h-3.5">
                <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
              </svg>
            </span>
          </div>
          <div v-if="message.isMedia" class="text-blue-600 dark:text-blue-400">
            <div v-if="message.mediaUrl">
              <!-- Image preview -->
              <img v-if="message.mediaType === 'image'" 
                   :src="message.mediaUrl" 
                   class="max-w-md rounded-lg shadow-sm hover:shadow-lg transition-shadow"
                   :alt="message.content">
              
              <!-- Audio player -->
              <audio v-else-if="message.mediaType === 'audio'" 
                     controls 
                     class="mt-2">
                <source :src="message.mediaUrl" :type="message.mimeType">
              </audio>
              
              <!-- Fallback for other media types -->
              <div v-else>
                📎 Attachment: {{ message.content }}
              </div>
            </div>
            <div v-else>
              📎 Attachment: {{ message.content }} (not found in zip)
            </div>
          </div>
          <div v-else class="whitespace-pre-wrap">
            <div v-if="Array.isArray(message.texts)" v-for="(text, i) in message.texts" :key="i"
                 class="flex items-center justify-between gap-2 mb-1">
              <span>{{ text }}</span>

              <!-- Product Price Display and Edit -->
              <div v-if="getProductWholePriceFromText(text) !== null" 
                   class="flex items-center justify-end gap-2 min-w-[120px] text-sm">
                <button
                  v-if="getProductWholePriceFromText(text) === 0 && getProductFromText(text).valid"
                  @click="markProductAsInvalid(getProductFromText(text))"
                  class="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Mark as invalid">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-5a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1zm0-8a1 1 0 011-1h1a1 1 0 011-1V7a1 1 0 01-1-1h-1a1 1 0 01-1 1v1z" clip-rule="evenodd" />
                  </svg>
                </button>
                <span class="text-gray-600 dark:text-gray-300" 
                      :class="{ 'line-through text-gray-300 dark:text-gray-600': !getProductFromText(text).valid }">
                  <span v-if="getProductQuantityFromText(text) > 1">
                    (₪{{ getProductOneUnitPriceFromText(text) }} ליח' * {{ getProductQuantityFromText(text) }}) <strong>₪{{ getProductWholePriceFromText(text) }}</strong>
                  </span>
                  <span v-else>
                    <strong>₪{{ getProductWholePriceFromText(text) }}</strong>
                  </span>
                </span>
                <button 
                  @click="editProductPrice(getProductFromText(text))"
                  class="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Edit price">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>
            </div>
            <div v-else class="flex items-center justify-between gap-2">
              {{ message.texts }}

              <!-- Product Price Display and Edit -->
              <div v-if="getProductWholePriceFromText(message.texts) !== null" 
                   class="flex items-center gap-2 min-w-[80px] text-sm">
                <button
                  @click="markProductAsInvalid(getProductFromText(message.texts))"
                  class="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Mark as invalid">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-5a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1zm0-8a1 1 0 011 1h1a1 1 0 011-1V7a1 1 0 01-1-1h-1a1 1 0 01-1 1v1z" clip-rule="evenodd" />
                  </svg>
                </button>
                <span class="text-gray-600">
                  <span v-if="getProductQuantityFromText(message.texts) > 1">
                    ₪{{ getProductWholePriceFromText(message.texts) }} (₪{{ getProductOneUnitPriceFromText(message.texts) }} ליח')
                  </span>
                  <span v-else>
                    ₪{{ getProductWholePriceFromText(message.texts) }}
                  </span>
                </span>
                <button 
                  @click="editProductPrice(getProductFromText(message.texts))"
                  class="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Edit price">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p class="mt-4 text-gray-600">Processing chat data...</p>
      </div>
    </div>

    <div v-if="quickEditProduct !== null"
     class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
  <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
    <h3 class="text-lg font-medium mb-4">עדכון מחיר {{ quickEditProduct.name }}</h3>
    <div class="flex gap-2 items-center">
      <input 
        ref="priceInput"
        type="number" 
        v-model="quickEditProduct.price"
        @keydown.enter="saveQuickEdit"
        class="w-full rounded border-gray-300"
        min="0"
        step="0.1"
      >
      <span class="text-gray-600">₪</span>
    </div>
    <div>
      <label class="text-gray-600 flex items-center gap-2">
        <input 
          type="checkbox" 
          v-model="quickEditProduct.valid"
        > מוצר תקין
      </label>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button 
        @click="quickEditProduct = null"
        class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
        ביטול
      </button>
      <button 
        @click="saveQuickEdit"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        שמור
      </button>
    </div>
  </div>
</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import ProductsModal from './components/ProductsModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import { initDB, getProducts, updateProduct, initializeProducts, subscribeToProductUpdates } from './db-service'
import { getSettings, saveSettings } from './settings-service'
import JSZip from 'jszip'

const showSettingsModal = ref(false)
const showProductsModal = ref(false)

const messages = ref([])
const selectedAuthor = ref('')
const isLoading = ref(false)
const dateRange = ref({
  start: '',
  end: ''
})

// Store blob URLs to clean up later
const blobUrls = ref([])

// Clean up blob URLs on component unmount
onBeforeUnmount(() => {
  blobUrls.value.forEach(url => URL.revokeObjectURL(url))
})


// Compute unique authors from messages
const authors = computed(() => {
  const uniqueAuthors = new Set(messages.value.map(msg => msg.author))
  return Array.from(uniqueAuthors).sort()
})

const authorTotals = computed(() => {
  const totals = {};

  filteredMessages.value.forEach((message) => {
    if (message.isSystemMessage || message.isMedia) { return; }

    const author = message.author;
    if (!totals[author]) {
      totals[author] = 0;
    }

    const texts = Array.isArray(message.texts) ? message.texts : [message.texts];
    texts.forEach((text) => {
      const price = getProductWholePriceFromText(text);
      if (price !== null) {
        totals[author] += price;
      }
    });
  });

  const sortedTotals = Object.fromEntries(
    Object.entries(totals).sort(([, a], [, b]) => b - a)
  );
  
  return sortedTotals;
});

const products = ref([])

// Patterns to match different quantity formats
const patterns = [
  // Pattern: '2 במבה', '5 Apple'
  { regex: /^(\d+)\s+(.*)$/, quantityIndex: 1, nameIndex: 2 },
  // Pattern: 'פחית קולה * 3', 'Item * 3'
  { regex: /^(.*)\s*[*xX×]\s*(\d+)$/, quantityIndex: 2, nameIndex: 1 },
  // Pattern: 'קליק שקית X5', 'Item X5'
  { regex: /^(.*)\s*[xX×]\s*(\d+)$/, quantityIndex: 2, nameIndex: 1 },
  // Pattern: 'Item (3)'
  { regex: /^(.*)\s*\((\d+)\)$/, quantityIndex: 2, nameIndex: 1 },
];

const extractProductInfo = (text) => {
  let quantity = 1;
  let name = text.trim();

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      quantity = Number.parseInt(match[pattern.quantityIndex], 10);
      name = match[pattern.nameIndex].trim();
      break;
    }
  }

  // Normalize product name
  name = name.trim();

  return { name, quantity };
};

// Extract products function
const extractProducts = async () => {
  const productSet = new Set()
  
  messages.value.forEach(message => {
    if (!(message.isSystemMessage || message.isMedia)) {
      const texts = Array.isArray(message.texts) ? message.texts : [message.texts]
      texts.forEach(text => {
        const { name } = extractProductInfo(text)
        if (name) {
          productSet.add(name)
        }
      })
    }
  })

  await initializeProducts(Array.from(productSet))
  products.value = await getProducts()
}

const handleProductUpdate = async (product) => {
  await updateProduct(product)
}

// Replace the dateRange initialization with settings-based initialization
onMounted(async () => {
  const settings = getSettings();
  dateRange.value.start = settings.defaultStartDate || '';
  dateRange.value.end = settings.defaultEndDate || '';
  
  await initDB()
  products.value = await getProducts()
  
  // Subscribe to product updates
  const unsubscribe = subscribeToProductUpdates((updatedProduct) => {
    const index = products.value.findIndex(p => p.name === updatedProduct.name);
    if (index !== -1) {
      products.value[index] = updatedProduct;
    }
  });
  
  // Clean up subscription on unmount
  onBeforeUnmount(() => {
    unsubscribe();
  });
})

// Add settings handler
const handleSettingsSave = (newSettings) => {
  saveSettings(newSettings);
  dateRange.value.start = newSettings.defaultStartDate;
  dateRange.value.end = newSettings.defaultEndDate;
};

const getProductFromText = (text) => {
  const { name } = extractProductInfo(text)
  return products.value.find(p => p.name === name)
}

const getProductQuantityFromText = (text) => {
  const { quantity } = extractProductInfo(text)
  return quantity
}

const getProductWholePriceFromText = (text) => {
  const { name, quantity } = extractProductInfo(text)
  const product = getProductFromText(text)
  return product ? product.price * quantity : null
}

const getProductOneUnitPriceFromText = (text) => {
  const product = getProductFromText(text)
  return product ? product.price : null
}

const markProductAsInvalid = async (product) => {
  if (product) {
    product.valid = false
    await updateProduct(product)
  }
}

const quickEditProduct = ref(null)
const priceInput = ref(null)

const editProductPrice = (product) => {
  if (product) {
    quickEditProduct.value = { ...product }
    nextTick(() => {
      priceInput.value?.focus()
      priceInput.value?.select()
    })
  }
}

const saveQuickEdit = async () => {
  if (quickEditProduct.value) {
    try {
      const updatedProduct = await updateProduct({
        name: quickEditProduct.value.name,
        price: Number(quickEditProduct.value.price)
      });
      
      products.value = await getProducts();
      
      quickEditProduct.value = null;
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  }
};

// Filter messages based on selected author and date range
const filteredMessages = computed(() => {
  return messages.value.filter(message => {
    const matchesAuthor = !selectedAuthor.value || message.author === selectedAuthor.value
    
    const messageDate = new Date(message.datetime)
    const matchesDateRange = (!dateRange.value.start || messageDate >= new Date(dateRange.value.start)) &&
                           (!dateRange.value.end || messageDate <= new Date(dateRange.value.end))
    
    return matchesAuthor && matchesDateRange
  })
})

// Format date and time for display
const formatDateTime = (datetime) => {
  return new Date(datetime).toLocaleString('he-IL', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

// Handle file upload and parsing
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) { return }
  
  isLoading.value = true
  messages.value = []
  blobUrls.value.forEach(url => URL.revokeObjectURL(url))
  blobUrls.value = []
  
  try {
    const zip = await JSZip.loadAsync(file)
    const chatFile = zip.file('_chat.txt')
    
    if (!chatFile) {
      throw new Error('לא נמצא קובץ צאט')
    }
    
    const content = await chatFile.async('text')
    await parseChat(content, zip)
  } catch (error) {
    console.error('Error processing file:', error)
    alert('פענוח הקובץ לא הצליח. בדוק שזה באמת קובץ יצוא מצאט בווצאפ')
  } finally {
    isLoading.value = false
  }
}

const dateTimeRegex = /^\[(\d{2}\/\d{2}\/\d{4}), (\d{1,2}:\d{2}:\d{2})\] (.+?): ?(.*?)$/;
const mediaRegex = /^‎?<attached: (.+?)>$/;
const messageStartRegex = /^\[\d{2}\/\d{2}\/\d{4}/;

const parseChat = async (content, zip) => {
  const lines = content.split('\n');
  let currentMessage = null;
  messages.value = [];
  
  lines.forEach(line => {
    // Remove RTL markers and trim
    line = line.replace(/\u200e/g, '').trim();
    if (!line) { return; }

    const match = line.match(dateTimeRegex);

    if (match) {
      // Save previous message if exists
      if (currentMessage) {
        messages.value.push(currentMessage);
      }

      const [, dateStr, timeStr, author, content] = match;

      // Skip deleted messages
      if (content === "This message was deleted.") {
        currentMessage = null;
        return;
      }

      // Format time with leading zeros
      const timeParts = timeStr.split(':');
      const formattedTime = `${timeParts[0].padStart(2, '0')}:${timeParts[1]}:${timeParts[2]}`;

      // Convert date to ISO format
      const [day, month, year] = dateStr.split('/');
      const isoDateTime = `${year}-${month}-${day}T${formattedTime}`;

      const mediaMatch = content.match(mediaRegex);

      const originalMessageContent = content.trim();
      const isEdited = originalMessageContent.includes("<This message was edited>");
      const trimmedContent = originalMessageContent.replace("<This message was edited>", "").trim();

      currentMessage = {
        datetime: new Date(isoDateTime),
        author: author.trim(),
        texts: [trimmedContent],
        isMedia: !!mediaMatch,
        isEdited,
        isSystemMessage: author === 'קיוסק דירה' && content.includes('created') || content.includes('added')
      };

      if (mediaMatch) {
        currentMessage.content = mediaMatch[1];
      }
    } else if (currentMessage && !messageStartRegex.test(line)) {
      const trimmedLine = line.trim();
      const isEdited = trimmedLine.includes("<This message was edited>");
      if (isEdited) {
        currentMessage.isEdited = true;
        currentMessage.texts.push(trimmedLine.replace("<This message was edited>", "").trim());
      } else {
        currentMessage.texts.push(trimmedLine);
      }
    }
  });

  // Add last message
  if (currentMessage) {
    messages.value.push(currentMessage);
  }

  // Sort by date
  messages.value.sort((a, b) => a.datetime - b.datetime);

  // After parsing messages, process media attachments
  for (const message of messages.value) {
    if (message.isMedia) {
      const filename = message.content
      const mediaFile = zip.file(filename)
      
      if (mediaFile) {
        try {
          const blob = await mediaFile.async('blob')
          const url = URL.createObjectURL(blob)
          blobUrls.value.push(url)
          
          message.mediaUrl = url
          message.mediaType = getMediaType(filename)
          message.mimeType = getMimeType(filename)
        } catch (error) {
          console.error(`Error processing media file ${filename}:`, error)
        }
      }
    }
  }

  extractProducts()
};

// Helper functions for media type detection
const getMediaType = (filename) => {
  const ext = filename.toLowerCase().split('.').pop()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) { return 'image' }
  if (['mp3', 'opus', 'ogg', 'm4a', 'wav'].includes(ext)) { return 'audio' }
  return 'other'
}

const getMimeType = (filename) => {
  const ext = filename.toLowerCase().split('.').pop()
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp3: 'audio/mpeg',
    opus: 'audio/ogg',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    wav: 'audio/wav'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}
</script>
