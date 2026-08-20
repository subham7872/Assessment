import React from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  Users,
  Activity,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import useProjectStore from '../../store/projectStore';

const Sidebar = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const currentProject = useProjectStore((state) => state.currentProject);
  const { activeTab, setActiveTab } = useUIStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="p-2 bg-sky-600 rounded-lg text-white">
          <FolderKanban className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg tracking-wide">FlowMatic</h1>
          <p className="text-xs text-slate-400">Project Management</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Navigation
          </p>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive && !projectId
                  ? 'bg-sky-600 text-white'
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`
            }
          >
            <FolderKanban className="w-5 h-5" />
            <span>All Projects</span>
          </NavLink>
        </div>

        {projectId && currentProject && (
          <div>
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 truncate">
              {currentProject.name}
            </p>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'tasks'
                    ? 'bg-sky-600 text-white'
                    : 'hover:bg-slate-800 hover:text-white text-slate-400'
                }`}
              >
                <CheckSquare className="w-5 h-5" />
                <span>Task Board</span>
              </button>

              <button
                onClick={() => setActiveTab('members')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'members'
                    ? 'bg-sky-600 text-white'
                    : 'hover:bg-slate-800 hover:text-white text-slate-400'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Members</span>
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'activity'
                    ? 'bg-sky-600 text-white'
                    : 'hover:bg-slate-800 hover:text-white text-slate-400'
                }`}
              >
                <Activity className="w-5 h-5" />
                <span>Activity Log</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold">
            <UserIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-rose-900/30 hover:text-rose-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
