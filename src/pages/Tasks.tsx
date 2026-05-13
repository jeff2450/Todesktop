import { useState } from 'react';
import { Plus, Trash2, Check, Box, LogOut, Calendar, Flag, Tag, X, Edit2, Save } from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import type { Task } from '../lib/db';

interface Props {
  onLanding: () => void;
}

const priorityColors = {
  low: 'bg-blue-900/30 text-blue-300 border-blue-800/40',
  medium: 'bg-yellow-900/30 text-yellow-300 border-yellow-800/40',
  high: 'bg-red-900/30 text-red-300 border-red-800/40',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

function formatDate(ts: number | null) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function Tasks({ onLanding }: Props) {
  const { tasks, addTask, updateTask, deleteTask, toggleComplete, loading } = useTask();
  const { signOut } = useAuth();
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [search, setSearch] = useState('');

  async function handleAdd() {
    if (!newTitle.trim()) return;
    await addTask(newTitle.trim(), newDesc.trim(), newPriority);
    setNewTitle('');
    setNewDesc('');
    setNewPriority('medium');
  }

  async function handleSaveEdit(id: string) {
    if (!editTitle.trim()) return;
    await updateTask(id, { title: editTitle.trim(), description: editDesc.trim(), priority: editPriority });
    setEditingId(null);
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditPriority(task.priority);
  }

  const filtered = tasks
    .filter((t) => {
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    })
    .filter((t) => {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    });

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    active: tasks.filter((t) => !t.completed).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={onLanding}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-100 transition-colors"
          >
            <Box className="w-5 h-5 text-blue-400" />
            <span className="font-semibold tracking-tight text-white">Tasks</span>
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Tasks</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span>{stats.total} total</span>
            <span>·</span>
            <span>{stats.active} active</span>
            <span>·</span>
            <span>{stats.completed} completed</span>
          </div>
        </div>

        {/* Add task */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <div className="space-y-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Add a new task..."
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-colors"
            />
            <div className="flex gap-2">
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="flex-1 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-colors"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Filter and search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="flex-1 bg-gray-900 border border-gray-800 text-gray-100 rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-colors"
          />
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  filter === f
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {search ? 'No tasks match your search' : 'No tasks yet. Add one to get started!'}
            </div>
          ) : (
            filtered.map((task) => (
              <div
                key={task.id}
                className={`group flex items-start gap-3 p-4 rounded-lg border transition-all ${
                  task.completed
                    ? 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-lg hover:shadow-blue-500/10'
                }`}
              >
                <button
                  onClick={() => toggleComplete(task.id)}
                  className={`mt-1 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    task.completed
                      ? 'bg-green-600 border-green-600'
                      : 'border-gray-600 hover:border-green-500'
                  }`}
                >
                  {task.completed && <Check className="w-3 h-3 text-white" />}
                </button>

                {editingId === task.id ? (
                  <div className="flex-1 space-y-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as 'low' | 'medium' | 'high')}
                        className="bg-gray-800 border border-gray-700 text-gray-100 rounded px-2 py-1 text-xs"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <button
                        onClick={() => handleSaveEdit(task.id)}
                        className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${task.completed ? 'text-gray-600 line-through' : 'text-white'}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className={`text-xs mt-1 ${task.completed ? 'text-gray-700' : 'text-gray-400'}`}>
                          {task.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1 ${priorityColors[task.priority]}`}>
                          <Flag className="w-2.5 h-2.5" />
                          {priorityLabels[task.priority]}
                        </span>
                        {task.dueDate && (
                          <span className="px-2 py-1 rounded text-xs text-gray-400 bg-gray-800 border border-gray-700 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.tags.length > 0 && (
                          <div className="flex gap-1">
                            {task.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="px-2 py-1 rounded text-xs text-blue-300 bg-blue-900/30 border border-blue-800/30 flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5" />
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 2 && (
                              <span className="px-2 py-1 text-xs text-gray-500">+{task.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => startEdit(task)}
                        className="p-2 hover:bg-gray-800 rounded transition-colors text-gray-500 hover:text-gray-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 hover:bg-red-900/30 hover:text-red-400 rounded transition-colors text-gray-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
