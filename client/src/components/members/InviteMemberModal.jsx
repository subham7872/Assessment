import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import useProjectStore from '../../store/projectStore';
import useUIStore from '../../store/uiStore';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/formatters';

const InviteMemberModal = ({ projectId }) => {
  const { isInviteModalOpen, setInviteModalOpen } = useUIStore();
  const inviteMember = useProjectStore((state) => state.inviteMember);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: 'member',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await inviteMember(projectId, data);
      toast.success('Invitation sent successfully!');
      reset();
      setInviteModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isInviteModalOpen}
      onClose={() => setInviteModalOpen(false)}
      title="Invite Team Member"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
                message: 'Invalid email address',
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="colleague@example.com"
          />
          {errors.email && (
            <p className="text-rose-600 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            {...register('role')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="member">Member (Can edit tasks)</option>
            <option value="viewer">Viewer (Read only)</option>
            <option value="project_admin">Project Admin (Full access)</option>
          </select>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setInviteModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteMemberModal;
