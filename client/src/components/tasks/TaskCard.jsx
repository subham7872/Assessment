import React from 'react';
import {
  Calendar,
  Paperclip,
  User as UserIcon,
  Edit2,
  Trash2,
  Eye,
  Edit3,
} from 'lucide-react';
import useTaskStore from '../../store/taskStore';
import useUIStore from '../../store/uiStore';
import useAuth from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatters';
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
} from '../../utils/constants';

const TaskCard = ({
  task,
  projectId,
  isSelected,
  onToggleSelect,
  onDeleteTask,
}) => {
  const { setSelectedTask, presence, updateTask } = useTaskStore();
  const {
    setEditTaskModalOpen,
    setTaskDetailsModalOpen,
  } = useUIStore();
  const { canMutateTasks, isAdmin } = useAuth();

  const viewingUsers = presence.viewing[task._id] || [];
  const editingUsers = presence.editing[task._id] || [];

  const handleOpenDetails = () => {
    setSelectedTask(task);
    setTaskDetailsModalOpen(true);
  };

  const handleOpenEdit = (e) => {
    e.stopPropagation();
    setSelectedTask(task);
    setEditTaskModalOpen(true);
  };

  const handleStatusChange = async (e) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    try {
      await updateTask(projectId, task._id, { status: newStatus });
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div
      onClick={handleOpenDetails}
      className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative group ${
        isSelected ? 'border-sky-500 ring-2 ring-sky-200' : 'border-gray-200 hover:border-sky-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start space-x-2 min-w-0">
          {canMutateTasks && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect(task._id);
              }}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
          )}
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
            {task.title}
          </h4>
        </div>

        <span
          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
            TASK_PRIORITY_COLORS[task.priority]
          }`}
        >
          {TASK_PRIORITY_LABELS[task.priority] || task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Presence Indicators */}
      {(viewingUsers.length > 0 || editingUsers.length > 0) && (
        <div className="flex items-center space-x-2 text-[10px] text-sky-700 bg-sky-50 px-2 py-1 rounded mb-3">
          {viewingUsers.length > 0 && (
            <span className="flex items-center space-x-1">
              <Eye className="w-3 h-3 text-sky-600" />
              <span>{viewingUsers[0].userName} viewing</span>
            </span>
          )}
          {editingUsers.length > 0 && (
            <span className="flex items-center space-x-1 text-amber-700">
              <Edit3 className="w-3 h-3 text-amber-600" />
              <span>{editingUsers[0].userName} editing</span>
            </span>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          {task.dueDate && (
            <div className="flex items-center space-x-1 text-gray-600">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center space-x-1 text-gray-600">
              <Paperclip className="w-3.5 h-3.5 text-gray-400" />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Status Change for Members */}
          {canMutateTasks ? (
            <select
              value={task.status}
              onChange={handleStatusChange}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-medium bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="completed">Completed</option>
            </select>
          ) : (
            <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded capitalize">
              {task.status.replace('_', ' ')}
            </span>
          )}

          {/* Mutation Action Buttons */}
          {canMutateTasks && (
            <button
              onClick={handleOpenEdit}
              className="p-1 text-gray-400 hover:text-sky-600 rounded transition-colors"
              title="Edit Task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task._id);
              }}
              className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
