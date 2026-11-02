import { useProgress } from './store';
import { level, mastery, type Bucket } from './model';

export const useLevel = (id: string, bucket: Bucket = 'topics') => useProgress((s) => level(s.data[bucket][id]));
export const useMastery = (id: string, bucket: Bucket = 'topics') => useProgress((s) => mastery(s.data[bucket][id]));
export const useData = () => useProgress((s) => s.data);
