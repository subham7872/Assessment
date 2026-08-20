import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  Users,
  Activity,
  Archive,
  ArrowLeft,
} from 'lucide-react';
import useProjectStore from '../store/projectStore';
import useUIStore from '../store/uiStore';
import useAuth from '../hooks/useAuth';
import useProjectSocket from '../hooks/useProjectSocket';

import TaskBoard from '../components/tasks/TaskBoard';
import MemberList from '../components/members/MemberList';
import ActivityLogList from '../components/activity/ActivityLogList';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import EditTaskModal from '../components/tasks/EditTaskModal';
import TaskDetailsModal from '../components/tasks/TaskDetailsModal';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/formatters';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const {
    currentProject,
    fetchProject,
    archiveProject,
    isLoading,
    error,
  } = useProjectStore();

  const { activeTab, setActiveTab } = useUIStore();
  const { canArchiveProject, role } = useAuth();

  // Attach Real-Time Socket Connection & Events
  useProjectSocket(projectId);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId]);

  const handleArchive = async () => {
    if (
      !window.confirm(
        'Are you sure you want to archive this project? Archived projects become read-only.'
      )
    ) {
      return;
    }
    try {
      await archiveProject(projectId);
      toast.success('Project archived successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading && !currentProject) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-md mx-auto my-12 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {error || 'Project not found'}
        </h3>
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </div>
    );
  }

  const isArchived = currentProject.status === 'archived';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Project Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-xl">
              <FolderKanban className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentProject.name}
                </h1>
                <Badge variant={isArchived ? 'warning' : 'success'}>
                  {isArchived ? 'Archived' : 'Active'}
                </Badge>
                <Badge variant="primary" className="capitalize">
                  Role: {role.replace('_', ' ')}
                </Badge>
              </div>
              {currentProject.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {currentProject.description}
                </p>
              )}
            </div>
          </div>

          {canArchiveProject && !isArchived && (
            <button
              onClick={handleArchive}
              className="flex items-center space-x-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-200 transition-colors"
            >
              <Archive className="w-4 h-4" />
              <span>Archive Project</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-t border-gray-100 pt-4">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'bg-sky-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Task Board</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'bg-sky-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members ({currentProject.members?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'activity'
                ? 'bg-sky-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Activity Log</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'tasks' && <TaskBoard projectId={projectId} />}
      {activeTab === 'members' && <MemberList projectId={projectId} />}
      {activeTab === 'activity' && <ActivityLogList projectId={projectId} />}

      {/* Modals */}
      <CreateTaskModal projectId={projectId} />
      <EditTaskModal projectId={projectId} />
      <TaskDetailsModal projectId={projectId} />
    </div>
  );
};

export default ProjectDetails;
