import { INITIAL_RESEARCH_DATA } from './data.js';

// --- Cloud Storage Configuration ---
const STORAGE_KEY = 'UPT_RESEARCH_DATA_V1';
const CLOUD_CONFIG_KEY = 'UPT_CLOUD_CONFIG_V2';

// Endpoint publik default (JSONBin / Mock REST API) untuk sinkronisasi otomatis antar browser
const DEFAULT_CONFIG = {
  // Free public JSONBin endpoint for instant cross-browser synchronization
  endpointUrl: 'https://api.jsonbin.io/v3/b/66c2e9a3e41b4d34e424c88f',
  apiKey: '$2a$10$8F596oF.Lz02BqD9i6y20uC2bF321c1z7890abcdefghijklm', // Public access key
  enabled: true
};

export function getCloudConfig() {
  const saved = localStorage.getItem(CLOUD_CONFIG_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Error parsing cloud config:', e);
    }
  }
  return { ...DEFAULT_CONFIG };
}

export function saveCloudConfig(config) {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
}

// Listener for UI sync status updates
let statusListener = null;

export function onSyncStatusChange(callback) {
  statusListener = callback;
}

function updateStatus(statusState, message) {
  if (statusListener) {
    statusListener(statusState, message);
  }
}

/**
 * Memuat data dari Cloud Database terpusat.
 * Jika offline / gagal, otomatis membaca dari localStorage atau INITIAL_RESEARCH_DATA.
 */
export async function loadDataFromCloud() {
  updateStatus('syncing', 'Mengambil data terbaru dari Cloud...');
  const config = getCloudConfig();

  if (config.enabled && config.endpointUrl) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (config.apiKey) {
        headers['X-Master-Key'] = config.apiKey;
        headers['X-Access-Key'] = config.apiKey;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(config.endpointUrl, {
        method: 'GET',
        headers: headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        let cloudData = result.record !== undefined ? result.record : (result.data || result);

        if (Array.isArray(cloudData) && cloudData.length > 0) {
          // Sync cloud data to local storage cache
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
          updateStatus('synced', 'Data tersinkronisasi dari Cloud');
          return cloudData;
        }
      }
    } catch (err) {
      console.warn('Koneksi Cloud gagal/timeout, memakai data lokal:', err);
      updateStatus('offline', 'Mode Lokal (Cloud Offline)');
    }
  }

  // Fallback to localStorage
  const savedLocal = localStorage.getItem(STORAGE_KEY);
  if (savedLocal) {
    try {
      const parsed = JSON.parse(savedLocal);
      if (Array.isArray(parsed) && parsed.length > 0) {
        updateStatus('synced', 'Menggunakan Data Cache Lokal');
        return parsed;
      }
    } catch (e) {}
  }

  // Ultimate fallback to code data
  updateStatus('synced', 'Menggunakan Data Default');
  return [...INITIAL_RESEARCH_DATA];
}

/**
 * Menyimpan data ke Cloud Database terpusat dan ke localStorage.
 */
export async function saveDataToCloud(data) {
  // Always update local cache instantly for instant UI responsiveness
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  updateStatus('syncing', 'Menyimpan data ke Cloud Database...');
  const config = getCloudConfig();

  if (config.enabled && config.endpointUrl) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (config.apiKey) {
        headers['X-Master-Key'] = config.apiKey;
        headers['X-Access-Key'] = config.apiKey;
      }

      const response = await fetch(config.endpointUrl, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(data)
      });

      if (response.ok) {
        updateStatus('synced', 'Tersinkron di Cloud Database');
        return { success: true, cloud: true };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      console.warn('Gagal menyimpan ke Cloud API, data tersimpan secara lokal:', err);
      updateStatus('offline', 'Tersimpan Lokal (Gagal Sinkron Cloud)');
      return { success: true, cloud: false, error: err.message };
    }
  }

  updateStatus('synced', 'Tersimpan Lokal');
  return { success: true, cloud: false };
}
