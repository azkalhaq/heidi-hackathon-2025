'use client';

import { useState } from 'react';
import { X, CheckCircle2, Plus } from 'lucide-react';

interface VoiceActivityEntry {
  id: string;
  title: string;
  description: string;
  timestamp: string;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  timestamp?: string;
}

interface TasksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  voiceActivities: VoiceActivityEntry[];
  tasks: Task[];
  onAddTask?: () => void;
  onToggleTask?: (id: string) => void;
}

export default function TasksPanel({
  isOpen,
  onClose,
  voiceActivities,
  tasks,
  onAddTask,
  onToggleTask,
}: TasksPanelProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'activities'>('tasks');
  
  // Show tasks first (completed at top)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed && !b.completed) return -1;
    if (!a.completed && b.completed) return 1;
    return 0;
  });

  return (
    <aside
      className={`h-full bg-white border-l border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? 'w-80' : 'w-0'
      }`}
    >
      <div className={`flex flex-col h-full ${isOpen ? 'w-80' : 'w-0'}`}>
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
              <span className="px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded">
                Beta
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-t border-gray-200">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'text-purple-700 border-b-2 border-purple-700 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'activities'
                  ? 'text-purple-700 border-b-2 border-purple-700 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Voice activity
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'tasks' ? (
            sortedTasks.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500">No tasks yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sortedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`px-6 py-3 hover:bg-gray-50 transition-colors ${
                      task.completed ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onToggleTask?.(task.id)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 size={18} className="text-green-600" />
                        ) : (
                          <div className="w-[18px] h-[18px] border-2 border-gray-300 rounded-full" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            task.completed
                              ? 'text-gray-500 line-through'
                              : 'text-gray-900'
                          }`}
                        >
                          {task.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            voiceActivities.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500">No voice workflow activities yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {voiceActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="px-6 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <div className="w-[18px] h-[18px] border-2 border-purple-300 rounded-full bg-purple-50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">{activity.title}</p>
                        {activity.description && (
                          <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                        )}
                        {activity.timestamp && (
                          <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        {activeTab === 'tasks' && (
          <div className="border-t border-gray-200 px-6 py-4 flex-shrink-0 space-y-3">
            {onAddTask && (
              <button
                onClick={onAddTask}
                className="w-full flex items-center gap-2 text-sm text-purple-700 hover:text-purple-800 font-medium"
              >
                <Plus size={16} />
                <span>New task</span>
              </button>
            )}
            <p className="text-xs text-gray-500">
              Stale tasks will be archived in 30 days
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

