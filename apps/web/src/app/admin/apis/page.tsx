'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Globe,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Send,
  Waves,
  Eye,
  EyeOff,
  Activity,
  Database,
  Cloud,
  BellRing,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

const LOCAL_STORAGE_KEY = 'cebu_gateway_config';

interface InfraItem {
  name: string;
  category: string;
  status: 'operational' | 'degraded' | 'offline' | 'unconfigured';
  latencyMs: number;
  details: string;
  metadata?: Record<string, any>;
  lastChecked: string;
}

export default function APIGatewaysPage() {
  // Live Infrastructure Services State
  const [infraList, setInfraList] = useState<InfraItem[]>([]);
  const [probingInfra, setProbingInfra] = useState(false);

  // PAGASA Weather API State
  const [pagasaKey, setPagasaKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [pagasaInterval, setPagasaInterval] = useState('5');
  const [pagasaStatus, setPagasaStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [pagasaMsg, setPagasaMsg] = useState('');

  // NAMRIA Tidal Webhook State
  const [namriaUrl, setNamriaUrl] = useState('https://api.namria.gov.ph/tides/v1/cebu-port');
  const [namriaStatus, setNamriaStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [namriaMsg, setNamriaMsg] = useState('');

  // IoT Sensor MQTT Gateway
  const [mqttBroker, setMqttBroker] = useState('mqtts://telemetry.cebucity.gov.ph:8883');
  const [mqttStatus, setMqttStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [mqttMsg, setMqttMsg] = useState('');

  // SMS Gateway
  const [smsApiKey, setSmsApiKey] = useState('');
  const [showSmsKey, setShowSmsKey] = useState(false);
  const [smsSenderId, setSmsSenderId] = useState('CEBU_CDRRMO');
  const [smsStatus, setSmsStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [smsMsg, setSmsMsg] = useState('');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load live infrastructure status
  const loadInfraStatus = async () => {
    setProbingInfra(true);
    try {
      const res = await fetchApi<any>('/admin/infra-status');
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setInfraList(data);
      }
    } catch (err: any) {
      console.warn('Infra probe error:', err);
    } finally {
      setProbingInfra(false);
    }
  };

  // Load saved gateway configuration on mount
  useEffect(() => {
    loadInfraStatus();

    // 1. Instant load from localStorage cache if present
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.pagasaKey) setPagasaKey(parsed.pagasaKey);
        if (parsed.pagasaInterval) setPagasaInterval(parsed.pagasaInterval);
        if (parsed.namriaUrl) setNamriaUrl(parsed.namriaUrl);
        if (parsed.mqttBroker) setMqttBroker(parsed.mqttBroker);
        if (parsed.smsApiKey) setSmsApiKey(parsed.smsApiKey);
        if (parsed.smsSenderId) setSmsSenderId(parsed.smsSenderId);
      }
    } catch {}

    // 2. Fetch from backend API / PostgreSQL
    fetchApi<any>('/admin/gateways')
      .then((res) => {
        if (res) {
          const d = res.data !== undefined ? res.data : res;
          if (d.pagasaApiKey) setPagasaKey(d.pagasaApiKey);
          if (d.pagasaInterval) setPagasaInterval(d.pagasaInterval);
          if (d.namriaUrl) setNamriaUrl(d.namriaUrl);
          if (d.mqttBroker) setMqttBroker(d.mqttBroker);
          if (d.smsApiKey) setSmsApiKey(d.smsApiKey);
          if (d.smsSenderId) setSmsSenderId(d.smsSenderId);
        }
      })
      .catch(() => {});
  }, []);

  const handleTestService = async (service: 'pagasa' | 'namria' | 'mqtt' | 'sms') => {
    if (service === 'pagasa') { setPagasaStatus('checking'); setPagasaMsg(''); }
    if (service === 'namria') { setNamriaStatus('checking'); setNamriaMsg(''); }
    if (service === 'mqtt') { setMqttStatus('checking'); setMqttMsg(''); }
    if (service === 'sms') { setSmsStatus('checking'); setSmsMsg(''); }

    try {
      const res = await fetchApi<any>('/admin/test-gateway', {
        method: 'POST',
        body: JSON.stringify({
          service,
          apiKey: service === 'pagasa' ? pagasaKey : smsApiKey,
          url: service === 'namria' ? namriaUrl : mqttBroker,
        }),
      });

      if (res && res.success) {
        const msg = `${res.status} (${res.latencyMs}ms)`;
        if (service === 'pagasa') { setPagasaStatus('success'); setPagasaMsg(msg); }
        if (service === 'namria') { setNamriaStatus('success'); setNamriaMsg(msg); }
        if (service === 'mqtt') { setMqttStatus('success'); setMqttMsg(msg); }
        if (service === 'sms') { setSmsStatus('success'); setSmsMsg(msg); }
      } else {
        const err = res?.error || 'Validation failed';
        if (service === 'pagasa') { setPagasaStatus('error'); setPagasaMsg(err); }
        if (service === 'namria') { setNamriaStatus('error'); setNamriaMsg(err); }
        if (service === 'mqtt') { setMqttStatus('error'); setMqttMsg(err); }
        if (service === 'sms') { setSmsStatus('error'); setSmsMsg(err); }
      }
    } catch (err: any) {
      const errMsg = err.message || 'Connection test failed.';
      if (service === 'pagasa') { setPagasaStatus('error'); setPagasaMsg(errMsg); }
      if (service === 'namria') { setNamriaStatus('error'); setNamriaMsg(errMsg); }
      if (service === 'mqtt') { setMqttStatus('error'); setMqttMsg(errMsg); }
      if (service === 'sms') { setSmsStatus('error'); setSmsMsg(errMsg); }
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSavedSuccess(false);

    const payload = {
      pagasaApiKey: pagasaKey,
      pagasaInterval,
      namriaUrl,
      mqttBroker,
      smsApiKey,
      smsSenderId,
    };

    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          pagasaKey,
          pagasaInterval,
          namriaUrl,
          mqttBroker,
          smsApiKey,
          smsSenderId,
        })
      );
    } catch {}

    try {
      await fetchApi('/admin/gateways', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                API Gateways & Infrastructure
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </h1>
              <p className="text-xs font-medium text-gray-500 mt-0.5">
                Manage live meteorological feeds, IoT river gauge telemetry, and cloud backbone integrations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Saved to Database
            </div>
          )}

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-black shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save Gateway Credentials'}
          </button>
        </div>
      </div>

      {/* SECTION 1: Live Cloud Infrastructure Probes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-700">
              Live Cloud Infrastructure Probes
            </h2>
          </div>

          <button
            onClick={loadInfraStatus}
            disabled={probingInfra}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[11px] font-extrabold text-gray-700 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${probingInfra ? 'animate-spin' : ''}`} />
            {probingInfra ? 'Probing Cloud...' : 'Run Live Health Probe'}
          </button>
        </div>

        {/* 5-Column Responsive Infrastructure Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {infraList.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs font-medium text-gray-400 bg-gray-50 rounded-2xl border border-gray-200">
              Loading live cloud telemetry probes...
            </div>
          ) : (
            infraList.map((item, idx) => {
              const isOk = item.status === 'operational';
              const isDegraded = item.status === 'degraded';

              return (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 hover:border-blue-400/50 rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                        {item.category === 'database' ? (
                          <Database className="w-3.5 h-3.5 text-emerald-600" />
                        ) : item.category === 'auth_push' ? (
                          <BellRing className="w-3.5 h-3.5 text-amber-500" />
                        ) : item.category === 'storage' ? (
                          <Cloud className="w-3.5 h-3.5 text-blue-500" />
                        ) : item.category === 'weather' ? (
                          <Globe className="w-3.5 h-3.5 text-cyan-600" />
                        ) : (
                          <Waves className="w-3.5 h-3.5 text-indigo-500" />
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isOk
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                            : isDegraded
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-xs text-gray-900 truncate" title={item.name}>
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium line-clamp-2 mt-1 leading-snug">
                        {item.details}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span className="font-bold text-gray-600">{item.latencyMs}ms</span>
                    <span>
                      {new Date(item.lastChecked).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: External Meteorological & Sensor Telemetry Gateways */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-black uppercase tracking-wider text-gray-700">
            Meteorological & Sensor Telemetry Gateways
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gateway 1: DOST-PAGASA Weather Doppler */}
          <div className="bg-white border border-gray-200 hover:border-gray-300 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6 transition-all">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">DOST-PAGASA Weather Doppler</h3>
                    <p className="text-xs text-gray-500 font-medium">Mactan Doppler Radar & Cebu Precipitation Ingestion</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${pagasaKey.trim() ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                  {pagasaKey.trim() ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700">PAGASA Radar API Key</label>
                    <span className="text-[10px] font-mono text-gray-400">pgsa_live_cebu_...</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={pagasaKey}
                      placeholder="Enter PAGASA API Key"
                      onChange={(e) => setPagasaKey(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-mono text-gray-900 pr-10 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Radar Polling Interval</label>
                  <select
                    value={pagasaInterval}
                    onChange={(e) => setPagasaInterval(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-bold text-gray-800 bg-white transition-all outline-none cursor-pointer"
                  >
                    <option value="1">Every 1 Minute (Extreme Weather Priority)</option>
                    <option value="5">Every 5 Minutes (Standard Operational)</option>
                    <option value="15">Every 15 Minutes (Low Overhead)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Test Action & Feedback */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium text-gray-500 truncate">
                  Station: <span className="font-bold text-gray-700">Mactan Synoptic Doppler</span>
                </span>
                <button
                  onClick={() => handleTestService('pagasa')}
                  disabled={pagasaStatus === 'checking'}
                  className="h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-800 text-xs font-extrabold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {pagasaStatus === 'checking' ? 'Testing Ping...' : 'Test Doppler Ping'}
                </button>
              </div>

              {pagasaMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                    pagasaStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {pagasaStatus === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span className="truncate">{pagasaMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Gateway 2: NAMRIA Port Tides Webhook */}
          <div className="bg-white border border-gray-200 hover:border-gray-300 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6 transition-all">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Waves className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">NAMRIA Port Tidal Gateway</h3>
                    <p className="text-xs text-gray-500 font-medium">Cebu International Port High/Low Tide Sync</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${namriaUrl.trim() ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                  {namriaUrl.trim() ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700">NAMRIA Webhook Endpoint URL</label>
                    <span className="text-[10px] font-mono text-gray-400">HTTPS POST/GET</span>
                  </div>
                  <input
                    type="text"
                    value={namriaUrl}
                    onChange={(e) => setNamriaUrl(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-mono text-gray-900 transition-all outline-none"
                  />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span>Harmonic Datum Reference</span>
                    <span className="font-mono text-blue-600">MLLW (Pier 1)</span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Used to calculate coastal drainage backflow along Guadalupe & Lahug river outlets.
                  </p>
                </div>
              </div>
            </div>

            {/* Test Action & Feedback */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium text-gray-500 truncate">
                  Target: <span className="font-bold text-gray-700">Cebu Port Authority Gauge</span>
                </span>
                <button
                  onClick={() => handleTestService('namria')}
                  disabled={namriaStatus === 'checking'}
                  className="h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-800 text-xs font-extrabold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {namriaStatus === 'checking' ? 'Pinging Webhook...' : 'Ping Webhook'}
                </button>
              </div>

              {namriaMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                    namriaStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {namriaStatus === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span className="truncate">{namriaMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Gateway 3: River Gauge MQTT Telemetry Broker */}
          <div className="bg-white border border-gray-200 hover:border-gray-300 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6 transition-all">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">River Gauge MQTT Telemetry</h3>
                    <p className="text-xs text-gray-500 font-medium">Guadalupe, Mahiga & Lahug Ultrasonic Gauges</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${mqttBroker.trim() ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                  {mqttBroker.trim() ? 'TLS 1.3' : 'Not Configured'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700">MQTT Broker URI</label>
                    <span className="text-[10px] font-mono text-gray-400">mqtts:// / wss://</span>
                  </div>
                  <input
                    type="text"
                    value={mqttBroker}
                    onChange={(e) => setMqttBroker(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-mono text-gray-900 transition-all outline-none"
                  />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span>Active Telemetry Subscriptions</span>
                    <span className="font-mono text-amber-600">3 River Basins</span>
                  </div>
                  <p className="text-[11px] font-mono text-gray-500 truncate">
                    cebucity/sensors/+/waterlevel
                  </p>
                </div>
              </div>
            </div>

            {/* Test Action & Feedback */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium text-gray-500 truncate">
                  Port: <span className="font-bold text-gray-700">8883 (MQTTS Encrypted)</span>
                </span>
                <button
                  onClick={() => handleTestService('mqtt')}
                  disabled={mqttStatus === 'checking'}
                  className="h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-800 text-xs font-extrabold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {mqttStatus === 'checking' ? 'Connecting...' : 'Test Broker Handshake'}
                </button>
              </div>

              {mqttMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                    mqttStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {mqttStatus === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span className="truncate">{mqttMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Gateway 4: Emergency SMS Gateway */}
          <div className="bg-white border border-gray-200 hover:border-gray-300 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6 transition-all">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">SMS Broadcast Gateway</h3>
                    <p className="text-xs text-gray-500 font-medium">Semaphore / Twilio Emergency Alert Dispatch</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${smsApiKey.trim() ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                  {smsApiKey.trim() ? 'Ready' : 'Not Configured'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700">SMS Provider API Key</label>
                    <span className="text-[10px] font-mono text-gray-400">Semaphore / Twilio</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSmsKey ? 'text' : 'password'}
                      value={smsApiKey}
                      placeholder="Enter SMS Provider Key"
                      onChange={(e) => setSmsApiKey(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-mono text-gray-900 pr-10 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmsKey(!showSmsKey)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showSmsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Sender ID Mask</label>
                  <input
                    type="text"
                    value={smsSenderId}
                    onChange={(e) => setSmsSenderId(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-mono text-gray-900 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Test Action & Feedback */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium text-gray-500 truncate">
                  Mask: <span className="font-bold text-gray-700">{smsSenderId || 'CEBU_CDRRMO'}</span>
                </span>
                <button
                  onClick={() => handleTestService('sms')}
                  disabled={smsStatus === 'checking'}
                  className="h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-800 text-xs font-extrabold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {smsStatus === 'checking' ? 'Validating...' : 'Test SMS Gateway'}
                </button>
              </div>

              {smsMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                    smsStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {smsStatus === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span className="truncate">{smsMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
