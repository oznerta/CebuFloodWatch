'use client';

import React, { useState } from 'react';
import {
  Car,
  Truck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Gauge,
  Info,
} from 'lucide-react';

interface VehiclePassabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VehicleCategory {
  id: string;
  name: string;
  maxSafeDepthCm: number;
  criticalLimitCm: number;
  icon: string;
  recommendation: string;
}

const VEHICLE_CATEGORIES: VehicleCategory[] = [
  {
    id: 'sedan',
    name: 'Sedans & City Hatchbacks (Vios, Mirage, Wigo)',
    maxSafeDepthCm: 15,
    criticalLimitCm: 25,
    icon: '🚗',
    recommendation: 'Do NOT attempt knee-level waters. Intake air snorkel submerged = engine hydrostatic lock.',
  },
  {
    id: 'crossover',
    name: 'Compact Crossovers & MPVs (Innova, Rush, Xpander)',
    maxSafeDepthCm: 25,
    criticalLimitCm: 40,
    icon: '🚙',
    recommendation: 'Can traverse light surface pooling. Avoid gutter overflows near creek junctions.',
  },
  {
    id: 'pickup_4x4',
    name: '4x4 Pickups & High-Clearance SUVs (Hilux, Fortuner, Ranger)',
    maxSafeDepthCm: 50,
    criticalLimitCm: 70,
    icon: '🛻',
    recommendation: 'Capable of navigating knee-to-waist waters. Verify current speed before crossing.',
  },
  {
    id: 'rescue_truck',
    name: 'Heavy Rescue Trucks & WASAR Fire Engines',
    maxSafeDepthCm: 80,
    criticalLimitCm: 110,
    icon: '🚒',
    recommendation: 'Specialized high exhaust disaster units for mandatory evacuation missions.',
  },
  {
    id: 'military_6x6',
    name: 'Military 6x6 & Amphibious Troop Carriers',
    maxSafeDepthCm: 130,
    criticalLimitCm: 180,
    icon: '🚛',
    recommendation: 'Heavy armored disaster vehicles for submerged chest-level relief operations.',
  },
];

export function VehiclePassabilityModal({
  isOpen,
  onClose,
}: VehiclePassabilityModalProps) {
  const [selectedDepth, setSelectedDepth] = useState<number>(35); // in cm

  if (!isOpen) return null;

  const getPassabilityStatus = (v: VehicleCategory) => {
    if (selectedDepth <= v.maxSafeDepthCm) {
      return { status: 'passable', label: 'PASSABLE & SAFE', color: 'text-[#34C759] bg-[#EBF9EE] border-[#C3F0CD]' };
    }
    if (selectedDepth <= v.criticalLimitCm) {
      return { status: 'caution', label: 'EXTREME CAUTION', color: 'text-[#FF9500] bg-[#FFF4E5] border-[#FFE4BE]' };
    }
    return { status: 'impassable', label: 'DO NOT CROSS / SUBMERGED', color: 'text-[#FF3B30] bg-[#FFEBEA] border-[#FFD0CE]' };
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5E5EA] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E5EA] bg-[#E5F1FF]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E5F1FF] border border-[#CCE3FF] flex items-center justify-center text-[#007AFF] shadow-sm">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1C1C1E]">
                Flood Depth & Vehicle Clearance Calculator
              </h3>
              <p className="text-xs text-[#6C6C70] font-medium mt-0.5">
                Simulate water height and evaluate road passability by vehicle class
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E5E5EA] flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E] shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Depth Selector Slider */}
        <div className="p-6 bg-[#F8F9FA] border-b border-[#E5E5EA] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8E8E93] uppercase">
              Simulated Floodwater Depth
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-[#007AFF]">{selectedDepth} cm</span>
              <span className="text-xs text-[#8E8E93] font-semibold">
                ({(selectedDepth / 100).toFixed(2)} meters)
              </span>
            </div>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={5}
            max={180}
            step={5}
            value={selectedDepth}
            onChange={(e) => setSelectedDepth(Number(e.target.value))}
            className="w-full h-2 bg-[#E5E5EA] rounded-lg appearance-none cursor-pointer accent-[#007AFF]"
          />

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto">
            {[
              { label: 'Ankle (15cm)', val: 15 },
              { label: 'Knee (35cm)', val: 35 },
              { label: 'Waist (90cm)', val: 90 },
              { label: 'Chest (140cm)', val: 140 },
              { label: 'Critical (180cm)', val: 180 },
            ].map((preset) => (
              <button
                key={preset.val}
                onClick={() => setSelectedDepth(preset.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                  selectedDepth === preset.val
                    ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-sm'
                    : 'bg-white text-[#6C6C70] border-[#E5E5EA] hover:bg-[#F2F2F7]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix of Vehicles */}
        <div className="p-5 max-h-[360px] overflow-y-auto space-y-3">
          {VEHICLE_CATEGORIES.map((v) => {
            const assessment = getPassabilityStatus(v);
            return (
              <div
                key={v.id}
                className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E5E5EA] hover:bg-white hover:shadow-sm transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{v.icon}</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-[#1C1C1E]">
                        {v.name}
                      </h4>
                      <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5">
                        Safe Threshold: &le; {v.maxSafeDepthCm}cm &bull; Critical Limit: {v.criticalLimitCm}cm
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider flex-shrink-0 ${assessment.color}`}
                  >
                    {assessment.label}
                  </span>
                </div>

                <p className="text-xs text-[#6C6C70] font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-[#E5E5EA]">
                  {v.recommendation}
                </p>
              </div>
            );
          })}
        </div>

        {/* Warning Footnote */}
        <div className="p-4 border-t border-[#E5E5EA] bg-[#F8F9FA] flex items-center gap-2 text-xs text-[#8E8E93] font-medium">
          <Info className="w-4 h-4 text-[#007AFF] flex-shrink-0" />
          <span>Calculations based on standard automotive intake snorkel clearances & CDRRMO safety standards.</span>
        </div>
      </div>
    </div>
  );
}
