import React, { useState, useEffect } from 'react';
// Icons replaced with React Native compatible emoji/text - no lucide-react
const Icons = {
  Shield: () => '🛡️',
  Users: () => '👥',
  Key: () => '🔑',
  Settings: () => '⚙️',
  UserPlus: () => '👤+',
  Plus: () => '➕',
  Eye: () => '👁️',
  Edit: () => '✏️',
  Trash2: () => '🗑️',
  Search: () => '🔍',
  Filter: () => '🔽',
  Clock: () => '🕐',
  AlertCircle: () => '⚠️',
  CheckCircle: () => '✅'
};
import apiService from '../../services/api';

interface RBACDashboardData {
  totalUsers: number;
  activeRoles: number;
  totalPermissions: number;
  recentAssignments: Array<{
    email: string;
    role_name: string;
    assigned_at: string;
    assignment_reason: string;
  }>;
  roleDistribution: Array<{
    role_name: string;
    level: number;
    user_count: number;
  }>;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  legacy_role: string;
  status: string;
  created_at: string;
  last_login_at: string;
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

const RBACDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<RBACDashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'roles' | 'permissions' | 'audit'>('dashboard');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'roles') {
      loadRoles();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getRBACDashboard();
      setDashboardData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { users: userData } = await apiService.getAllUsers();
      setUsers(userData);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    }
  };

  const loadRoles = async () => {
    try {
      const rolesData = await apiService.getPlatformRoles();
      setRoles(rolesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
    }
  };

  const handleAssignRole = async (userId: string, roleCode: string, reason: string) => {
    try {
      await apiService.assignUserRole(userId, roleCode, reason);
      loadUsers(); // Reload users after assignment
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to assign role');
    }
  };

  const handleRemoveRole = async (userId: string, roleCode: string) => {
    try {
      await apiService.removeUserRole(userId, roleCode);
      loadUsers(); // Reload users after removal
    } catch (err: any) {
      setError(err.message || 'Failed to remove role');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RBAC Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">RBAC Management</h1>
                <p className="text-sm text-gray-500">Role-Based Access Control Administration</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateRole(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: Shield },
            { id: 'users', name: 'Users', icon: Users },
            { id: 'roles', name: 'Roles', icon: Key },
            { id: 'permissions', name: 'Permissions', icon: Settings },
            { id: 'audit', name: 'Audit Trail', icon: Clock }
          ].map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 text-sm font-medium ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeTab === 'dashboard' && dashboardData && (
          <DashboardOverview data={dashboardData} />
        )}

        {activeTab === 'users' && (
          <UsersManagement
            users={filteredUsers}
            roles={roles}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAssignRole={handleAssignRole}
            onRemoveRole={handleRemoveRole}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
          />
        )}

        {activeTab === 'roles' && (
          <RolesManagement
            roles={filteredRoles}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
          />
        )}

        {activeTab === 'permissions' && (
          <PermissionsManagement />
        )}

        {activeTab === 'audit' && (
          <AuditTrail />
        )}
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview: React.FC<{ data: RBACDashboardData }> = ({ data }) => (
  <div className="space-y-6">
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                <dd className="text-2xl font-semibold text-gray-900">{data.totalUsers}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Key className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Active Roles</dt>
                <dd className="text-2xl font-semibold text-gray-900">{data.activeRoles}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Permissions</dt>
                <dd className="text-2xl font-semibold text-gray-900">{data.totalPermissions}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Recent Assignments & Role Distribution */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Assignments */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Role Assignments</h3>
          <div className="space-y-3">
            {data.recentAssignments.slice(0, 5).map((assignment, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {assignment.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    Assigned {assignment.role_name} • {new Date(assignment.assigned_at).toLocaleDateString()}
                  </p>
                  {assignment.assignment_reason && (
                    <p className="text-xs text-gray-400">{assignment.assignment_reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role Distribution */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Role Distribution</h3>
          <div className="space-y-3">
            {data.roleDistribution.map((role, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-3 h-3 rounded-full ${
                    role.level === 1 ? 'bg-red-500' :
                    role.level === 2 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{role.role_name}</p>
                    <p className="text-xs text-gray-500">Level {role.level}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600">{role.user_count} users</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Users Management Component (simplified for brevity)
const UsersManagement: React.FC<{
  users: User[];
  roles: Role[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAssignRole: (userId: string, roleCode: string, reason: string) => Promise<void>;
  onRemoveRole: (userId: string, roleCode: string) => Promise<void>;
  selectedUser: User | null;
  onSelectUser: (user: User | null) => void;
}> = ({ users, roles, searchTerm, onSearchChange, onAssignRole, onRemoveRole, selectedUser, onSelectUser }) => (
  <div className="space-y-6">
    {/* Search */}
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>

    {/* Users Table */}
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              RBAC Roles
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Login
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{user.email}</div>
                  <div className="text-sm text-gray-500">{user.full_name}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {user.rbac_roles.map((role, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {role.roleName}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onSelectUser(user)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Placeholder components for other tabs
const RolesManagement: React.FC<any> = () => <div className="bg-white p-6 rounded-lg shadow">Roles Management - Coming Soon</div>;
const PermissionsManagement: React.FC = () => <div className="bg-white p-6 rounded-lg shadow">Permissions Management - Coming Soon</div>;
const AuditTrail: React.FC = () => <div className="bg-white p-6 rounded-lg shadow">Audit Trail - Coming Soon</div>;

export default RBACDashboard;