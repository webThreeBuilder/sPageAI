import { GenerationVersion } from '@/types/generation';

const STORAGE_KEY = 'generation-history';
const MAX_HISTORY = 10;

export const historyManager = {
  getHistory(): GenerationVersion[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log('getHistory', stored);
    return stored ? JSON.parse(stored) : [];
  },

  saveVersion(version: GenerationVersion) {
    const history = this.getHistory();
    const newHistory = [version, ...history].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    return newHistory;
  },

  clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
  }
};