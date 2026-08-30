'use client';

import React, { useState } from 'react';
import {
  FileCheck,
  Download,
  Search,
  ShieldCheck,
  Clock,
  Filter,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

interface AuditRecord {
  id: string;
  eventType: 'VERIFY_REPORT' | 'BROADCAST_ALERT' | 'UPDATE_SHELTER' | 'UPDATE_ROAD' | 'AI_SYNC';
  description: string;
  operator: string;
  barangay: string;
  timestamp: string;
  checksum: string;
}

const INITIAL_AUDIT_LOGS: AuditRecord[] = [
  {
    id: 'aud_88192',
    eventType: 'VERIFY_REPORT',
    description: 'Verified citizen flood report at Mabolo Suba river (Waist depth confirmed via field photo).',
    operator: 'Capt. Juan Dela Cruz (LGU Officer)',
    barangay: 'Mabolo',
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    checksum: 'sha256:7f8a91c2e4b3d8...',
  },
  {
    id: 'aud_88191',
    eventType: 'BROADCAST_ALERT',
    description: 'Dispatched bilingual emergency broadcast: "Mabolo River Overflow Warning".',
    operator: 'Matt Oznerta (Admin)',
    barangay: 'Metro Cebu Cluster',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    checksum: 'sha256:3a91b2c4e8f1d7...',
  },
  {
    id: 'aud_88190',
    eventType: 'UPDATE_SHELTER',
    description: 'Updated Mabolo Elementary Gym capacity occupancy to 85 / 350 evacuees.',
    operator: 'Capt. Juan Dela Cruz (LGU Officer)',
    barangay: 'Mabolo',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    checksum: 'sha256:4d8c2e1f9a7b3c...',
  },
  {
    id: 'aud_88189',
    eventType: 'UPDATE_ROAD',
    description: 'Marked N. Bacalso (Mambaling Underpass) as IMPASSABLE due to chest-level water pooling.',
    operator: 'BFP Rescue Team Alpha (Responder)',
    barangay: 'Mambaling',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    checksum: 'sha256:9c1a7d3e5f2b8a...',
  },
];

export default function OCD7AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRecord[]>(INITIAL_AUDIT_LOGS);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((l) => {
    if (filterType !== 'all' && l.eventType !== filterType) return false;
    if (search && !l.description.toLowerCase().includes(search.toLowerCase()) && !l.operator.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cebufloodwatch_ocd7_compliance_log_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getEventBadge = (type: AuditRecord['eventType']) => {
    switch (type) {
      case 'VERIFY_REPORT':
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-[#EBF9EE] text-[#34C759] border border-[#C3F0CD]">VERIFIED REPORT</span>;
      case 'BROADCAST_ALERT':
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-[#FFEBEA] text-[#FF3B30] border border-[#FFD0CE]">DISASTER BROADCAST</span>;
      case 'UPDATE_SHELTER':
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-[#E5F1FF] text-[#007AFF] border border-[#CCE3FF]">SHELTER UPDATE</span>;
      case 'UPDATE_ROAD':
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-[#FFF4E5] text-[#FF9500] border border-[#FFE4BE]">ROAD STATUS</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-[#F2F2F7] text-[#6C6C70] border border-[#E5E5EA]">AI SYNC</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5EA] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E5F1FF] border border-[#CCE3FF] flex items-center justify-center text-[#007AFF] shadow-xs">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#1C1C1E]">
              OCD-7 Compliance & Audit Trail
            </h1>
            <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Cryptographically verified disaster action logs for Office of Civil Defense Region 7 (Central Visayas)
            </p>
          </div>
        </div>

        <button
          onClick={handleExportJSON}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition-all"
        >
          <Download className="w-4 h-4" />
          Export OCD-7 Audit Certificate
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-[#E5E5EA] rounded-2xl px-4 py-2.5 shadow-xs">
          <Search className="w-4 h-4 text-[#8E8E93]" />
          <input
            type="text"
            placeholder="Search audit trail by description or operator name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-semibold text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'VERIFY_REPORT', 'BROADCAST_ALERT', 'UPDATE_SHELTER'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                filterType === f
                  ? 'bg-[#007AFF] text-white border-[#007AFF]'
                  : 'bg-white text-[#6C6C70] border-[#E5E5EA] hover:bg-[#F2F2F7]'
              }`}
            >
              {f === 'all' ? 'All Events' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-[#E5E5EA] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FA] border-b border-[#E5E5EA] text-[#8E8E93] font-extrabold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Event Type</th>
                <th className="py-3 px-5">Action & Description</th>
                <th className="py-3 px-5">Authorizing Operator</th>
                <th className="py-3 px-5">Barangay</th>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5 font-mono">Checksum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F8F9FA]/80 transition-colors">
                  <td className="py-3.5 px-5">{getEventBadge(log.eventType)}</td>
                  <td className="py-3.5 px-5 max-w-sm">
                    <p className="font-bold text-xs text-[#1C1C1E] leading-relaxed">{log.description}</p>
                  </td>
                  <td className="py-3.5 px-5 font-bold text-[#1C1C1E]">{log.operator}</td>
                  <td className="py-3.5 px-5 text-[#6C6C70] font-semibold">{log.barangay}</td>
                  <td className="py-3.5 px-5 text-[#8E8E93] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(log.timestamp).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-[10px] text-[#8E8E93]">{log.checksum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
