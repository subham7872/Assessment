import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import useProjectStore from '../../store/projectStore';
import useUIStore from '../../store/uiStore';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/formatters';

const CreateProjectModal = () => {
  const { isCreateProjectModalOpen, setCreateProjectModalOpen } = useUIStore();
  const createProject = useProjectStore((state) => state.createProject);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await createProject(data);
      toast.success('Project created successfully!');
      reset();
      setCreateProjectModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isCreateProjectModalOpen}
      onClose={() => setCreateProjectModalOpen(false)}
      title="Create New Project"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name
          </label>
          <input
            type="text"
            {...register('name', {
              required: 'Project name is required',
              maxLength: { value: 100, message: 'Name cannot exceed 100 characters' },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="e.g. Website Redesign"
          />
          {errors.name && (
            <p className="text-rose-600 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            {...register('description', {
              maxLength: { value: 500, message: 'Description cannot exceed 500 characters' },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Brief overview of project goals..."
          />
          {errors.description && (
            <p className="text-rose-600 text-xs mt-1">{errors.description.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setCreateProjectModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
