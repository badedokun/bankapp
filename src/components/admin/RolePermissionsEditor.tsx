import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Save,
  X,
  Check,
  AlertTriangle,
  Info,
  Eye,
  Edit2,
  Lock,
  Users,
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import apiService from '../../services/api';

interface Permission {
  code: string;
  name: string;
  description: string;
  category: string;
  level?: 'read' | 'write' | 'full';
  is_system_permission?: boolean;
  cbn_regulation_ref?: string;
  nibss_requirement?: boolean;
}

interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  level: number;
  is_system_role?: boolean;
}

interface RolePermissionsEditorProps {
  role: Role;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  level?: 'platform' | 'tenant';
}

const RolePermissionsEditor: React.FC<RolePermissionsEditorProps> = ({
  role,
  isOpen,
  onClose,
  onSave,
  level = 'platform'
}) => {
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [rolePermissions, setRolePermissions] = useState<Record<string, Permission>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedLevel, setSelectedLevel] = useState<'read' | 'write' | 'full'>('read');

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
      loadRolePermissions();
    }
  }, [isOpen, role.code]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const { groupedByCategory } = await apiService.getPlatformPermissions();
      setPermissions(groupedByCategory);
      // Expand all categories by default
      setExpandedCategories(new Set(Object.keys(groupedByCategory)));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async () => {
    try {
      const { permissions: rolePerms } = await apiService.getRolePermissions(role.code, level);
      const permissionsMap: Record<string, Permission> = {};
      rolePerms.forEach((perm: any) => {
        permissionsMap[perm.permission_code] = {
          code: perm.permission_code,
          name: perm.permission_name,
          category: perm.category,
          level: perm.permission_level as 'read' | 'write' | 'full',
          description: perm.description
        };
      });
      setRolePermissions(permissionsMap);
    } catch (err: any) {
      setError(err.message || 'Failed to load role permissions');
    }
  };

  const handlePermissionToggle = (permission: Permission, level: 'read' | 'write' | 'full' | 'none') => {
    const updatedPermissions = { ...rolePermissions };

    if (level === 'none') {
      delete updatedPermissions[permission.code];
    } else {
      updatedPermissions[permission.code] = {
        ...permission,
        level
      };
    }

    setRolePermissions(updatedPermissions);
  };

  const handleBulkCategoryToggle = (category: string, level: 'read' | 'write' | 'full' | 'none') => {
    const updatedPermissions = { ...rolePermissions };
    const categoryPermissions = permissions[category] || [];

    categoryPermissions.forEach(permission => {
      if (level === 'none') {
        delete updatedPermissions[permission.code];
      } else {
        updatedPermissions[permission.code] = {
          ...permission,
          level
        };
      }
    });

    setRolePermissions(updatedPermissions);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const permissionsToSave = Object.values(rolePermissions).map(perm => ({
        code: perm.code,
        level: perm.level || 'read'
      }));

      await apiService.updateRolePermissions(role.code, permissionsToSave, level);
      onSave();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getPermissionLevel = (permissionCode: string): 'read' | 'write' | 'full' | 'none' => {
    return rolePermissions[permissionCode]?.level || 'none';
  };

  const getCategoryStats = (category: string) => {
    const categoryPerms = permissions[category] || [];
    const assigned = categoryPerms.filter(p => rolePermissions[p.code]).length;
    const total = categoryPerms.length;
    return { assigned, total };
  };

  const filteredCategories = Object.keys(permissions).filter(category => {
    if (!searchTerm) return true;
    const categoryPermissions = permissions[category] || [];
    return category.toLowerCase().includes(searchTerm.toLowerCase()) ||
           categoryPermissions.some(p =>
             p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             p.code.toLowerCase().includes(searchTerm.toLowerCase())
           );
  });

  const getFilteredPermissions = (category: string) => {
    const categoryPermissions = permissions[category] || [];
    if (!searchTerm) return categoryPermissions;

    return categoryPermissions.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Edit Permissions: {role.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Role Code: {role.code} • Level: {role.level} • {level} level permissions
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Search and Quick Actions */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value as 'read' | 'write' | 'full')}
                  className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="read">Read Level</option>
                  <option value="write">Write Level</option>
                  <option value="full">Full Access</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-4 py-5 sm:p-6 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading permissions...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCategories.map((category) => {
                  const { assigned, total } = getCategoryStats(category);
                  const isExpanded = expandedCategories.has(category);
                  const categoryPermissions = getFilteredPermissions(category);

                  return (
                    <div key={category} className="border border-gray-200 rounded-lg">
                      {/* Category Header */}
                      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="flex items-center space-x-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="capitalize">{category}</span>
                          <span className="text-gray-500">({assigned}/{total})</span>
                        </button>

                        <div className="flex items-center space-x-2">
                          {/* Bulk Actions */}
                          <button
                            onClick={() => handleBulkCategoryToggle(category, selectedLevel)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Grant {selectedLevel}
                          </button>
                          <button
                            onClick={() => handleBulkCategoryToggle(category, 'none')}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Revoke All
                          </button>
                        </div>
                      </div>

                      {/* Category Permissions */}
                      {isExpanded && (
                        <div className="divide-y divide-gray-200">
                          {categoryPermissions.map((permission) => {
                            const currentLevel = getPermissionLevel(permission.code);

                            return (
                              <div key={permission.code} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h4 className="text-sm font-medium text-gray-900">
                                        {permission.name}
                                      </h4>
                                      {permission.is_system_permission && (
                                        <Lock className="h-3 w-3 text-gray-400" title="System Permission" />
                                      )}
                                      {permission.cbn_regulation_ref && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                          CBN
                                        </span>
                                      )}
                                      {permission.nibss_requirement && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                          NIBSS
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{permission.code}</p>
                                    <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                                  </div>

                                  <div className="ml-4 flex items-center space-x-2">
                                    {/* Permission Level Selector */}
                                    <select
                                      value={currentLevel}
                                      onChange={(e) => handlePermissionToggle(permission, e.target.value as any)}
                                      className={`text-xs border rounded px-2 py-1 ${
                                        currentLevel === 'none'
                                          ? 'border-gray-300 text-gray-500'
                                          : currentLevel === 'read'
                                          ? 'border-blue-300 text-blue-700 bg-blue-50'
                                          : currentLevel === 'write'
                                          ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                                          : 'border-green-300 text-green-700 bg-green-50'
                                      }`}
                                    >
                                      <option value="none">None</option>
                                      <option value="read">Read</option>
                                      <option value="write">Write</option>
                                      <option value="full">Full</option>
                                    </select>

                                    {/* Status Indicator */}
                                    {currentLevel !== 'none' && (
                                      <Check className="h-4 w-4 text-green-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>

          {/* Statistics Footer */}
          <div className="bg-gray-100 px-4 py-3 text-center">
            <p className="text-xs text-gray-600">
              Total assigned permissions: {Object.keys(rolePermissions).length} / {
                Object.values(permissions).reduce((acc, perms) => acc + perms.length, 0)
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionsEditor;