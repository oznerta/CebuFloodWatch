'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  Eye,
  Sliders,
  CheckCircle2,
  Save,
  RefreshCw,
  Languages,
  Activity,
  Layers,
  BrainCircuit,
  Zap,
} from 'lucide-react';

export default function AIAdminPage() {
  // Computer Vision State
  const [visionModel, setVisionModel] = useState('YOLOv8-CebuFlood-WaterDepth v2.4');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.85);
  const [autoVerify, setAutoVerify] = useState(true);
  const [autoVerifyThreshold, setAutoVerifyThreshold] = useState(0.92);

  // NLP Bilingual Engine State
  const [nlpModel, setNlpModel] = useState('Gemini 1.5 Flash (Ultra-Low Latency)');
  const [cebuanoDialect, setCebuanoDialect] = useState('Urban Metro Cebuano (Bisaya)');
  const [emergencyTone, setEmergencyTone] = useState<'authoritative' | 'standard' | 'advisory'>('authoritative');

  // Predictive Runoff AI State
  const [predictionLeadTime, setPredictionLeadTime] = useState(45); // in minutes
  const [sensorSensitivity, setSensorSensitivity] = useState(0.8);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
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
              AI Models & Computer Vision Gateway
            </h1>
            <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Configure Computer Vision water depth inference, NLP bilingual translation, and predictive runoff neural networks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="text-xs font-bold text-[#34C759] flex items-center gap-1 bg-[#EBF9EE] px-3 py-1.5 rounded-xl border border-[#C3F0CD]">
              <CheckCircle2 className="w-4 h-4" /> AI Configurations Synced!
            </span>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            Save Model Parameters
          </button>
        </div>
      </div>

      {/* Grid of AI Subsystems */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subsystem 1: Computer Vision Water Depth Model */}
        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#007AFF]" />
              <h2 className="text-sm font-black text-[#1C1C1E]">Computer Vision Model</h2>
            </div>
            <span className="text-[10px] font-black uppercase bg-[#EBF9EE] text-[#34C759] px-2 py-0.5 rounded-full">
              Active ONNX
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1.5">
                Active Inference Architecture
              </label>
              <select
                value={visionModel}
                onChange={(e) => setVisionModel(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E] focus:outline-none"
              >
                <option>YOLOv8-CebuFlood-WaterDepth v2.4 (Recommended)</option>
                <option>MobileNetV3-FloodGauge (Edge Optimized)</option>
                <option>ResNet-50 WaterLevel-Segmentation</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-extrabold uppercase text-[#8E8E93]">
                  Minimum Confidence Threshold
                </span>
                <span className="font-mono font-bold text-[#007AFF]">{Math.round(confidenceThreshold * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={0.99}
                step={0.01}
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full h-2 bg-[#E5E5EA] rounded-lg appearance-none cursor-pointer accent-[#007AFF]"
              />
              <p className="text-[10px] text-[#8E8E93] mt-1">
                Submissions below this threshold require human CDRRMO manual triage.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E5E5EA] space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-extrabold text-xs text-[#1C1C1E]">Autonomous Triage Pass</p>
                  <p className="text-[10px] text-[#8E8E93]">Auto-verify dispatches if confidence &ge; {Math.round(autoVerifyThreshold * 100)}%</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoVerify}
                  onChange={(e) => setAutoVerify(e.target.checked)}
                  className="rounded text-[#007AFF] focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Subsystem 2: NLP Bilingual Emergency LLM */}
        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#AF52DE]" />
              <h2 className="text-sm font-black text-[#1C1C1E]">Bilingual NLP Dispatch Engine</h2>
            </div>
            <span className="text-[10px] font-black uppercase bg-[#F7ECFB] text-[#AF52DE] px-2 py-0.5 rounded-full">
              Cebuano + English
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1.5">
                Foundation Model
              </label>
              <select
                value={nlpModel}
                onChange={(e) => setNlpModel(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E] focus:outline-none"
              >
                <option>Gemini 1.5 Flash (Ultra-Low Latency - Recommended)</option>
                <option>Claude 3.5 Sonnet (High Nuance)</option>
                <option>GPT-4o Emergency Fine-Tuned</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1.5">
                Target Bisaya Regional Localization
              </label>
              <select
                value={cebuanoDialect}
                onChange={(e) => setCebuanoDialect(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E] focus:outline-none"
              >
                <option>Urban Metro Cebuano (Standard CDRRMO)</option>
                <option>Southern Cebu Colloquial</option>
                <option>Coastal / Maritime Bisaya</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1.5">
                Default Broadcast Urgency Tone
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'authoritative', label: 'Mandatory' },
                  { id: 'standard', label: 'Watch' },
                  { id: 'advisory', label: 'Advisory' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setEmergencyTone(t.id as any)}
                    className={`py-2 rounded-xl text-[11px] font-extrabold border transition-all ${
                      emergencyTone === t.id
                        ? 'bg-[#007AFF] text-white border-[#007AFF]'
                        : 'bg-[#F8F9FA] text-[#6C6C70] border-[#E5E5EA]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Subsystem 3: Predictive Runoff AI Neural Predictor */}
        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#FF9500]" />
              <h2 className="text-sm font-black text-[#1C1C1E]">Runoff Inundation AI</h2>
            </div>
            <span className="text-[10px] font-black uppercase bg-[#FFF4E5] text-[#FF9500] px-2 py-0.5 rounded-full">
              Hydrological LSTM
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-extrabold uppercase text-[#8E8E93]">
                  Early Warning Lead Time
                </span>
                <span className="font-mono font-bold text-[#FF9500]">{predictionLeadTime} Minutes</span>
              </div>
              <input
                type="range"
                min={15}
                max={120}
                step={5}
                value={predictionLeadTime}
                onChange={(e) => setPredictionLeadTime(Number(e.target.value))}
                className="w-full h-2 bg-[#E5E5EA] rounded-lg appearance-none cursor-pointer accent-[#FF9500]"
              />
              <p className="text-[10px] text-[#8E8E93] mt-1">
                LSTM neural lead time before river sensor threshold breach.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E5E5EA] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#1C1C1E]">Catchment Basins Monitored</span>
                <span className="text-[10px] font-bold text-[#34C759]">3 / 3 Online</span>
              </div>
              <p className="text-[10px] text-[#8E8E93]">
                Suba-Mabolo Catchment, Mahiga Basin, and Guadalupe River Catchment.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFEBEA] border border-[#FFD0CE] text-xs text-[#FF3B30] font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 flex-shrink-0" />
              <span>Real-time hydrological stream connected to CDRRMO alert triggers.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
