import { create } from 'zustand';
import * as projectApi from '../api/projectApi';

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  members: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await projectApi.getProjects();
      set({ projects: res.data || [], isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch projects',
        isLoading: false,
      });
    }
  },

  createProject: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await projectApi.createProject(data);
      const newProject = res.data;
      set((state) => ({
        projects: [newProject, ...state.projects],
        isLoading: false,
      }));
      return newProject;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to create project',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchProject: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await projectApi.getProject(projectId);
      const project = res.data;
      set({
        currentProject: project,
        members: project.members || [],
        isLoading: false,
      });
      return project;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch project',
        isLoading: false,
      });
      throw error;
    }
  },

  updateProject: async (projectId, data) => {
    try {
      const res = await projectApi.updateProject(projectId, data);
      const updated = res.data;
      set((state) => ({
        currentProject:
          state.currentProject?._id === projectId
            ? { ...state.currentProject, ...updated }
            : state.currentProject,
        projects: state.projects.map((p) => (p._id === projectId ? updated : p)),
      }));
      return updated;
    } catch (error) {
      throw error;
    }
  },

  archiveProject: async (projectId) => {
    try {
      const res = await projectApi.archiveProject(projectId);
      const archived = res.data;
      set((state) => ({
        currentProject:
          state.currentProject?._id === projectId ? archived : state.currentProject,
        projects: state.projects.map((p) => (p._id === projectId ? archived : p)),
      }));
      return archived;
    } catch (error) {
      throw error;
    }
  },

  inviteMember: async (projectId, data) => {
    try {
      return await projectApi.inviteMember(projectId, data);
    } catch (error) {
      throw error;
    }
  },

  acceptInvite: async (token) => {
    try {
      const res = await projectApi.acceptInvite(token);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  removeMember: async (projectId, userId) => {
    try {
      const res = await projectApi.removeMember(projectId, userId);
      const updated = res.data;
      set({
        currentProject: updated,
        members: updated.members || [],
      });
      return updated;
    } catch (error) {
      throw error;
    }
  },

  changeMemberRole: async (projectId, userId, data) => {
    try {
      const res = await projectApi.changeMemberRole(projectId, userId, data);
      const updated = res.data;
      set({
        currentProject: updated,
        members: updated.members || [],
      });
      return updated;
    } catch (error) {
      throw error;
    }
  },

  // Real-time Socket Event Handlers
  handleProjectUpdated: (updatedProject) => {
    set((state) => ({
      currentProject:
        state.currentProject?._id === updatedProject._id
          ? { ...state.currentProject, ...updatedProject }
          : state.currentProject,
      projects: state.projects.map((p) =>
        p._id === updatedProject._id ? updatedProject : p
      ),
    }));
  },

  handleProjectArchived: (projectId) => {
    set((state) => ({
      currentProject:
        state.currentProject?._id === projectId
          ? { ...state.currentProject, status: 'archived' }
          : state.currentProject,
      projects: state.projects.map((p) =>
        p._id === projectId ? { ...p, status: 'archived' } : p
      ),
    }));
  },

  handleMemberAdded: ({ projectId }) => {
    if (get().currentProject?._id === projectId) {
      get().fetchProject(projectId);
    }
  },

  handleMemberRemoved: ({ projectId, targetUserId }) => {
    if (get().currentProject?._id === projectId) {
      set((state) => ({
        members: state.members.filter(
          (m) => (m.user?._id || m.user) !== targetUserId
        ),
      }));
    }
  },

  handleRoleChanged: ({ projectId, targetUserId, newRole }) => {
    if (get().currentProject?._id === projectId) {
      set((state) => ({
        members: state.members.map((m) =>
          (m.user?._id || m.user) === targetUserId
            ? { ...m, role: newRole }
            : m
        ),
      }));
    }
  },
}));

export default useProjectStore;
