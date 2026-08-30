'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  Check,
  X,
  MoreVertical,
  Mail,
  Phone,
  Building,
  Key,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

interface Operator {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'lgu_officer' | 'responder' | 'citizen';
  barangay: string;
  status: 'active' | 'suspended';
  lastActive: string;
}

export default function UserManagementPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'lgu_officer' | 'responder'>('lgu_officer');
  const [newBarangay, setNewBarangay] = useState('Mabolo');
  const [newPhone, setNewPhone] = useState('');

  const loadUsers = async () => {
    try {
      const res = await fetchApi<any>('/auth/users');
      if (res && res.data) {
        setOperators(res.data);
      } else {
        setOperators([]);
      }
    } catch {
      setOperators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredOperators = operators.filter(
    (op) =>
      op.name.toLowerCase().includes(search.toLowerCase()) ||
      op.barangay.toLowerCase().includes(search.toLowerCase()) ||
      op.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;

    try {
      const res = await fetchApi<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          barangay: newBarangay,
          phone_number: newPhone,
        }),
      });

      if (res && res.success) {
        loadUsers();
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewPhone('');
        setInviteModalOpen(false);
      } else {
        alert(res?.error || 'Failed to create operator.');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating operator.');
    }
  };

  const getRoleBadge = (role: Operator['role']) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#E5F1FF] text-[#007AFF] border border-[#CCE3FF]">ADMINISTRATOR</span>;
      case 'lgu_officer':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EBF9EE] text-[#34C759] border border-[#C3F0CD]">LGU DISPATCHER</span>;
      case 'responder':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#FFF4E5] text-[#FF9500] border border-[#FFE4BE]">WASAR RESCUE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#F2F2F7] text-[#6C6C70] border border-[#E5E5EA]">CITIZEN</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5EA] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E5F1FF] border border-[#CCE3FF] flex items-center justify-center text-[#007AFF] shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#1C1C1E]">
              User Management & RBAC Permissions
            </h1>
            <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Manage CDRRMO command operators, barangay responders, and security clearance roles
            </p>
          </div>
        </div>

        <button
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add Operator / Dispatcher
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-[#E5E5EA] rounded-2xl px-4 py-2.5 shadow-xs">
          <Search className="w-4 h-4 text-[#8E8E93]" />
          <input
            type="text"
            placeholder="Filter operators by name, email, or barangay..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-semibold text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none"
          />
        </div>

        <button
          onClick={loadUsers}
          className="p-2.5 rounded-2xl bg-white border border-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E]"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Operators Table */}
      {filteredOperators.length > 0 ? (
        <div className="bg-white border border-[#E5E5EA] rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] border-b border-[#E5E5EA] text-[#8E8E93] font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Operator</th>
                  <th className="py-3 px-5">Role & Clearance</th>
                  <th className="py-3 px-5">Assigned Barangay</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Last Active</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {filteredOperators.map((op) => (
                  <tr key={op.id} className="hover:bg-[#F8F9FA]/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#E5F1FF] border border-[#CCE3FF] flex items-center justify-center font-bold text-xs text-[#007AFF]">
                          {op.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-[#1C1C1E]">{op.name}</p>
                          <p className="text-[11px] text-[#8E8E93]">{op.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">{getRoleBadge(op.role)}</td>
                    <td className="py-3.5 px-5 font-bold text-[#1C1C1E]">{op.barangay}</td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#34C759]">
                        <span className="w-2 h-2 rounded-full bg-[#34C759]" />
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[#8E8E93] font-medium">{op.lastActive}</td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => alert(`Operator account ${op.name} is active.`)}
                        className="px-2.5 py-1 rounded-lg bg-[#F2F2F7] hover:bg-[#E5E5EA] text-xs font-bold text-[#1C1C1E] transition-all"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <Inbox className="w-10 h-10 text-[#C7C7CC] mx-auto" />
          <h3 className="text-base font-extrabold text-[#1C1C1E]">No Operators Registered Yet</h3>
          <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
            Click "Add Operator" above or register new accounts from the login page.
          </p>
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5EA] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
              <h3 className="font-black text-base text-[#1C1C1E]">Add CDRRMO Dispatcher</h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddOperator} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold uppercase text-[#8E8E93] block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Tan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] font-semibold text-[#1C1C1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#8E8E93] block mb-1">
                  Official Gov / LGU Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="maria.tan@cebucity.gov.ph"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] font-semibold text-[#1C1C1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#8E8E93] block mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Create password for operator..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] font-semibold text-[#1C1C1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#8E8E93] block mb-1">
                  Security Clearance Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] font-bold text-[#1C1C1E] focus:outline-none"
                >
                  <option value="lgu_officer">LGU Dispatcher (Verify Reports & Broadcast Alerts)</option>
                  <option value="responder">WASAR Responder (Field Emergency Rescue)</option>
                  <option value="admin">System Administrator (Full Settings Clearance)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F2F2F7]">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#F2F2F7] text-[#6C6C70] font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#007AFF] text-white font-extrabold text-xs shadow-md shadow-blue-500/20"
                >
                  Create & Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
