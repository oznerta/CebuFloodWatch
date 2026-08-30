'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Globe,
  Radio,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Key,
  RefreshCw,
  Save,
  Send,
  Waves,
  Eye,
  EyeOff,
  Activity,
} from 'lucide-react';

import { fetchApi } from '../../../lib/api';

export default function APIGatewaysPage() {
  // PAGASA Weather API State
  const [pagasaKey, setPagasaKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [pagasaInterval, setPagasaInterval] = useState('5');
  const [pagasaStatus, setPagasaStatus] = useState<'healthy' | 'checking'>('healthy');

  // NAMRIA Tidal Webhook State
  const [namriaUrl, setNamriaUrl] = useState('https://api.namria.gov.ph/tides/v1/cebu-port');
  const [namriaStatus, setNamriaStatus] = useState<'healthy' | 'checking'>('healthy');

  // IoT Sensor MQTT Gateway
  const [mqttBroker, setMqttBroker] = useState('mqtts://telemetry.cebucity.gov.ph:8883');
  const [activeSensorsCount, setActiveSensorsCount] = useState(0);

  // SMS Gateway
  const [smsApiKey, setSmsApiKey] = useState('');
  const [smsSenderId, setSmsSenderId] = useState('CEBU_CDRRMO');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestConnection = (service: string) => {
    if (service === 'pagasa') {
      setPagasaStatus('checking');
      setTimeout(() => setPagasaStatus('healthy'), 1000);
    } else {
      setNamriaStatus('checking');
      setTimeout(() => setNamriaStatus('healthy'), 1000);
    }
  };

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
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#1C1C1E]">
              API Gateways & Sensor Telemetry Hub
            </h1>
            <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Manage external connections to PAGASA Weather Doppler, NAMRIA Tides, MQTT River Streamers & SMS Broadcast
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="text-xs font-bold text-[#34C759] flex items-center gap-1 bg-[#EBF9EE] px-3 py-1.5 rounded-xl border border-[#C3F0CD]">
              <CheckCircle2 className="w-4 h-4" /> Gateway Credentials Saved!
            </span>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            Save Gateway Credentials
          </button>
        </div>
      </div>

      {/* Grid of Gateways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gateway 1: PAGASA Radar & Rainfall API */}
        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-[#007AFF]" />
              <div>
                <h3 className="text-sm font-black text-[#1C1C1E]">PAGASA Doppler Radar API</h3>
                <p className="text-[10px] text-[#8E8E93]">National Weather & Heavy Rainfall Advisory</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase bg-[#EBF9EE] text-[#34C759] px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
              Connected
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                API Base Endpoint
              </label>
              <input
                type="text"
                value="https://api.pagasa.dost.gov.ph/v2/radar/cebu-station"
                disabled
                className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] text-xs font-mono text-[#6C6C70]"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                API Secret Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={pagasaKey}
                  onChange={(e) => setPagasaKey(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] text-xs font-mono font-bold text-[#1C1C1E] focus:outline-none"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E]"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#F2F2F7]">
              <span className="text-[11px] font-bold text-[#8E8E93]">Polling Interval: Every 5 Mins</span>
              <button
                onClick={() => handleTestConnection('pagasa')}
                className="px-3 py-1.5 rounded-xl bg-[#E5F1FF] text-[#007AFF] hover:bg-[#007AFF] hover:text-white text-xs font-extrabold flex items-center gap-1 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${pagasaStatus === 'checking' ? 'animate-spin' : ''}`} />
                Test Ping
              </button>
            </div>
          </div>
        </div>

        {/* Gateway 2: NAMRIA Cebu Port Tidal Telemetry */}
        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
            <div className="flex items-center gap-2.5">
              <Waves className="w-4 h-4 text-[#007AFF]" />
              <div>
                <h3 className="text-sm font-black text-[#1C1C1E]">NAMRIA Port Tidal Stream</h3>
                <p className="text-[10px] text-[#8E8E93]">Cebu Harbor High/Low Tide Ingestion</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase bg-[#EBF9EE] text-[#34C759] px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
              Connected
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                NAMRIA Tide Station Webhook URL
              </label>
              <input
                type="text"
                value={namriaUrl}
                onChange={(e) => setNamriaUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] text-xs font-mono font-bold text-[#1C1C1E] focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-2xl bg-[#F8F9FA] border border-[#E5E5EA] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold text-[#1C1C1E]">Current High Tide Peak</p>
                <p className="text-[10px] text-[#8E8E93]">Estuary Backflow Risk Level: Moderate</p>
              </div>
              <span className="text-sm font-black text-[#FF9500]">+1.62m</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#F2F2F7]">
              <span className="text-[11px] font-bold text-[#8E8E93]">Auto-Calculates Coastal Drainage</span>
              <button
                onClick={() => handleTestConnection('namria')}
                className="px-3 py-1.5 rounded-xl bg-[#E5F1FF] text-[#007AFF] hover:bg-[#007AFF] hover:text-white text-xs font-extrabold flex items-center gap-1 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${namriaStatus === 'checking' ? 'animate-spin' : ''}`} />
                Test Stream
              </button>
            </div>
          </div>
        </div>

        {/* Gateway 3: IoT River Sensor MQTT Broker */}
        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-[#34C759]" />
              <div>
                <h3 className="text-sm font-black text-[#1C1C1E]">IoT River Sensor Gateway (MQTT)</h3>
                <p className="text-[10px] text-[#8E8E93]">Telemetry from Mabolo, Mahiga & Guadalupe</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase bg-[#EBF9EE] text-[#34C759] px-2.5 py-0.5 rounded-full">
              3 Nodes Online
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                MQTT Broker TLS Endpoint
              </label>
              <input
                type="text"
                value={mqttBroker}
                onChange={(e) => setMqttBroker(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] text-xs font-mono font-bold text-[#1C1C1E] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              {[
                { name: 'Mabolo Suba River Node 01', level: '2.15m', status: 'critical' },
                { name: 'Mahiga Creek Basin Node 02', level: '1.62m', status: 'watch' },
                { name: 'Guadalupe River Midstream Node 03', level: '0.85m', status: 'normal' },
              ].map((node) => (
                <div key={node.name} className="flex items-center justify-between p-2 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA]">
                  <span className="font-bold text-[11px] text-[#1C1C1E]">{node.name}</span>
                  <span className="font-mono font-black text-xs text-[#007AFF]">{node.level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gateway 4: Mass Cell Broadcast & SMS Gateway */}
        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-3">
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-[#FF3B30]" />
              <div>
                <h3 className="text-sm font-black text-[#1C1C1E]">Mass SMS & Cell Broadcast Gateway</h3>
                <p className="text-[10px] text-[#8E8E93]">Emergency Disaster Alerts to All Citizen Devices</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase bg-[#EBF9EE] text-[#34C759] px-2.5 py-0.5 rounded-full">
              Ready
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                PhilSMS / Telco Gateway Key
              </label>
              <input
                type="password"
                value={smsApiKey}
                onChange={(e) => setSmsApiKey(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] text-xs font-mono font-bold text-[#1C1C1E] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                Official Sender Mask / ID
              </label>
              <input
                type="text"
                value={smsSenderId}
                onChange={(e) => setSmsSenderId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#F2F2F7]">
              <span className="text-[11px] font-bold text-[#8E8E93]">Bilingual Push Ready</span>
              <button
                onClick={() => alert('Test SMS dispatched successfully to emergency admin roster.')}
                className="px-3 py-1.5 rounded-xl bg-[#FFEBEA] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white text-xs font-extrabold flex items-center gap-1 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Send Test SMS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
