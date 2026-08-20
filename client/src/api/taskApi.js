import api from './axios';

export const getTasks = async (projectId, params = {}) => {
  const response = await api.get(`/projects/${projectId}/tasks`, { params });
  return response.data;
};

export const getTask = async (projectId, taskId) => {
  const response = await api.get(`/projects/${projectId}/tasks/${taskId}`);
  return response.data;
};

export const createTask = async (projectId, data) => {
  const response = await api.post(`/projects/${projectId}/tasks`, data);
  return response.data;
};

export const updateTask = async (projectId, taskId, data) => {
  const response = await api.patch(`/projects/${projectId}/tasks/${taskId}`, data);
  return response.data;
};

export const deleteTask = async (projectId, taskId) => {
  const response = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  return response.data;
};

export const bulkUpdateStatus = async (projectId, data) => {
  const response = await api.post(`/projects/${projectId}/tasks/bulk/status`, data);
  return response.data;
};

export const bulkAssign = async (projectId, data) => {
  const response = await api.post(`/projects/${projectId}/tasks/bulk/assign`, data);
  return response.data;
};

export const bulkDelete = async (projectId, data) => {
  const response = await api.delete(`/projects/${projectId}/tasks/bulk`, { data });
  return response.data;
};
