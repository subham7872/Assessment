import api from './axios';

export const getActivity = async (projectId, params = {}) => {
  const response = await api.get(`/projects/${projectId}/activity`, { params });
  return response.data;
};
