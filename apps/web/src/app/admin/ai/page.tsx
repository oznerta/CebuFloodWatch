'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Cpu,
  Eye,
  EyeOff,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Languages,
  Activity,
  BrainCircuit,
  Zap,
  Key,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function AIAdminPage() {
  // Provider & API Key State
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'anthropic'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);

  // Model & Vision State
  const [modelName, setModelName] = useState('gemini-1.5-flash');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.85);
  const [autoVerify, setAutoVerify] = useState(true);
  const [autoVerifyThreshold, setAutoVerifyThreshold] = useState(0.90);
  const [cebuanoDialect, setCebuanoDialect] = useState('Urban Metro Cebuano (Bisaya)');
  const [predictionLeadTime, setPredictionLeadTime] = useState(45);

  // Testing & Status State
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; sample?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load active backend config
  useEffect(() => {
    fetchApi<any>('/admin/config')
      .then((res) => {
        if (res) {
          const d = res.data !== undefined ? res.data : res;
          if (d.aiProvider) setAiProvider(d.aiProvider);
          if (d.modelName) setModelName(d.modelName);
          if (d.confidenceThreshold) setConfidenceThreshold(d.confidenceThreshold);
          if (typeof d.autoVerify === 'boolean') setAutoVerify(d.autoVerify);
          if (d.cebuanoDialect) setCebuanoDialect(d.cebuanoDialect);
          if (d.predictionLeadTime) setPredictionLeadTime(d.predictionLeadTime);
          if (d.hasApiKey) {
            setHasStoredKey(true);
            setApiKey(d.apiKeyMasked || '••••••••••••••••');
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleTestKey = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetchApi<any>('/admin/test-ai', {
        method: 'POST',
        body: JSON.stringify({
          aiProvider,
          apiKey: apiKey.includes('•••') ? undefined : apiKey,
        }),
      });

      if (res && res.success) {
        setTestResult({
          success: true,
          message: res.message,
          sample: res.sampleOutput,
        });
      } else {
        setTestResult({
          success: false,
          message: res?.error || 'Authentication error with AI provider.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect to AI API endpoint.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchApi('/admin/config', {
        method: 'POST',
        body: JSON.stringify({
          aiProvider,
          apiKey: apiKey.includes('•••') ? undefined : apiKey,
          modelName,
          confidenceThreshold,
          autoVerify,
          autoVerifyThreshold,
          predictionLeadTime,
          cebuanoDialect,
        }),
      });
      setSavedSuccess(true);
      setHasStoredKey(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error saving configuration to backend.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5EA] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E5F1FF] border border-[#CCE3FF] flex items-center justify-center text-[#007AFF] shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#1C1C1E]">
              AI Foundation Model & Secret API Gateway
            </h1>
            <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Securely configure foundation models, secret API keys, and automated flood triage thresholds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="text-xs font-bold text-[#34C759] flex items-center gap-1 bg-[#EBF9EE] px-3 py-1.5 rounded-xl border border-[#C3F0CD]">
              <CheckCircle2 className="w-4 h-4" /> AI Configuration Saved!
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save AI Credentials'}
          </button>
        </div>
      </div>

      {/* Security Architecture Badge */}
      <div className="bg-[#F8F9FA] border border-[#E5E5EA] rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#E5F1FF] flex items-center justify-center text-[#007AFF]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1C1C1E]">Zero-Exposure Backend Proxy Protection</p>
            <p className="text-[11px] text-[#8E8E93]">
              API keys are stored exclusively in backend memory and never sent to citizens, browsers, or mobile clients.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-[#EBF9EE] text-[#34C759] border border-[#C3F0CD] flex items-center gap-1">
          <Lock className="w-3 h-3" /> RBAC Admin Gated
        </span>
      </div>

      {/* Primary Card: AI Provider & API Key Provisioning */}
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-[#007AFF]" />
            <div>
              <h2 className="text-sm font-black text-[#1C1C1E]">Primary AI Engine & API Key</h2>
              <p className="text-[11px] text-[#8E8E93]">Powers bilingual emergency alerts, citizen report analysis & predictive floods</p>
            </div>
          </div>
          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
            hasStoredKey ? 'bg-[#EBF9EE] text-[#34C759]' : 'bg-[#FFEBEA] text-[#FF3B30]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasStoredKey ? 'bg-[#34C759]' : 'bg-[#FF3B30]'}`} />
            {hasStoredKey ? 'Key Configured' : 'No Key Provided'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* AI Provider Selection */}
          <div>
            <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1.5">
              Select AI Foundation Model Provider
            </label>
            <select
              value={aiProvider}
              onChange={(e) => {
                const prov = e.target.value as any;
                setAiProvider(prov);
                if (prov === 'gemini') setModelName('gemini-1.5-flash');
                else if (prov === 'openai') setModelName('gpt-4o-mini');
                else setModelName('claude-3-5-sonnet');
              }}
              className="w-full p-3 rounded-2xl bg-[#F8F9FA] border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E] focus:outline-none cursor-pointer"
            >
              <option value="gemini">Google Gemini AI (Recommended — Gemini 1.5 Flash)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
            </select>
          </div>

          {/* Model Name */}
          <div>
            <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1.5">
              Model Endpoint ID
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g. gemini-1.5-flash"
              className="w-full p-3 rounded-2xl bg-[#F8F9FA] border border-[#E5E5EA] text-xs font-mono font-bold text-[#1C1C1E] focus:outline-none"
            />
          </div>

          {/* Secret API Key Input */}
          <div>
            <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1.5">
              Provider Secret API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste secret API key (e.g. AIzaSy...)"
                className="flex-1 p-3 rounded-2xl bg-[#F8F9FA] border border-[#E5E5EA] text-xs font-mono font-bold text-[#1C1C1E] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-3 rounded-2xl bg-[#F8F9FA] border border-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] cursor-pointer"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Test Connection Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-[#F2F2F7]">
          <div className="text-xs">
            {testResult && (
              <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                testResult.success
                  ? 'bg-[#EBF9EE] border-[#C3F0CD] text-[#34C759]'
                  : 'bg-[#FFEBEA] border-[#FFD0CE] text-[#FF3B30]'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span className="font-bold">{testResult.message}</span>
                {testResult.sample && (
                  <span className="italic text-[#1C1C1E] ml-2">"{testResult.sample}"</span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleTestKey}
            disabled={testing || (!apiKey && !hasStoredKey)}
            className="px-4 py-2.5 rounded-2xl bg-[#E5F1FF] text-[#007AFF] hover:bg-[#007AFF] hover:text-white text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Verifying AI API...' : 'Test AI API Key Live'}
          </button>
        </div>
      </div>

      {/* Grid of Auxiliary AI Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Computer Vision Thresholds */}
        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#007AFF]" />
              <h3 className="text-sm font-black text-[#1C1C1E]">Computer Vision Thresholds</h3>
            </div>
            <span className="text-[10px] font-black uppercase bg-[#EBF9EE] text-[#34C759] px-2 py-0.5 rounded-full">
              YOLOv8 Active
            </span>
          </div>

          {/* Water Depth Confidence Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#1C1C1E]">Minimum Flood Detection Confidence</span>
              <span className="text-[#007AFF]">{(confidenceThreshold * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              className="w-full accent-[#007AFF] cursor-pointer"
            />
            <p className="text-[10px] text-[#8E8E93]">Citizen photos below this score will be flagged for manual dispatcher review.</p>
          </div>

          {/* Auto-Verify Checkbox */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA] border border-[#E5E5EA]">
            <div>
              <p className="text-xs font-extrabold text-[#1C1C1E]">Auto-Verify High-Confidence Reports</p>
              <p className="text-[10px] text-[#8E8E93]">Immediately mark incidents verified if AI score is {'>'} {(autoVerifyThreshold * 100).toFixed(0)}%</p>
            </div>
            <input
              type="checkbox"
              checked={autoVerify}
              onChange={(e) => setAutoVerify(e.target.checked)}
              className="w-5 h-5 rounded-md accent-[#007AFF] cursor-pointer"
            />
          </div>
        </div>

        {/* NLP & Translation Settings */}
        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#007AFF]" />
              <h3 className="text-sm font-black text-[#1C1C1E]">Bilingual Broadcast Intelligence</h3>
            </div>
            <span className="text-[10px] font-black uppercase bg-[#E5F1FF] text-[#007AFF] px-2 py-0.5 rounded-full">
              EN + CEB
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block">
              Regional Dialect & Tone
            </label>
            <select
              value={cebuanoDialect}
              onChange={(e) => setCebuanoDialect(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[#F8F9FA] border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E] focus:outline-none cursor-pointer"
            >
              <option value="Urban Metro Cebuano (Bisaya)">Urban Metro Cebuano (Bisaya) — High Urgency</option>
              <option value="Formal Cebuano (Provincial Government Standard)">Formal Cebuano (Provincial Standard)</option>
              <option value="Colloquial Cebuano (Casual / Youth Alert)">Colloquial Cebuano (Casual / Clear)</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#1C1C1E]">AI Flood Inundation Lead Time</span>
              <span className="text-[#007AFF]">{predictionLeadTime} Minutes</span>
            </div>
            <input
              type="range"
              min="15"
              max="120"
              step="5"
              value={predictionLeadTime}
              onChange={(e) => setPredictionLeadTime(parseInt(e.target.value, 10))}
              className="w-full accent-[#007AFF] cursor-pointer"
            />
            <p className="text-[10px] text-[#8E8E93]">Predictive time window for automated catchment surge alerts.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
