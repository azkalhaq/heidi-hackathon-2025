'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface VoiceLogEntry {
  id: string;
  title: string;
  description: string;
  timestamp: string;
}

interface TasksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  noteContent: string | null;
  voiceLog: VoiceLogEntry[];
  onClearVoiceLog: () => void;
}

export default function TasksPanel({
  isOpen,
  onClose,
  noteContent,
  voiceLog,
  onClearVoiceLog,
}: TasksPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'voice'>('tasks');

  // Extract tasks from note content
  useEffect(() => {
    if (!noteContent || noteContent === 'No consult note is available yet.') {
      setTasks([]);
      return;
    }

    const extractedTasks: Task[] = [];
    const lowerNote = noteContent.toLowerCase();

    // Extract tasks from "Assessment & Plan" or "Plan" section
    const planSectionMatch = noteContent.match(
      /(?:assessment\s*[&\s]*plan|plan|management\s*plan)[:;]?\s*\n?(.*?)(?=\n\n|\n[A-Z][a-z]+\s*:|$)/is,
    );
    const planText = planSectionMatch ? planSectionMatch[1] : noteContent;

    // Look for numbered or bulleted items in plan section
    const listItemPatterns = [
      /\d+\.\s+([^\.\n]+(?:\.[^\.\n]+)*)/g, // Numbered lists: 1. task
      /[-•*]\s+([^\.\n]+(?:\.[^\.\n]+)*)/g, // Bullet points: - task or • task
      /^[A-Z][^\.\n]+(?:\.[^\.\n]+)*/gm, // Lines starting with capital (potential tasks)
    ];

    listItemPatterns.forEach((pattern) => {
      const matches = planText.matchAll(pattern);
      for (const match of matches) {
        let text = match[1] || match[0];
        text = text.trim();
        
        // Skip if too short or looks like a heading
        if (text.length < 15 || text.length > 200) continue;
        if (/^[A-Z\s]+$/.test(text) && text.length < 50) continue; // Likely a heading
        
        // Check if it's an actionable task
        const actionKeywords = [
          'prescribe', 'prescribed', 'prescription',
          'schedule', 'scheduled', 'appointment',
          'order', 'ordered', 'lab', 'test',
          'refer', 'referral', 'refer to',
          'arrange', 'arranged',
          'book', 'booked',
          'follow-up', 'follow up',
          'return', 'return to',
          'advise', 'advised', 'advice',
          'recommend', 'recommended',
          'perform', 'performed',
          'complete', 'completed',
          'start', 'started',
          'continue', 'continued',
          'discontinue', 'discontinued',
          'increase', 'decrease',
          'monitor', 'monitoring',
        ];
        
        const lowerText = text.toLowerCase();
        const isActionable = actionKeywords.some((keyword) =>
          lowerText.includes(keyword),
        );
        
        if (isActionable || /^(prescribe|schedule|order|refer|arrange|book)/i.test(text)) {
          // Clean up the text
          text = text.replace(/^\d+\.\s*/, '').replace(/^[-•*]\s*/, '').trim();
          
          // Capitalize first letter
          text = text.charAt(0).toUpperCase() + text.slice(1);
          
          // Remove trailing periods if multiple
          text = text.replace(/\.+$/, '');
          
          if (text.length >= 15 && text.length <= 200) {
            extractedTasks.push({
              id: `extracted-${Date.now()}-${Math.random()}`,
              text,
              completed: false,
            });
          }
        }
      }
    });

    // Look for specific task patterns with better context
    const taskPatterns = [
      {
        pattern: /(?:prescribe|prescribed)\s+([^\.]+?)(?:\.|$|,|\n)/gi,
        prefix: 'Prescribe',
      },
      {
        pattern: /(?:schedule|scheduled)\s+([^\.]+?)(?:\.|$|,|\n)/gi,
        prefix: 'Schedule',
      },
      {
        pattern: /(?:order|ordered)\s+(?:a\s+)?([^\.]+?)(?:\.|$|,|\n)/gi,
        prefix: 'Order',
      },
      {
        pattern: /(?:refer|referral|refer to)\s+([^\.]+?)(?:\.|$|,|\n)/gi,
        prefix: 'Refer to',
      },
      {
        pattern: /(?:arrange|arranged)\s+([^\.]+?)(?:\.|$|,|\n)/gi,
        prefix: 'Arrange',
      },
      {
        pattern: /(?:book|booked)\s+([^\.]+?)(?:\.|$|,|\n)/gi,
        prefix: 'Book',
      },
      {
        pattern: /(?:follow-up|follow up)\s+([^\.]+?)(?:\.|$|,|\n)/gi,
        prefix: 'Follow-up',
      },
    ];

    taskPatterns.forEach(({ pattern, prefix }) => {
      const matches = noteContent.matchAll(pattern);
      for (const match of matches) {
        let taskText = match[1]?.trim();
        if (taskText && taskText.length >= 10 && taskText.length <= 200) {
          // Clean up
          taskText = taskText.replace(/^(for|with|to)\s+/i, '').trim();
          taskText = taskText.charAt(0).toUpperCase() + taskText.slice(1);
          
          const fullText = `${prefix} ${taskText}`;
          
          // Check if similar task already exists
          const isDuplicate = extractedTasks.some(
            (task) =>
              task.text.toLowerCase() === fullText.toLowerCase() ||
              (task.text.toLowerCase().includes(taskText.toLowerCase()) &&
                taskText.length > 20),
          );
          
          if (!isDuplicate) {
            extractedTasks.push({
              id: `pattern-${Date.now()}-${Math.random()}`,
              text: fullText,
              completed: false,
            });
          }
        }
      }
    });

    // Remove duplicates and prioritize longer, more specific tasks
    const uniqueTasks = Array.from(
      new Map(extractedTasks.map((task) => [task.text.toLowerCase(), task])).values(),
    )
      .sort((a, b) => b.text.length - a.text.length) // Longer tasks first (usually more specific)
      .slice(0, 15); // Limit to 15 tasks

    setTasks(uniqueTasks);
  }, [noteContent]);

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      setTasks([
        ...tasks,
        {
          id: `manual-${Date.now()}-${Math.random()}`,
          text: newTaskText.trim(),
          completed: false,
        },
      ]);
      setNewTaskText('');
    }
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  return (
    <div
      className={`h-full bg-white border-l border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? 'w-80' : 'w-0'
      }`}
    >
      {isOpen && (
        <div className="flex flex-col h-full w-80">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Tasks Beta</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200 -mx-4 px-4">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'tasks'
                    ? 'text-purple-700 border-purple-700'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setActiveTab('voice')}
                className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'voice'
                    ? 'text-purple-700 border-purple-700'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Voice Activity
                {voiceLog.length > 0 && (
                  <span className="ml-1.5 bg-purple-600 text-white text-xs rounded-full px-1.5 py-0.5">
                    {voiceLog.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'tasks' ? (
              <div className="px-4 py-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                <p>No tasks found.</p>
                <p className="text-xs text-gray-400 mt-2">
                  Tasks will be extracted from your note.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-start gap-3 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300 group-hover:border-purple-400'
                        }`}
                      >
                        {task.completed && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm flex-1 ${
                        task.completed
                          ? 'text-gray-400 line-through'
                          : 'text-gray-900'
                      }`}
                    >
                      {task.text}
                    </span>
                  </label>
                ))}
              </div>
            )}
              </div>
            ) : (
              <div className="px-4 py-4">
                {voiceLog.length > 0 ? (
                  <>
                    <div className="flex items-center justify-end mb-3">
                      <button
                        className="text-xs text-gray-500 hover:text-gray-800"
                        onClick={onClearVoiceLog}
                      >
                        Clear
                      </button>
                    </div>
                    <ul className="space-y-3">
                      {voiceLog.map((entry) => (
                        <li
                          key={entry.id}
                          className="border border-gray-200 rounded-md px-3 py-2"
                        >
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>{entry.timestamp}</span>
                            <span>Voice agent</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {entry.title}
                          </p>
                          <p className="text-sm text-gray-700">{entry.description}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <p className="text-sm text-gray-500">
                      No automated actions yet.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Voice commands will appear here when executed.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add Task (only show on Tasks tab) */}
          {activeTab === 'tasks' && (
            <div className="px-4 py-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={handleAddTask}
              className="text-sm text-purple-700 hover:text-purple-800 font-medium flex items-center gap-2 mb-3"
            >
              <Plus size={16} />
              <span>New task</span>
            </button>
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a task..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-400 mt-3">
              Stale tasks will be archived in 30 days
            </p>
          </div>
          )}
        </div>
      )}
    </div>
  );
}

