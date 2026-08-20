import { create } from 'zustand';
import * as taskApi from '../api/taskApi';

const defaultFilters = {
  status: '',
  priority: '',
  assignee: '',
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 50,
};

const useTaskStore = create((set, get) => ({
  tasks: [],
  selectedTask: null,
  filters: { ...defaultFilters },
  pagination: { total: 0, page: 1, totalPages: 1 },
  presence: { viewing: {}, editing: {} }, // taskId -> Array of userNames/IDs
  isLoading: false,
  error: null,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
  },

  setSelectedTask: (task) => {
    set({ selectedTask: task });
  },

  fetchTasks: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const filters = get().filters;
      const res = await taskApi.getTasks(projectId, filters);
      const { tasks, total, page, totalPages } = res.data;
      set({
        tasks: tasks || [],
        pagination: { total, page, totalPages },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch tasks',
        isLoading: false,
      });
    }
  },

  createTask: async (projectId, data) => {
    try {
      const res = await taskApi.createTask(projectId, data);
      const newTask = res.data;
      set((state) => {
        const exists = state.tasks.some((t) => t._id === newTask._id);
        if (exists) {
          return { tasks: state.tasks.map((t) => (t._id === newTask._id ? newTask : t)) };
        }
        return { tasks: [newTask, ...state.tasks] };
      });
      return newTask;
    } catch (error) {
      throw error;
    }
  },

  updateTask: async (projectId, taskId, data) => {
    try {
      const res = await taskApi.updateTask(projectId, taskId, data);
      const updated = res.data;
      get().handleTaskUpdated(updated);
      return updated;
    } catch (error) {
      throw error;
    }
  },

  deleteTask: async (projectId, taskId) => {
    try {
      await taskApi.deleteTask(projectId, taskId);
      get().handleTaskDeleted(taskId);
    } catch (error) {
      throw error;
    }
  },

  bulkUpdateStatus: async (projectId, taskIds, status) => {
    try {
      const res = await taskApi.bulkUpdateStatus(projectId, { taskIds, status });
      get().handleBulkUpdated({ taskIds, action: 'status_change', status });
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  bulkAssign: async (projectId, taskIds, assignees) => {
    try {
      const res = await taskApi.bulkAssign(projectId, { taskIds, assignees });
      get().handleBulkUpdated({ taskIds, action: 'assign', assignees });
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  bulkDelete: async (projectId, taskIds) => {
    try {
      const res = await taskApi.bulkDelete(projectId, { taskIds });
      get().handleBulkDeleted({ taskIds });
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // Real-time Socket Event Handlers
  handleTaskCreated: (task) => {
    if (!task || !task._id) return;
    set((state) => {
      const exists = state.tasks.some((t) => t._id === task._id);
      if (exists) {
        return { tasks: state.tasks.map((t) => (t._id === task._id ? task : t)) };
      }
      return { tasks: [task, ...state.tasks] };
    });
  },

  handleTaskUpdated: (task) => {
    if (!task || !task._id) return;
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === task._id ? task : t)),
      selectedTask:
        state.selectedTask?._id === task._id ? task : state.selectedTask,
    }));
  },

  handleTaskDeleted: (taskId) => {
    if (!taskId) return;
    set((state) => ({
      tasks: state.tasks.filter((t) => t._id !== taskId),
      selectedTask:
        state.selectedTask?._id === taskId ? null : state.selectedTask,
    }));
  },

  handleBulkUpdated: ({ taskIds, action, status, assignees }) => {
    if (!Array.isArray(taskIds)) return;
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (taskIds.includes(t._id)) {
          if (action === 'status_change' && status) return { ...t, status };
          if (action === 'assign' && assignees) return { ...t, assignees };
        }
        return t;
      }),
    }));
  },

  handleBulkDeleted: ({ taskIds }) => {
    if (!Array.isArray(taskIds)) return;
    set((state) => ({
      tasks: state.tasks.filter((t) => !taskIds.includes(t._id)),
    }));
  },

  handleFileUploaded: ({ taskId, attachment }) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t._id === taskId) {
          const attachments = [...(t.attachments || []), attachment];
          return { ...t, attachments };
        }
        return t;
      }),
      selectedTask:
        state.selectedTask?._id === taskId
          ? {
              ...state.selectedTask,
              attachments: [...(state.selectedTask.attachments || []), attachment],
            }
          : state.selectedTask,
    }));
  },

  handleFileDeleted: ({ taskId, attachmentId }) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t._id === taskId) {
          const attachments = (t.attachments || []).filter(
            (a) => a._id !== attachmentId
          );
          return { ...t, attachments };
        }
        return t;
      }),
      selectedTask:
        state.selectedTask?._id === taskId
          ? {
              ...state.selectedTask,
              attachments: (state.selectedTask.attachments || []).filter(
                (a) => a._id !== attachmentId
              ),
            }
          : state.selectedTask,
    }));
  },

  // Collaboration Presence Handlers
  handleUserViewing: ({ userId, userName, taskId }) => {
    set((state) => {
      const viewing = { ...state.presence.viewing };
      const current = viewing[taskId] || [];
      if (!current.some((u) => u.userId === userId)) {
        viewing[taskId] = [...current, { userId, userName: userName || 'Someone' }];
      }
      return { presence: { ...state.presence, viewing } };
    });
  },

  handleUserEditing: ({ userId, userName, taskId }) => {
    set((state) => {
      const editing = { ...state.presence.editing };
      const current = editing[taskId] || [];
      if (!current.some((u) => u.userId === userId)) {
        editing[taskId] = [...current, { userId, userName: userName || 'Someone' }];
      }
      return { presence: { ...state.presence, editing } };
    });
  },

  handleUserStoppedEditing: ({ userId, taskId }) => {
    set((state) => {
      const editing = { ...state.presence.editing };
      if (editing[taskId]) {
        editing[taskId] = editing[taskId].filter((u) => u.userId !== userId);
      }
      return { presence: { ...state.presence, editing } };
    });
  },

  handleUserOffline: ({ userId }) => {
    set((state) => {
      const viewing = { ...state.presence.viewing };
      const editing = { ...state.presence.editing };
      Object.keys(viewing).forEach((taskId) => {
        viewing[taskId] = viewing[taskId].filter((u) => u.userId !== userId);
      });
      Object.keys(editing).forEach((taskId) => {
        editing[taskId] = editing[taskId].filter((u) => u.userId !== userId);
      });
      return { presence: { viewing, editing } };
    });
  },
}));

export default useTaskStore;
