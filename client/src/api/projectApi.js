import api from './axios';

export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const createProject = async (data) => {
  const response = await api.post('/projects', data);
  return response.data;
};

export const getProject = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

export const updateProject = async (projectId, data) => {
  const response = await api.patch(`/projects/${projectId}`, data);
  return response.data;
};

export const archiveProject = async (projectId) => {
  const response = await api.patch(`/projects/${projectId}/archive`);
  return response.data;
};

export const inviteMember = async (projectId, data) => {
  const response = await api.post(`/projects/${projectId}/invite`, data);
  return response.data;
};

export const acceptInvite = async (token) => {
  const response = await api.post(`/projects/invite/${token}/accept`);
  return response.data;
};

export const removeMember = async (projectId, userId) => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
};

export const changeMemberRole = async (projectId, userId, data) => {
  const response = await api.patch(`/projects/${projectId}/members/${userId}/role`, data);
  return response.data;
};

export const getActivity = async (projectId, params = {}) => {
  const response = await api.get(`/projects/${projectId}/activity`, { params });
  return response.data;
};
