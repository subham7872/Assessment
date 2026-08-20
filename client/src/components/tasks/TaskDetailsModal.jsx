import React, { useEffect, useState } from 'react';
import {
  FileText,
  Paperclip,
  Trash2,
  Upload,
  Eye,
  Edit3,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import useTaskStore from '../../store/taskStore';
import useUIStore from '../../store/uiStore';
import useAuth from '../../hooks/useAuth';
import * as fileApi from '../../api/fileApi';
import { getSocket } from '../../socket/socket';
import toast from 'react-hot-toast';
import {
  formatDate,
  formatBytes,
  getErrorMessage,
} from '../../utils/formatters';
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
} from '../../utils/constants';

const TaskDetailsModal = ({ projectId }) => {
  const { isTaskDetailsModalOpen, setTaskDetailsModalOpen } = useUIStore();
  const { selectedTask, presence } = useTaskStore();
  const { user, isAdmin, isMember, canMutateTasks } = useAuth();
  const [uploading, setUploading] = useState(false);

  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    if (selectedTask && projectId) {
      const socket = getSocket();
      if (socket) {
        socket.emit('task:viewing', { projectId, taskId: selectedTask._id });
      }
    }
  }, [selectedTask, projectId]);

  if (!selectedTask) return null;

  const viewingUsers = presence.viewing[selectedTask._id] || [];
  const editingUsers = presence.editing[selectedTask._id] || [];

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validations
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, WEBP images and PDF documents are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size cannot exceed 5MB');
      return;
    }

    setUploading(true);
    try {
      await fileApi.uploadAttachment(projectId, selectedTask._id, file);
      toast.success('Attachment uploaded successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await fileApi.deleteAttachment(projectId, selectedTask._id, attachmentId);
      toast.success('Attachment deleted!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Modal
      isOpen={isTaskDetailsModalOpen}
      onClose={() => setTaskDetailsModalOpen(false)}
      title={selectedTask.title}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Presence Indicators */}
        {(viewingUsers.length > 0 || editingUsers.length > 0) && (
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg flex flex-wrap gap-3 text-xs text-sky-800">
            {viewingUsers.map((u, i) => (
              <span key={`v-${i}`} className="inline-flex items-center space-x-1 font-medium">
                <Eye className="w-3.5 h-3.5 text-sky-600" />
                <span>{u.userName} is viewing</span>
              </span>
            ))}
            {editingUsers.map((u, i) => (
              <span key={`e-${i}`} className="inline-flex items-center space-x-1 font-medium text-amber-800">
                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                <span>{u.userName} is editing...</span>
              </span>
            ))}
          </div>
        )}

        {/* Task Metadata */}
        <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-gray-50 rounded-lg text-sm border border-gray-200">
          <div>
            <span className="text-gray-500 text-xs block mb-1">Status</span>
            <Badge variant="primary">
              {TASK_STATUS_LABELS[selectedTask.status] || selectedTask.status}
            </Badge>
          </div>

          <div>
            <span className="text-gray-500 text-xs block mb-1">Priority</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                TASK_PRIORITY_COLORS[selectedTask.priority]
              }`}
            >
              {TASK_PRIORITY_LABELS[selectedTask.priority] || selectedTask.priority}
            </span>
          </div>

          <div>
            <span className="text-gray-500 text-xs block mb-1">Due Date</span>
            <div className="flex items-center space-x-1 text-gray-700 font-medium">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{formatDate(selectedTask.dueDate) || 'No due date'}</span>
            </div>
          </div>

          <div>
            <span className="text-gray-500 text-xs block mb-1">Assignees</span>
            <div className="flex items-center space-x-1 text-gray-700 font-medium">
              <UserIcon className="w-4 h-4 text-gray-400" />
              <span>
                {selectedTask.assignees?.map((a) => a.name || a.email).join(', ') ||
                  'Unassigned'}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[4rem]">
            {selectedTask.description || 'No description provided.'}
          </p>
        </div>

        {/* Attachments Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
              <Paperclip className="w-4 h-4 text-gray-500" />
              <span>Attachments ({selectedTask.attachments?.length || 0})</span>
            </h4>

            {canMutateTasks && (
              <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                />
              </label>
            )}
          </div>

          {selectedTask.attachments && selectedTask.attachments.length > 0 ? (
            <div className="space-y-2">
              {selectedTask.attachments.map((att) => {
                const uploaderId = att.uploadedBy?._id || att.uploadedBy;
                const canDelete =
                  isAdmin || (isMember && uploaderId === currentUserId);

                return (
                  <div
                    key={att._id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-sky-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="p-2 bg-gray-100 rounded text-gray-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-sky-600 hover:underline truncate block"
                        >
                          {att.originalName}
                        </a>
                        <p className="text-xs text-gray-400">
                          {formatBytes(att.size)} • {formatDate(att.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteAttachment(att._id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete Attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
              No attachments uploaded yet.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailsModal;
