import api from './axios';

export const uploadAttachment = async (projectId, taskId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(
    `/projects/${projectId}/tasks/${taskId}/attachments`,
    formData
    // Let browser generate multipart/form-data boundary automatically
  );
  return response.data;
};

export const deleteAttachment = async (projectId, taskId, attachmentId) => {
  const response = await api.delete(
    `/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`
  );
  return response.data;
};
