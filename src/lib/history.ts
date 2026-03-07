export type UploadEntry = {
  txHash: string;
  filename: string;
  timestamp: string;
};

const HISTORY_KEY = 'shelby_upload_history';

export function getHistory(): UploadEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Failed to read history from localStorage', error);
    return [];
  }
}

export function addToHistory(entry: Omit<UploadEntry, 'timestamp'>) {
  if (typeof window === 'undefined') return;
  const history = getHistory();
  const newEntry = { ...entry, timestamp: new Date().toISOString() };
  // Add to the beginning of the array and keep the last 100 entries
  const newHistory = [newEntry, ...history].slice(0, 100);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    window.dispatchEvent(new Event('storage')); // Dispatch event to notify other components
  } catch (error) {
    console.error('Failed to save history to localStorage', error);
  }
}
