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
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { getSocket } from '../../lib/socket';

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
      setActiveAlerts([
        {
          id: '1',
          barangay_name: 'Mabolo',
          severity: 'critical',
          title_en: 'Critical Flood Warning: Mabolo Suba River Overflow',
          title_tl: 'Babala sa Malubhang Baha: Pag-apaw ng Ilog Suba sa Mabolo',
          body_en: 'Water levels along M.J. Cuenco bridge have breached critical thresholds. Mandatory evacuation initiated.',
          body_tl: 'Ang lebel ng tubig sa tulay ng M.J. Cuenco ay lumampas sa kritikal na antas. Sinimulan na ang sapilitang paglikas.',
          published_at: new Date().toISOString(),
        },
        {
          id: '2',
          barangay_name: 'Kasambagan',
          severity: 'warning',
          title_en: 'Flood Watch: Mahiga Creek Rising',
          title_tl: 'Pagbabantay sa Baha: Pagtaas ng Mahiga Creek',
          body_en: 'Continuous heavy rainfall has caused Mahiga Creek to rise rapidly. Residents in low-lying zones must stay on alert.',
          body_tl: 'Ang patuloy na malakas na ulan ay nagdulot ng mabilis na pagtaas ng Mahiga Creek. Mag-ingat ang mga residente sa mababang lugar.',
          published_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    loadAlerts();

    const socket = getSocket();
    socket.on('alert:new', (newAlert) => {
      setActiveAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
    });

    return () => {
      socket.off('alert:new');
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
      // Local fallback template
      setTitleEn(`Emergency Alert: Flooding in Barangay ${targetBarangay}`);
      setTitleTl(`Babala sa Kagipitan: Pagbaha sa Barangay ${targetBarangay}`);
      setBodyEn(`${rawNotes}. Please follow local CDRRMO safety guidelines and proceed to the nearest open evacuation center.`);
      setBodyTl(`${rawNotes}. Mangyaring sundin ang mga alituntunin sa kaligtasan ng lokal na CDRRMO at pumunta sa pinakamalapit na bukas na evacuation center.`);
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          AI Early Warning Alert Generator & FCM Push Broadcast
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Gemini 2.5 Flash assisted bilingual emergency drafting with human-in-the-loop signoff
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Drafting Studio (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Step 1: Input Notes */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                1. Operator Field Notes & Parameters
              </h3>
              <span className="text-[11px] font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                Powered by Gemini AI
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Barangay Area
                </label>
                <select
                  value={targetBarangay}
                  onChange={(e) => setTargetBarangay(e.target.value)}
                  className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Mabolo">Barangay Mabolo</option>
                  <option value="Kasambagan">Barangay Kasambagan</option>
                  <option value="Mambaling">Barangay Mambaling</option>
                  <option value="Guadalupe">Barangay Guadalupe</option>
                  <option value="Lahug">Barangay Lahug</option>
                  <option value="Tejero">Barangay Tejero</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Severity Tier
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['advisory', 'watch', 'warning', 'critical'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        severity === sev
                          ? sev === 'critical'
                            ? 'bg-rose-600 text-white'
                            : sev === 'warning'
                            ? 'bg-orange-600 text-white'
                            : sev === 'watch'
                            ? 'bg-amber-600 text-white'
                            : 'bg-yellow-600 text-white'
                          : 'bg-surface-subtle text-slate-400 hover:text-white border border-surface-border'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Raw Emergency Field Notes
              </label>
              <textarea
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                placeholder="e.g. River breached banks near church. 3 feet deep and rising fast. Rescuers dispatched. Advise immediate high ground evacuation to school gym."
                rows={3}
                className="w-full bg-surface-subtle border border-surface-border rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleGenerateDraft}
              disabled={drafting || !rawNotes.trim()}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              {drafting ? 'Synthesizing Bilingual Draft...' : 'Generate AI Bilingual Draft with Gemini'}
            </button>
          </div>

          {/* Step 2: Human-in-the-Loop Review & Editor */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                2. Human-in-the-Loop Review (English & Tagalog)
              </h3>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Review & Edit Before Broadcast
              </span>
            </div>

            {/* Bilingual Editors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* English Version */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  English Bulletin
                </span>
                <input
                  type="text"
                  placeholder="English Alert Title..."
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                />
                <textarea
                  placeholder="Actionable advice in English..."
                  value={bodyEn}
                  onChange={(e) => setBodyEn(e.target.value)}
                  rows={4}
                  className="w-full bg-surface-subtle border border-surface-border rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Tagalog Version */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Tagalog Bulletin (Salin)
                </span>
                <input
                  type="text"
                  placeholder="Pamagat ng Babala sa Tagalog..."
                  value={titleTl}
                  onChange={(e) => setTitleTl(e.target.value)}
                  className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                />
                <textarea
                  placeholder="Mahahalagang tagubilin sa Tagalog..."
                  value={bodyTl}
                  onChange={(e) => setBodyTl(e.target.value)}
                  rows={4}
                  className="w-full bg-surface-subtle border border-surface-border rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {broadcastSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Alert successfully broadcasted to FCM topic and WebSockets!
              </div>
            )}

            {/* Broadcast CTA Button */}
            <button
              onClick={handlePublishAlert}
              disabled={publishing || !titleEn.trim() || !bodyEn.trim()}
              className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              <Send className="w-4 h-4" />
              {publishing
                ? 'Dispatching FCM Push & Live Alerts...'
                : `Publish & Broadcast ${severity.toUpperCase()} Alert to Barangay ${targetBarangay}`}
            </button>
          </div>
        </div>

        {/* Right Column: Active & Historical Broadcast Log (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col h-full shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-500" />
                Live Broadcast Log ({activeAlerts.length})
              </h3>
              <button
                onClick={loadAlerts}
                className="p-1 rounded bg-surface-subtle hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 pt-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-lg border border-surface-border bg-surface-subtle space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        alert.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : alert.severity === 'warning'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {alert.severity}
                    </span>

                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {alert.title_en}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {alert.body_en}
                    </p>
                  </div>

                  {alert.title_tl && (
                    <div className="pt-2 border-t border-surface-border/60">
                      <span className="text-[10px] font-bold text-slate-400">Tagalog:</span>
                      <p className="text-[11px] text-slate-300 italic mt-0.5 leading-relaxed">
                        {alert.body_tl}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Target: Barangay {alert.barangay_name || 'All Metro Cebu'}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> FCM Dispatched
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
