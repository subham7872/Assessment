import useAuthStore from '../store/authStore';
import useProjectStore from '../store/projectStore';

export const useAuth = () => {
  const { user, accessToken, isAuthenticated, isLoading, initialized, logout } =
    useAuthStore();
  const { currentProject, members } = useProjectStore();

  const currentUserId = user?.id || user?._id;

  const currentMember = members?.find(
    (m) => (m.user?._id || m.user?.id || m.user) === currentUserId
  );

  const role = currentMember?.role || 'viewer';

  const isOwner =
    currentProject &&
    (currentProject.owner?._id || currentProject.owner) === currentUserId;

  const isAdmin = role === 'project_admin' || isOwner;
  const isMember = role === 'member' || isAdmin;
  const isViewer = role === 'viewer' && !isMember;

  const canMutateTasks = isAdmin || isMember;
  const canManageMembers = isAdmin;
  const canArchiveProject = isOwner;

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    initialized,
    role,
    isOwner,
    isAdmin,
    isMember,
    isViewer,
    canMutateTasks,
    canManageMembers,
    canArchiveProject,
    logout,
  };
};

export default useAuth;
