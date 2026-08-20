import React, { useState } from 'react';
import { CheckSquare, UserPlus, Trash2, X } from 'lucide-react';
import useTaskStore from '../../store/taskStore';
import useProjectStore from '../../store/projectStore';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/formatters';

const BulkTaskActions = ({
  projectId,
  selectedTaskIds,
  onClearSelection,
}) => {
  const { bulkUpdateStatus, bulkAssign, bulkDelete } = useTaskStore();
  const members = useProjectStore((state) => state.members);
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);

  if (selectedTaskIds.length === 0) return null;

  const handleBulkStatusChange = async (e) => {
    const status = e.target.value;
    if (!status) return;
    setLoading(true);
    try {
      await bulkUpdateStatus(projectId, selectedTaskIds, status);
      toast.success(`Updated ${selectedTaskIds.length} tasks!`);
      onClearSelection();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleBulkAssignChange = async (e) => {
    const assigneeId = e.target.value;
    if (!assigneeId) return;
    setLoading(true);
    try {
      await bulkAssign(
        projectId,
        selectedTaskIds,
        assigneeId ? [assigneeId] : []
      );
      toast.success(`Assigned ${selectedTaskIds.length} tasks!`);
      onClearSelection();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedTaskIds.length} tasks?`
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await bulkDelete(projectId, selectedTaskIds);
      toast.success(`Deleted ${selectedTaskIds.length} tasks!`);
      onClearSelection();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center space-x-3">
        <span className="bg-sky-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
          {selectedTaskIds.length} Selected
        </span>
        <p className="text-sm font-medium text-slate-300">Bulk Actions:</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Status Dropdown */}
        <select
          onChange={handleBulkStatusChange}
          disabled={loading}
          defaultValue=""
          className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="" disabled>
            Set Status...
          </option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">In Review</option>
          <option value="completed">Completed</option>
        </select>

        {/* Assignee Dropdown */}
        <select
          onChange={handleBulkAssignChange}
          disabled={loading}
          defaultValue=""
          className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="" disabled>
            Assign To...
          </option>
          {members.map((m) => {
            const u = m.user;
            if (!u) return null;
            const id = u._id || u.id || u;
            return (
              <option key={id} value={id}>
                {u.name || u.email || 'User'}
              </option>
            );
          })}
        </select>

        {/* Delete (Admin only) */}
        {isAdmin && (
          <button
            onClick={handleBulkDelete}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>
        )}

        <button
          onClick={onClearSelection}
          className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
          title="Clear Selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default BulkTaskActions;
