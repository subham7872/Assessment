import React from 'react';
import { UserPlus, Shield, User as UserIcon, Trash2 } from 'lucide-react';
import useProjectStore from '../../store/projectStore';
import useUIStore from '../../store/uiStore';
import useAuth from '../../hooks/useAuth';
import Badge from '../common/Badge';
import InviteMemberModal from './InviteMemberModal';
import toast from 'react-hot-toast';
import { formatDate, getErrorMessage } from '../../utils/formatters';
import { ROLE_LABELS } from '../../utils/constants';

const MemberList = ({ projectId }) => {
  const { currentProject, members, removeMember, changeMemberRole } =
    useProjectStore();
  const { setInviteModalOpen } = useUIStore();
  const { user, isAdmin, canManageMembers } = useAuth();

  const currentUserId = user?.id || user?._id;
  const ownerId =
    currentProject?.owner?._id || currentProject?.owner?.id || currentProject?.owner;

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      await changeMemberRole(projectId, targetUserId, { role: newRole });
      toast.success('Member role updated!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRemoveMember = async (targetUserId, targetName) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${targetName || 'this member'} from the project?`
      )
    ) {
      return;
    }
    try {
      await removeMember(projectId, targetUserId);
      toast.success('Member removed!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Project Members</h2>
          <p className="text-xs text-gray-500">
            Manage user roles and project permissions
          </p>
        </div>

        {canManageMembers && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm rounded-lg shadow transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {members.map((m) => {
            const memberUser = m.user;
            if (!memberUser) return null;

            const memberId = memberUser._id || memberUser.id || memberUser;
            const isOwner = ownerId && ownerId.toString() === memberId.toString();
            const isSelf = currentUserId && currentUserId.toString() === memberId.toString();

            return (
              <div
                key={memberId}
                className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-semibold text-sm">
                    {memberUser.name ? memberUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {memberUser.name || 'User'}
                      </h4>
                      {isOwner && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Owner
                        </span>
                      )}
                      {isSelf && (
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{memberUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">
                    Joined {formatDate(m.joinedAt)}
                  </span>

                  {/* Role Selector / Badge */}
                  {canManageMembers && !isOwner ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(memberId, e.target.value)}
                      className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="project_admin">Project Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <Badge variant={isOwner ? 'warning' : 'primary'}>
                      {ROLE_LABELS[m.role] || m.role}
                    </Badge>
                  )}

                  {/* Remove Button */}
                  {(canManageMembers || isSelf) && !isOwner && (
                    <button
                      onClick={() => handleRemoveMember(memberId, memberUser.name)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded transition-colors"
                      title={isSelf ? 'Leave Project' : 'Remove Member'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <InviteMemberModal projectId={projectId} />
    </div>
  );
};

export default MemberList;
