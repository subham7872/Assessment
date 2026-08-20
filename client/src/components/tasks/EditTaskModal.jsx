import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import useTaskStore from '../../store/taskStore';
import useProjectStore from '../../store/projectStore';
import useUIStore from '../../store/uiStore';
import { getSocket } from '../../socket/socket';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/formatters';

const EditTaskModal = ({ projectId }) => {
  const { isEditTaskModalOpen, setEditTaskModalOpen } = useUIStore();
  const { selectedTask, updateTask } = useTaskStore();
  const members = useProjectStore((state) => state.members);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (selectedTask) {
      const firstAssignee = selectedTask.assignees?.[0];
      const assigneeId = firstAssignee?._id || firstAssignee || '';

      const dueDateFormatted = selectedTask.dueDate
        ? new Date(selectedTask.dueDate).toISOString().split('T')[0]
        : '';

      reset({
        title: selectedTask.title,
        description: selectedTask.description || '',
        status: selectedTask.status || 'todo',
        priority: selectedTask.priority || 'medium',
        assignee: assigneeId,
        dueDate: dueDateFormatted,
      });

      // Emit task:editing socket presence
      const socket = getSocket();
      if (socket) {
        socket.emit('task:editing', { projectId, taskId: selectedTask._id });
      }
    }

    return () => {
      if (selectedTask) {
        const socket = getSocket();
        if (socket) {
          socket.emit('task:stopped_editing', { projectId, taskId: selectedTask._id });
        }
      }
    };
  }, [selectedTask, reset, projectId]);

  const onSubmit = async (data) => {
    if (!selectedTask) return;
    setLoading(true);
    try {
      const payload = {
        ...data,
        assignees: data.assignee ? [data.assignee] : [],
      };
      delete payload.assignee;

      await updateTask(projectId, selectedTask._id, payload);
      toast.success('Task updated successfully!');
      setEditTaskModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!selectedTask) return null;

  return (
    <Modal
      isOpen={isEditTaskModalOpen}
      onClose={() => setEditTaskModalOpen(false)}
      title="Edit Task"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Title
          </label>
          <input
            type="text"
            {...register('title', {
              required: 'Title is required',
              maxLength: { value: 200, message: 'Title cannot exceed 200 characters' },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {errors.title && (
            <p className="text-rose-600 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            {...register('description', {
              maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {errors.description && (
            <p className="text-rose-600 text-xs mt-1">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignee
            </label>
            <select
              {...register('assignee')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="">Unassigned</option>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setEditTaskModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditTaskModal;
