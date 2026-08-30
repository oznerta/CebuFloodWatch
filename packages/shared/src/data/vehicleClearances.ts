import { VehicleClearanceCategory } from '../types/index.js';

export const DEFAULT_VEHICLE_CLEARANCES: VehicleClearanceCategory[] = [
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
