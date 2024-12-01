const DB_NAME = 'KioskDB'
const STORE_NAME = 'products'
const DB_VERSION = 1

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'name' })
      }
    }
  })
}

export const getProducts = async () => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()
    
    request.onsuccess = () => {
      resolve(request.result.sort((a, b) => a.name.localeCompare(b.name)))
    }
    request.onerror = () => reject(request.error)
  })
}

export const updateProduct = async (product) => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const isProductValid = typeof product.valid === 'boolean';
    const productValidity = isProductValid ? product.valid : true;
    
    // Create a clean object with only the needed properties
    const cleanProduct = {
      name: product.name,
      price: Number(product.price), // Ensure price is a number
      valid: productValidity
    };
    
    const request = store.put(cleanProduct);
    
    request.onsuccess = () => {
      subscribers.forEach(callback => callback(cleanProduct));
      resolve(cleanProduct);
    };
    request.onerror = () => reject(request.error);
  });
};

// Helper to normalize product names
const normalizeProductName = (name) => {
  return name.trim();
}

export const initializeProducts = async (productNames) => {
  const db = await initDB();
  
  return new Promise(async (resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    transaction.oncomplete = () => {
      console.log('Transaction completed successfully');
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
    
    const existingProductsRequest = store.getAll();
    
    existingProductsRequest.onsuccess = () => {
      const existingNames = new Set(
        existingProductsRequest.result.map(p => normalizeProductName(p.name))
      );
      
      // Create Set of normalized new names
      const uniqueNewProducts = new Set(
        productNames.map(name => normalizeProductName(name))
      );
      
      console.log('Existing products:', existingNames);
      console.log('New unique products:', uniqueNewProducts);
      
      // Add only truly new products
      Array.from(uniqueNewProducts)
        .filter(name => !existingNames.has(name))
        .forEach(name => {
          console.log('Adding new product:', name);
          store.add({ name, price: 0, valid: true });
        });
    };
  });
};

export const exportProducts = async () => {
  const products = await getProducts();
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kiosk-products.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importProducts = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const products = JSON.parse(event.target.result);
        const db = await initDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // Clear existing products
        await store.clear();
        
        // Add imported products
        for (const product of products) {
          await store.add(product);
        }
        
        resolve(await getProducts());
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

// Create a subscription system for product updates
const subscribers = new Set();

export const subscribeToProductUpdates = (callback) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback); // Return unsubscribe function
};
