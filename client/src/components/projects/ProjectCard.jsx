import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Users, Clock } from 'lucide-react';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/formatters';

const ProjectCard = ({ project }) => {
  const memberCount = project.members?.length || 0;
  const isArchived = project.status === 'archived';

  return (
    <Link
      to={`/projects/${project._id}`}
      className="block bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-sky-300 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg group-hover:bg-sky-600 group-hover:text-white transition-colors">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-sky-600 transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-gray-500">
              Owner: {project.owner?.name || 'Unknown'}
            </p>
          </div>
        </div>

        <Badge variant={isArchived ? 'warning' : 'success'}>
          {isArchived ? 'Archived' : 'Active'}
        </Badge>
      </div>

      <p className="text-sm text-gray-600 mb-6 line-clamp-2 min-h-[2.5rem]">
        {project.description || 'No description provided.'}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-1.5">
          <Users className="w-4 h-4 text-gray-400" />
          <span>{memberCount} member{memberCount === 1 ? '' : 's'}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{formatDate(project.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
