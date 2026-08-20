import React, { useEffect, useState } from 'react';
import { Activity, Clock, User as UserIcon } from 'lucide-react';
import * as activityApi from '../../api/activityApi';
import Spinner from '../common/Spinner';
import { formatDateTime } from '../../utils/formatters';

const ACTION_LABELS = {
  project_created: 'created the project',
  project_updated: 'updated project details',
  project_archived: 'archived the project',
  member_added: 'invited/added a member',
  member_removed: 'removed a member',
  member_role_changed: 'changed a member role',
  task_created: 'created a task',
  task_updated: 'updated a task',
  task_deleted: 'deleted a task',
  task_status_changed: 'changed task status',
  task_assigned: 'assigned a task',
  task_bulk_updated: 'bulk updated tasks',
  file_uploaded: 'uploaded a task attachment',
  file_deleted: 'deleted a task attachment',
};

const ActivityLogList = ({ projectId }) => {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchActivity = async (pageNum) => {
    setLoading(true);
    try {
      const res = await activityApi.getActivity(projectId, { page: pageNum, limit: 15 });
      setLogs(res.data?.logs || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity(page);
  }, [projectId, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-sky-600" />
            <span>Activity Audit Log</span>
          </h2>
          <p className="text-xs text-gray-500">
            Real-time audit history of project mutations
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : logs.length > 0 ? (
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
            {logs.map((log) => (
              <div key={log._id} className="relative pl-6">
                {/* Timeline Dot */}
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-sky-500 border-2 border-white" />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium text-gray-900">
                    <span className="font-semibold text-sky-700">
                      {log.user?.name || log.user?.email || 'User'}
                    </span>{' '}
                    <span>{ACTION_LABELS[log.action] || log.action}</span>
                    {log.metadata?.title && (
                      <span className="italic font-normal text-gray-600">
                        {' '}
                        "{log.metadata.title}"
                      </span>
                    )}
                    {log.metadata?.fileName && (
                      <span className="italic font-normal text-gray-600">
                        {' '}
                        "{log.metadata.fileName}"
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-gray-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDateTime(log.createdAt)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            No activity recorded yet.
          </p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100 text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 bg-gray-100 rounded text-gray-700 hover:bg-gray-200 disabled:opacity-50 font-medium"
            >
              Previous
            </button>
            <span className="text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 bg-gray-100 rounded text-gray-700 hover:bg-gray-200 disabled:opacity-50 font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogList;
