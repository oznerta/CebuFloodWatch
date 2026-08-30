'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  Check,
  X,
  Trash2,
  Mail,
  Phone,
  Building,
  Key,
  Inbox,
  RefreshCw,
  MapPin,
  Lock,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { CEBU_BARANGAY_NAMES } from '@cebufloodwatch/shared';

interface Operator {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'barangay_focal' | 'first_responder' | 'citizen';
  barangay: string;
  status: 'active' | 'suspended';
  lastActive: string;
}

export default function UserManagementPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Operator Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'barangay_focal' | 'first_responder'>('barangay_focal');
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
      op.email.toLowerCase().includes(search.toLowerCase()) ||
      op.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetchApi<any>('/auth/users', {
        method: 'POST',
        body: JSON.stringify({
          fullName: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          barangay: newRole === 'admin' ? 'Global (Citywide Jurisdiction)' : newBarangay,
          phoneNumber: newPhone,
        }),
      });

      if (res && res.success) {
        await loadUsers();
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewPhone('');
        setInviteModalOpen(false);
      } else {
        setErrorMsg(res?.error || 'Failed to provision account.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating operator account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOperator = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke clearance for operator "${name}"?`)) return;

    try {
      const res = await fetchApi<any>(`/auth/users/${id}`, {
        method: 'DELETE',
      });
      if (res && res.success) {
        loadUsers();
      } else {
        alert(res?.error || 'Failed to delete operator.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting operator.');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#5856D6]/10 text-[#5856D6] border border-[#5856D6]/20 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> System Admin
          </span>
        );
      case 'first_responder':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 flex items-center gap-1">
            <Key className="w-3 h-3" /> First Responder (WASAR)
          </span>
        );
      case 'barangay_focal':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Barangay Focal
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600">
            Citizen
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5EA] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E5F1FF] border border-[#CCE3FF] flex items-center justify-center text-[#007AFF] shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#1C1C1E]">
              Operator & Clearance Management
            </h1>
            <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Provision official accounts, assign clearance roles, and configure territorial jurisdiction scopes
            </p>
          </div>
        </div>

        <button
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Provision New Operator
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">Total Operators</span>
          <span className="text-2xl font-black text-[#1C1C1E]">{operators.length}</span>
        </div>
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">System Admins</span>
          <span className="text-2xl font-black text-[#5856D6]">
            {operators.filter((o) => o.role === 'admin').length}
          </span>
        </div>
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">First Responders</span>
          <span className="text-2xl font-black text-[#34C759]">
            {operators.filter((o) => o.role === 'first_responder').length}
          </span>
        </div>
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">Barangay Focals</span>
          <span className="text-2xl font-black text-[#FF9500]">
            {operators.filter((o) => o.role === 'barangay_focal').length}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search operators by name, email, clearance, or barangay..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E5E5EA] rounded-2xl text-xs font-semibold text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#007AFF]"
          />
        </div>
        <button
          onClick={loadUsers}
          className="p-2.5 bg-white border border-[#E5E5EA] rounded-2xl text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Operator Table Card */}
      <div className="bg-white border border-[#E5E5EA] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E5E5EA] text-[11px] font-black uppercase text-[#8E8E93]">
                <th className="py-3.5 px-5">Official Operator</th>
                <th className="py-3.5 px-5">Clearance Tier</th>
                <th className="py-3.5 px-5">Territorial Scope</th>
                <th className="py-3.5 px-5">Contact Details</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F2F7]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#8E8E93]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#007AFF]" />
                    <span>Loading authorized operators...</span>
                  </td>
                </tr>
              ) : filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#8E8E93]">
                    <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span>No operator accounts found.</span>
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op) => (
                  <tr key={op.id} className="hover:bg-[#F8F9FA]/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E5F1FF] text-[#007AFF] font-black flex items-center justify-center text-xs">
                          {op.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-[#1C1C1E]">{op.name}</p>
                          <p className="text-[11px] text-[#8E8E93]">{op.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">{getRoleBadge(op.role)}</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 font-bold text-[#1C1C1E]">
                        <MapPin className="w-3.5 h-3.5 text-[#8E8E93]" />
                        <span>{op.barangay}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-[11px] text-[#8E8E93] space-y-0.5">
                        <p className="flex items-center gap-1 font-medium">
                          <Phone className="w-3 h-3" /> {op.phone || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {op.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteOperator(op.id, op.name)}
                          className="p-2 rounded-xl text-[#FF3B30] hover:bg-[#FFEBEA] transition-colors cursor-pointer"
                          title="Revoke clearance"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Provision Operator Account */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5EA] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#007AFF]" />
                <h3 className="text-base font-black text-[#1C1C1E]">Provision Operator Account</h3>
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="p-1 text-[#8E8E93] hover:text-[#1C1C1E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#FFEBEA] text-[#FF3B30] rounded-xl text-xs font-bold border border-[#FFD0CE]">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddOperator} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Captain Juan Dela Cruz"
                  className="w-full p-2.5 bg-[#F8F9FA] border border-[#E5E5EA] rounded-xl font-bold text-[#1C1C1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="juan@cebucity.gov.ph"
                  className="w-full p-2.5 bg-[#F8F9FA] border border-[#E5E5EA] rounded-xl font-bold text-[#1C1C1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                  Temporary Password (Min. 6 Chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create temporary password..."
                  className="w-full p-2.5 bg-[#F8F9FA] border border-[#E5E5EA] rounded-xl font-bold text-[#1C1C1E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                    Clearance Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full p-2.5 bg-[#F8F9FA] border border-[#E5E5EA] rounded-xl font-bold text-[#1C1C1E] focus:outline-none cursor-pointer"
                  >
                    <option value="barangay_focal">📍 Barangay Focal</option>
                    <option value="first_responder">🛟 First Responder (WASAR / BFP)</option>
                    <option value="admin">👑 System Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                    Assigned Barangay
                  </label>
                  <select
                    disabled={newRole === 'admin'}
                    value={newRole === 'admin' ? 'Global (Citywide Jurisdiction)' : newBarangay}
                    onChange={(e) => setNewBarangay(e.target.value)}
                    className="w-full p-2.5 bg-[#F8F9FA] border border-[#E5E5EA] rounded-xl font-bold text-[#1C1C1E] focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    {newRole === 'admin' ? (
                      <option value="Global (Citywide Jurisdiction)">Global (Citywide)</option>
                    ) : (
                      CEBU_BARANGAY_NAMES.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className="w-full p-2.5 bg-[#F8F9FA] border border-[#E5E5EA] rounded-xl font-bold text-[#1C1C1E] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E5EA] font-extrabold text-xs text-[#6C6C70] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Provisioning...' : 'Provision Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
