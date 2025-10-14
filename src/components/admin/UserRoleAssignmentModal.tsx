import React, { useState, useEffect } from 'react';
// Icons replaced with React Native compatible emoji/text
const Icons = {
  User: () => '👤',
  UserPlus: () => '👤+',
  X: () => '✕',
  Save: () => '💾',
  Trash2: () => '🗑️',
  AlertCircle: () => '⚠️',
  Calendar: () => '📅',
  MessageSquare: () => '💬',
  Shield: () => '🛡️',
  Clock: () => '🕐'
};
import apiService from '../../services/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  legacy_role: string;
  status: string;
  rbac_roles: Array<{
    roleCode: string;
    roleName: string;
    level: number;
    assignedAt: string;
    assignmentReason: string;
    isActive: boolean;
  }>;
}

interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  level: number;
  is_active: boolean;
  is_custom_role?: boolean;
}

interface UserRoleAssignmentModalProps {
  user: User | null;
  roles: Role[];
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const UserRoleAssignmentModal: React.FC<UserRoleAssignmentModalProps> = ({
  user,
  roles,
  isOpen,
  onClose,
  onSave
}) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [reason, setReason] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      // Reset form
      setSelectedRole('');
      setReason('');
      setEffectiveFrom('');
      setEffectiveTo('');
      setError(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleAssignRole = async () => {
    if (!selectedRole) {
      setError('Please select a role to assign');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for this role assignment');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await apiService.assignUserRole(
        user.id,
        selectedRole,
        reason,
        effectiveFrom || undefined,
        effectiveTo || undefined
      );

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign role');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (roleCode: string) => {
    if (!confirm(`Are you sure you want to remove the role "${roleCode}" from ${user.email}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await apiService.removeUserRole(user.id, roleCode);
      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to remove role');
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = roles.filter(
    role => !user.rbac_roles.some(userRole => userRole.roleCode === role.code)
  );

  const getRoleBadgeColor = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-red-100 text-red-800 border-red-200';
      case 1:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 2:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 3:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span style={{fontSize: 20}}>{Icons.UserPlus()}</span>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Manage User Roles
                  </h3>
                  <p className="text-sm text-gray-500">
                    {user.email} • {user.full_name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span style={{fontSize: 20}}>{Icons.X()}</span>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <span style={{fontSize: 18}}>{Icons.AlertCircle()}</span>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {/* Current Roles */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <span style={{fontSize: 16, marginRight: 8}}>{Icons.Shield()}</span>
                  Current Roles ({user.rbac_roles.length})
                </h4>
                {user.rbac_roles.length > 0 ? (
                  <div className="space-y-3">
                    {user.rbac_roles.map((userRole, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(userRole.level)}`}>
                            Level {userRole.level}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{userRole.roleName}</p>
                            <p className="text-xs text-gray-500">
                              Code: {userRole.roleCode}
                              {userRole.assignmentReason && ` • ${userRole.assignmentReason}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <p className="text-xs text-gray-500 flex items-center">
                              <span style={{fontSize: 12, marginRight: 4}}>{Icons.Clock()}</span>
                              {new Date(userRole.assignedAt).toLocaleDateString()}
                            </p>
                            {userRole.isActive && (
                              <span className="text-xs text-green-600">Active</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveRole(userRole.roleCode)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Remove role"
                          >
                            <span style={{fontSize: 16}}>{Icons.Trash2()}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No RBAC roles assigned</p>
                )}
              </div>

              {/* Legacy Role Info */}
              {user.legacy_role && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Legacy Role:</strong> {user.legacy_role}
                    <span className="block text-xs mt-1">
                      This user also has a legacy role. RBAC roles take precedence for permission evaluation.
                    </span>
                  </p>
                </div>
              )}

              {/* Assign New Role */}
              {availableRoles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Assign New Role</h4>
                  <div className="space-y-4">
                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Role
                      </label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Choose a role...</option>
                        {availableRoles.map((role) => (
                          <option key={role.code} value={role.code}>
                            {role.name} (Level {role.level}) - {role.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selected Role Details */}
                    {selectedRole && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        {(() => {
                          const role = availableRoles.find(r => r.code === selectedRole);
                          if (!role) return null;
                          return (
                            <div>
                              <p className="text-sm font-medium text-blue-900">{role.name}</p>
                              <p className="text-sm text-blue-700 mt-1">{role.description}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(role.level)}`}>
                                  Level {role.level}
                                </span>
                                {role.is_custom_role && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Custom Role
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Reason */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Assignment *
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Promotion to manager role, Project assignment, etc."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    {/* Date Range (Optional) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Effective From (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={effectiveFrom}
                          onChange={(e) => setEffectiveFrom(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Effective To (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={effectiveTo}
                          onChange={(e) => setEffectiveTo(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {availableRoles.length === 0 && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    All available roles have been assigned to this user.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {availableRoles.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                onClick={handleAssignRole}
                disabled={loading || !selectedRole || !reason.trim()}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <span style={{fontSize: 16, marginRight: 8}}>{Icons.UserPlus()}</span>
                    Assign Role
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserRoleAssignmentModal;