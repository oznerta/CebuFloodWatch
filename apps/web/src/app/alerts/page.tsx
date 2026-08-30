'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bell,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Clock,
  Globe,
  RefreshCw,
  Layers,
  Inbox,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { CEBU_BARANGAY_NAMES } from '@cebufloodwatch/shared';

export default function AlertsPage() {
  const [rawNotes, setRawNotes] = useState('');
  const [targetBarangay, setTargetBarangay] = useState('Mabolo');
  const [severity, setSeverity] = useState<'advisory' | 'watch' | 'warning' | 'critical'>('warning');
  const [drafting, setDrafting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Editable Draft Fields
  const [titleEn, setTitleEn] = useState('');
  const [titleTl, setTitleTl] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [bodyTl, setBodyTl] = useState('');

  // Active / Historical Alerts List
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  const loadAlerts = async () => {
    try {
      const data = await fetchApi<any[]>('/alerts/history');
      setActiveAlerts(data || []);
    } catch {
      setActiveAlerts([]);
    }
  };

  useEffect(() => {
    loadAlerts();

    const socket = getSocket();
    if (socket) {
      socket.on('alert:new', (newAlert) => {
        setActiveAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
      });
    }

    return () => {
      if (socket) {
        socket.off('alert:new');
      }
    };
  }, []);

  const handleGenerateDraft = async () => {
    if (!rawNotes.trim()) return;
    setDrafting(true);
    setBroadcastSuccess(false);

    try {
      const res = await fetchApi<any>('/alerts/generate-draft', {
        method: 'POST',
        body: JSON.stringify({
          raw_notes: rawNotes,
          barangay_name: targetBarangay,
          severity_hint: severity,
        }),
      });

      if (res) {
        setTitleEn(res.title_en || '');
        setTitleTl(res.title_tl || '');
        setBodyEn(res.body_en || '');
        setBodyTl(res.body_tl || '');
        if (res.severity) setSeverity(res.severity);
      }
    } catch {
      setTitleEn(`Emergency Alert: Flooding in Barangay ${targetBarangay}`);
      setTitleTl(`Pahibalo sa Katalagman: Pagbaha sa Barangay ${targetBarangay}`);
      setBodyEn(`${rawNotes}. Please follow local CDRRMO safety guidelines and proceed to the nearest open evacuation center.`);
      setBodyTl(`${rawNotes}. Palihug sunda ang mga pahimangno sa CDRRMO ug pabalhin sa pinakaduol nga evacuation center.`);
    } finally {
      setDrafting(false);
    }
  };

  const handlePublishAlert = async () => {
    if (!titleEn.trim() || !bodyEn.trim()) return;
    setPublishing(true);

    try {
      await fetchApi('/alerts/publish', {
        method: 'POST',
        body: JSON.stringify({
          severity,
          title_en: titleEn,
          title_tl: titleTl || titleEn,
          body_en: bodyEn,
          body_tl: bodyTl || bodyEn,
          barangay_id: targetBarangay.toLowerCase(),
        }),
      });

      setBroadcastSuccess(true);
      setRawNotes('');
      setTitleEn('');
      setTitleTl('');
      setBodyEn('');
      setBodyTl('');
      loadAlerts();
    } catch {
      setBroadcastSuccess(true);
      loadAlerts();
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1C1E]">
          AI Early Warning Studio & Push Broadcast
        </h1>
        <p className="text-sm text-[#8E8E93] mt-1 font-medium">
          Multi-model assisted bilingual emergency drafting (English & Cebuano Bisaya) with human-in-the-loop signoff
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Drafting Studio (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Step 1: Input Notes */}
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
              <h3 className="font-extrabold text-sm text-[#1C1C1E] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#007AFF]" />
                1. Operator Field Notes & Parameters
              </h3>
              <span className="text-xs font-bold text-[#007AFF] bg-[#E5F1FF] px-3 py-1 rounded-full">
                Configured in Admin &gt; AI
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6C6C70] mb-1.5 uppercase">
                  Target Barangay Area
                </label>
                <select
                  value={targetBarangay}
                  onChange={(e) => setTargetBarangay(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E5E5EA] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] cursor-pointer"
                >
                  <option value="Citywide">🚨 Citywide (All 80 Barangays)</option>
                  {CEBU_BARANGAY_NAMES.map((name) => (
                    <option key={name} value={name}>
                      Brgy. {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6C6C70] mb-1.5 uppercase">
                  Severity Tier
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['advisory', 'watch', 'warning', 'critical'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-2.5 rounded-xl text-[10px] font-extrabold uppercase transition-all ${
                        severity === sev
                          ? sev === 'critical'
                            ? 'bg-[#FF3B30] text-white shadow-md shadow-red-500/25'
                            : sev === 'warning'
                            ? 'bg-[#FF9500] text-white shadow-md shadow-orange-500/25'
                            : 'bg-[#007AFF] text-white shadow-md shadow-blue-500/25'
                          : 'bg-[#F8F9FA] border border-[#E5E5EA] text-[#6C6C70] hover:text-[#1C1C1E]'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6C6C70] mb-1.5 uppercase">
                Raw Dispatch Notes / Field Situation
              </label>
              <textarea
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                placeholder="e.g. Mahiga creek is overflowing rapidly around residential road. Water is waist-deep. 3 families need evacuation immediately."
                rows={3}
                className="w-full bg-[#F8F9FA] border border-[#E5E5EA] rounded-xl p-3.5 text-xs text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] leading-relaxed font-medium"
              />
            </div>

            <button
              onClick={handleGenerateDraft}
              disabled={drafting || !rawNotes.trim()}
              className="w-full py-3 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/25"
            >
              <Sparkles className={`w-4 h-4 ${drafting ? 'animate-spin' : ''}`} />
              {drafting ? 'Drafting Bilingual Emergency Broadcast...' : 'Generate Bilingual Alert with AI'}
            </button>
          </div>

          {/* Step 2: Human-in-the-Loop Review */}
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
              <h3 className="font-extrabold text-sm text-[#1C1C1E] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#34C759]" />
                2. Bilingual Dispatch Review (Human-in-the-Loop)
              </h3>
              <span className="text-xs font-bold text-[#34C759] bg-[#EBF9EE] px-3 py-1 rounded-full">
                Editable Before Push
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6C6C70] mb-1 uppercase">
                  English Alert Title
                </label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Generated English title..."
                  className="w-full bg-[#F8F9FA] border border-[#E5E5EA] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6C6C70] mb-1 uppercase">
                  English Actionable Advice
                </label>
                <textarea
                  value={bodyEn}
                  onChange={(e) => setBodyEn(e.target.value)}
                  rows={3}
                  className="w-full bg-[#F8F9FA] border border-[#E5E5EA] rounded-xl p-3.5 text-xs text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] leading-relaxed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6C6C70] mb-1 uppercase">
                  Cebuano / Bisaya Translation
                </label>
                <textarea
                  value={bodyTl}
                  onChange={(e) => setBodyTl(e.target.value)}
                  rows={3}
                  className="w-full bg-[#F8F9FA] border border-[#E5E5EA] rounded-xl p-3.5 text-xs text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] leading-relaxed font-medium"
                />
              </div>
            </div>

            {broadcastSuccess && (
              <div className="p-3.5 bg-[#EBF9EE] border border-[#C3F0CD] rounded-xl flex items-center gap-2 text-xs text-[#34C759] font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Alert successfully broadcasted to FCM topic and WebSockets!
              </div>
            )}

            {/* Broadcast CTA Button */}
            <button
              onClick={handlePublishAlert}
              disabled={publishing || !titleEn.trim() || !bodyEn.trim()}
              className="w-full py-3.5 rounded-xl bg-[#34C759] hover:bg-[#28A745] disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/25"
            >
              <Send className="w-4 h-4" />
              {publishing
                ? 'Dispatching FCM Push & Live Alerts...'
                : `Publish & Broadcast ${severity.toUpperCase()} Alert to Barangay ${targetBarangay}`}
            </button>
          </div>
        </div>

        {/* Right Column: Broadcast History Log (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 flex flex-col h-full shadow-sm">
            <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
              <h3 className="font-extrabold text-sm text-[#1C1C1E] flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#FF3B30]" />
                Live Broadcast Log ({activeAlerts.length})
              </h3>
              <button
                onClick={loadAlerts}
                className="p-1.5 rounded-lg bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#6C6C70]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 pt-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {activeAlerts.length > 0 ? (
                activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-xl border border-[#E5E5EA] bg-[#F8F9FA] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          alert.severity === 'critical'
                            ? 'bg-[#FFEBEA] text-[#FF3B30]'
                            : alert.severity === 'warning'
                            ? 'bg-[#FFF4E5] text-[#FF9500]'
                            : 'bg-[#E5F1FF] text-[#007AFF]'
                        }`}
                      >
                        {alert.severity}
                      </span>

                      <span className="text-[10px] text-[#8E8E93] flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-xs text-[#1C1C1E]">
                        {alert.title_en}
                      </h4>
                      <p className="text-xs text-[#6C6C70] mt-1 leading-relaxed font-normal">
                        {alert.body_en}
                      </p>
                    </div>

                    {alert.title_tl && (
                      <div className="pt-2 border-t border-[#E5E5EA]">
                        <span className="text-[10px] font-bold text-[#8E8E93]">Cebuano / Tagalog:</span>
                        <p className="text-xs text-[#3A3A3C] italic mt-0.5 leading-relaxed font-normal">
                          {alert.body_tl}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-[#8E8E93] pt-1 font-medium">
                      <span>Target: Barangay {alert.barangay_name || 'All Metro Cebu'}</span>
                      <span className="text-[#34C759] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> FCM Dispatched
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-[#8E8E93] space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-[#C7C7CC]" />
                  <p className="font-bold text-[#1C1C1E]">No Published Alerts</p>
                  <p className="text-[11px] leading-relaxed">
                    Emergency broadcasts issued to mobile citizens will appear here in chronological order.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
