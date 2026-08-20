import { create } from 'zustand';

const useUIStore = create((set) => ({
  isCreateProjectModalOpen: false,
  isCreateTaskModalOpen: false,
  isEditTaskModalOpen: false,
  isInviteModalOpen: false,
  isTaskDetailsModalOpen: false,
  activeTab: 'tasks', // 'tasks' | 'members' | 'activity'

  setCreateProjectModalOpen: (isOpen) => set({ isCreateProjectModalOpen: isOpen }),
  setCreateTaskModalOpen: (isOpen) => set({ isCreateTaskModalOpen: isOpen }),
  setEditTaskModalOpen: (isOpen) => set({ isEditTaskModalOpen: isOpen }),
  setInviteModalOpen: (isOpen) => set({ isInviteModalOpen: isOpen }),
  setTaskDetailsModalOpen: (isOpen) => set({ isTaskDetailsModalOpen: isOpen }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export default useUIStore;
