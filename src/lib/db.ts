export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: number;
  dueDate: number | null;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

const DB_NAME = 'webtoapp-tasks';
const DB_VERSION = 1;
const STORE_NAME = 'tasks';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('completed', 'completed', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

export async function getAllTasks(): Promise<Task[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const tasks = req.result as Task[];
      resolve(tasks.sort((a, b) => b.createdAt - a.createdAt));
    };
  });
}

export async function getTask(id: string): Promise<Task | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as Task | undefined);
  });
}

export async function addTask(title: string, description = '', priority: 'low' | 'medium' | 'high' = 'medium'): Promise<Task> {
  const task: Task = {
    id: crypto.randomUUID(),
    title,
    description,
    completed: false,
    createdAt: Date.now(),
    dueDate: null,
    priority,
    tags: [],
  };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(task);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(task);
  });
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const task = await getTask(id);
  if (!task) throw new Error(`Task ${id} not found`);
  const updated = { ...task, ...updates, id };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(updated);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(updated);
  });
}

export async function deleteTask(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

export async function toggleTaskComplete(id: string): Promise<Task> {
  const task = await getTask(id);
  if (!task) throw new Error(`Task ${id} not found`);
  return updateTask(id, { completed: !task.completed });
}

export async function clearAllTasks(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}
