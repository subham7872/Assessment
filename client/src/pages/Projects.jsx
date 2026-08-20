import React, { useEffect } from 'react';
import { Plus, FolderKanban } from 'lucide-react';
import ProjectCard from '../components/projects/ProjectCard';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import useProjectStore from '../store/projectStore';
import useUIStore from '../store/uiStore';
import Spinner from '../components/common/Spinner';

const Projects = () => {
  const { projects, fetchProjects, isLoading } = useProjectStore();
  const setCreateProjectModalOpen = useUIStore(
    (state) => state.setCreateProjectModalOpen
  );

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your collaborative project workspaces
          </p>
        </div>

        <button
          onClick={() => setCreateProjectModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm rounded-lg shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {isLoading && projects.length === 0 ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-md mx-auto my-12">
          <div className="inline-flex p-4 bg-sky-50 text-sky-600 rounded-full mb-4">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No projects found
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Get started by creating your first project workspace.
          </p>
          <button
            onClick={() => setCreateProjectModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      )}

      <CreateProjectModal />
    </div>
  );
};

export default Projects;
