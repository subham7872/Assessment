import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
import TaskCard from './TaskCard';
import BulkTaskActions from './BulkTaskActions';
import useTaskStore from '../../store/taskStore';
import useProjectStore from '../../store/projectStore';
import useUIStore from '../../store/uiStore';
import useAuth from '../../hooks/useAuth';
import Spinner from '../common/Spinner';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/formatters';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-100 border-slate-300' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-sky-50 border-sky-200' },
  { id: 'review', title: 'In Review', color: 'bg-amber-50 border-amber-200' },
  { id: 'completed', title: 'Completed', color: 'bg-emerald-50 border-emerald-200' },
];

const TaskBoard = ({ projectId }) => {
  const {
    tasks,
    filters,
    setFilters,
    fetchTasks,
    deleteTask,
    isLoading,
  } = useTaskStore();

  const members = useProjectStore((state) => state.members);
  const { setCreateTaskModalOpen } = useUIStore();
  const { canMutateTasks, isAdmin } = useAuth();

  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    fetchTasks(projectId);
  }, [projectId, filters]);

  // Debounced search input handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleToggleSelect = (taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(projectId, taskId);
      toast.success('Task deleted successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search tasks by title..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={filters.priority || ''}
            onChange={(e) => setFilters({ priority: e.target.value, page: 1 })}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="critical">Critical Priority</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={filters.assignee || ''}
            onChange={(e) => setFilters({ assignee: e.target.value, page: 1 })}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Assignees</option>
            {members.map((m) => {
              const u = m.user;
              if (!u) return null;
              const id = u._id || u.id || u;
              return (
                <option key={id} value={id}>
                  {u.name || u.email}
                </option>
              );
            })}
          </select>
        </div>

        {/* Action Button */}
        {canMutateTasks && (
          <button
            onClick={() => setCreateTaskModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm rounded-lg shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkTaskActions
        projectId={projectId}
        selectedTaskIds={selectedTaskIds}
        onClearSelection={handleClearSelection}
      />

      {/* Task Board Columns */}
      {isLoading && tasks.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col min-h-[500px]"
              >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {col.title}
                  </h3>
                  <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      projectId={projectId}
                      isSelected={selectedTaskIds.includes(task._id)}
                      onToggleSelect={handleToggleSelect}
                      onDeleteTask={handleDeleteTask}
                    />
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
