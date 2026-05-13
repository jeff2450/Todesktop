import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as db from '../lib/db';
import type { Task } from '../lib/db';

interface TaskContextValue {
  tasks: Task[];
  loading: boolean;
  addTask: (title: string, description?: string, priority?: 'low' | 'medium' | 'high') => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const TaskContext = createContext<TaskContextValue>({
  tasks: [],
  loading: true,
  addTask: async () => {},
  updateTask: async () => {},
  deleteTask: async () => {},
  toggleComplete: async () => {},
  refresh: async () => {},
});

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const all = await db.getAllTasks();
    setTasks(all);
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const addTask = async (title: string, description = '', priority: 'low' | 'medium' | 'high' = 'medium') => {
    const task = await db.addTask(title, description, priority);
    setTasks((prev) => [task, ...prev]);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const task = await db.updateTask(id, updates);
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
  };

  const deleteTask = async (id: string) => {
    await db.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleComplete = async (id: string) => {
    const task = await db.toggleTaskComplete(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
  };

  return (
    <TaskContext.Provider value={{ tasks, loading, addTask, updateTask, deleteTask, toggleComplete, refresh }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  return useContext(TaskContext);
}
