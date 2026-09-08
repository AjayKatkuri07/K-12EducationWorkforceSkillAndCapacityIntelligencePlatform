import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RoleGate from '../components/RoleGate';
import { formatDate, ROLE_CONFIG } from '../utils/formatters';
import {
  UserCheck,
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Key,
  Lock,
  X,
  AlertCircle
} from 'lucide-react';

export default function UserRoleManagementPage() {
  const { role, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('Employee');
  const [campus, setCampus] = useState('Oakridge High Campus');
  const [department, setDepartment] = useState('Mathematics & Computing');
  const [roleTitle, setRoleTitle] = useState('Instructional Faculty');
  const [savingUser, setSavingUser] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getUsers({ role: selectedRole, search });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('[UserManagement] Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentActive) => {
    try {
      const res = await usersAPI.updateStatus(userId, !currentActive);
      if (res.data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !currentActive } : u));
        setFeedback(`Account ${!currentActive ? 'activated' : 'deactivated'} successfully.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await usersAPI.updateRole(userId, newRole);
      if (res.data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setFeedback(`User role updated to ${newRole}.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingUser(true);
      const res = await usersAPI.createUser({
        name,
        email,
        password,
        role: userRole,
        campus,
        department,
        roleTitle
      });
      if (res.data.success) {
        setFeedback(`Created user ${name} with role ${userRole}.`);
        setShowCreateModal(false);
        setName('');
        setEmail('');
        setPassword('');
        loadUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSavingUser(false);
    }
  };

  const permissionsMatrix = [
    { capability: 'View personal schedule & assigned classes', Employee: true, TeamLead: true, WorkforcePlanner: true, HRAdmin: true },
    { capability: 'View department-wide skill matrix & availability', Employee: false, TeamLead: true, WorkforcePlanner: true, HRAdmin: true },
    { capability: 'Execute AI candidate comparisons for courses', Employee: false, TeamLead: true, WorkforcePlanner: true, HRAdmin: true },
    { capability: 'Authorize candidate assignments & overrides', Employee: false, TeamLead: true, WorkforcePlanner: true, HRAdmin: true },
    { capability: 'Generate predictive district capacity forecasts', Employee: false, TeamLead: false, WorkforcePlanner: true, HRAdmin: true },
    { capability: 'Manage users, roles & system master settings', Employee: false, TeamLead: false, WorkforcePlanner: false, HRAdmin: true },
    { capability: 'Inspect immutable append-only audit trail', Employee: false, TeamLead: false, WorkforcePlanner: true, HRAdmin: true }
  ];

  return (
    <RoleGate allowedRoles={['HRAdmin', 'WorkforcePlanner']}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>District Governance</span>
              <span>/</span>
              <span className="text-slate-800 font-semibold">User & Role Management</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              User Access & Role-Based Access Control (RBAC)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Least-privilege permission matrix, account activation, credential governance, and organizational scopes.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Institutional User</span>
          </button>
        </div>

        {feedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* User Search and Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts by name, email, role, or department..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <button
              onClick={loadUsers}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
            >
              Search
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Filter Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 font-semibold"
            >
              <option value="All">All Roles</option>
              <option value="Employee">Employee (Teacher/Staff)</option>
              <option value="TeamLead">Team Lead</option>
              <option value="WorkforcePlanner">Workforce Planner</option>
              <option value="HRAdmin">HR Admin</option>
            </select>
          </div>
        </div>

        {/* User Accounts Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User Account</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Department & Campus</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const id = u.id || u._id;
                  const roleMeta = ROLE_CONFIG[u.role] || { label: u.role, badgeClass: 'bg-slate-100 text-slate-800' };

                  return (
                    <tr key={id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(id, e.target.value)}
                          className={`text-xs font-semibold rounded-lg px-2 py-1 border border-slate-300 bg-white ${roleMeta.badgeClass}`}
                        >
                          <option value="Employee">Employee</option>
                          <option value="TeamLead">TeamLead</option>
                          <option value="WorkforcePlanner">WorkforcePlanner</option>
                          <option value="HRAdmin">HRAdmin</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium">{u.department || 'General Faculty'}</div>
                        <div className="text-[10px] text-slate-400">{u.campus || 'Oakridge High'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {u.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {u.lastLogin ? formatDate(u.lastLogin) : 'Pending first sign-in'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(id, u.active)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            u.active
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RBAC Permission Matrix Viewer */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Least-Privilege RBAC Permissions Matrix
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Operational Capability</th>
                  <th className="py-2.5 px-3 text-center">Employee</th>
                  <th className="py-2.5 px-3 text-center">Team Lead</th>
                  <th className="py-2.5 px-3 text-center">Workforce Planner</th>
                  <th className="py-2.5 px-3 text-center">HR Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissionsMatrix.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{item.capability}</td>
                    <td className="py-2.5 px-3 text-center">
                      {item.Employee ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.TeamLead ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.WorkforcePlanner ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.HRAdmin ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-start justify-between pb-2 border-b border-slate-100 mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Provision New Institutional Account</h3>
                  <p className="text-xs text-slate-500">Configure credentials with least-privilege defaults.</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Jordan Bell"
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Institutional Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jbell@oakridge.edu"
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                    >
                      <option value="Employee">Employee (Teacher)</option>
                      <option value="TeamLead">Team Lead</option>
                      <option value="WorkforcePlanner">Workforce Planner</option>
                      <option value="HRAdmin">HR Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Campus</label>
                    <select
                      value={campus}
                      onChange={(e) => setCampus(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                    >
                      <option value="Oakridge High Campus">Oakridge High</option>
                      <option value="Oakridge Middle Campus">Oakridge Middle</option>
                      <option value="Lincoln Elementary Campus">Lincoln Elementary</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingUser}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold shadow-xs disabled:opacity-50"
                  >
                    {savingUser ? 'Provisioning...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
}
