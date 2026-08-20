import { useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useProjectStore from '../store/projectStore';
import useTaskStore from '../store/taskStore';
import { connectSocket, getSocket } from '../socket/socket';
import toast from 'react-hot-toast';

export const useProjectSocket = (projectId) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const {
    handleProjectUpdated,
    handleProjectArchived,
    handleMemberAdded,
    handleMemberRemoved,
    handleRoleChanged,
  } = useProjectStore();

  const {
    handleTaskCreated,
    handleTaskUpdated,
    handleTaskDeleted,
    handleBulkUpdated,
    handleBulkDeleted,
    handleFileUploaded,
    handleFileDeleted,
    handleUserViewing,
    handleUserEditing,
    handleUserStoppedEditing,
    handleUserOffline,
  } = useTaskStore();

  useEffect(() => {
    if (!accessToken || !projectId) return;

    const socket = connectSocket(accessToken);
    if (!socket) return;

    // Join room
    socket.emit('project:join', projectId);

    const onProjectJoined = () => {
      console.log(`Joined project room: ${projectId}`);
    };

    const onProjectError = ({ message }) => {
      toast.error(message || 'Socket project error');
    };

    // Task Events
    const onTaskCreated = (task) => handleTaskCreated(task);
    const onTaskUpdated = (task) => handleTaskUpdated(task);
    const onTaskDeleted = ({ taskId }) => handleTaskDeleted(taskId);
    const onTaskBulkUpdated = (data) => handleBulkUpdated(data);
    const onTaskBulkDeleted = (data) => handleBulkDeleted(data);

    // File Events
    const onFileUploaded = (data) => handleFileUploaded(data);
    const onFileDeleted = (data) => handleFileDeleted(data);

    // Project Events
    const onProjectUpdated = (project) => handleProjectUpdated(project);
    const onProjectArchived = ({ projectId: pId }) => handleProjectArchived(pId);
    const onMemberAdded = (data) => handleMemberAdded(data);
    const onMemberRemoved = (data) => handleMemberRemoved(data);
    const onRoleChanged = (data) => handleRoleChanged(data);

    // Presence Events
    const onUserViewing = (data) => handleUserViewing(data);
    const onUserEditing = (data) => handleUserEditing(data);
    const onUserStoppedEditing = (data) => handleUserStoppedEditing(data);
    const onUserOffline = (data) => handleUserOffline(data);

    // Attach Listeners
    socket.on('project:joined', onProjectJoined);
    socket.on('project:error', onProjectError);

    socket.on('task:created', onTaskCreated);
    socket.on('task:updated', onTaskUpdated);
    socket.on('task:deleted', onTaskDeleted);
    socket.on('task:bulk_updated', onTaskBulkUpdated);
    socket.on('task:bulk_deleted', onTaskBulkDeleted);

    socket.on('file:uploaded', onFileUploaded);
    socket.on('file:deleted', onFileDeleted);

    socket.on('project:updated', onProjectUpdated);
    socket.on('project:archived', onProjectArchived);
    socket.on('project:member_added', onMemberAdded);
    socket.on('project:member_removed', onMemberRemoved);
    socket.on('project:member_role_changed', onRoleChanged);

    socket.on('user:viewing', onUserViewing);
    socket.on('user:editing', onUserEditing);
    socket.on('user:stopped_editing', onUserStoppedEditing);
    socket.on('user:offline', onUserOffline);

    return () => {
      socket.emit('project:leave', projectId);

      socket.off('project:joined', onProjectJoined);
      socket.off('project:error', onProjectError);

      socket.off('task:created', onTaskCreated);
      socket.off('task:updated', onTaskUpdated);
      socket.off('task:deleted', onTaskDeleted);
      socket.off('task:bulk_updated', onTaskBulkUpdated);
      socket.off('task:bulk_deleted', onTaskBulkDeleted);

      socket.off('file:uploaded', onFileUploaded);
      socket.off('file:deleted', onFileDeleted);

      socket.off('project:updated', onProjectUpdated);
      socket.off('project:archived', onProjectArchived);
      socket.off('project:member_added', onMemberAdded);
      socket.off('project:member_removed', onMemberRemoved);
      socket.off('project:member_role_changed', onRoleChanged);

      socket.off('user:viewing', onUserViewing);
      socket.off('user:editing', onUserEditing);
      socket.off('user:stopped_editing', onUserStoppedEditing);
      socket.off('user:offline', onUserOffline);
    };
  }, [accessToken, projectId]);
};

export default useProjectSocket;
