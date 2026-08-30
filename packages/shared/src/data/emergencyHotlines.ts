export interface DisasterHotlineAgency {
  id: string;
  name: string;
  agency: string;
  phone: string;
  shortCode?: string;
  description: string;
  iconType: 'police' | 'fire' | 'medical' | 'coastguard' | 'disaster' | 'traffic';
}

export const METRO_CEBU_HOTLINES: DisasterHotlineAgency[] = [
  {
    id: 'cdrrmo',
    name: 'Cebu City Disaster Risk Reduction & Management Office (CDRRMO)',
    agency: 'CDRRMO Command Center',
    phone: '+63322621424',
    shortCode: '161',
    description: 'Primary disaster response, rescue dispatch & flood evacuation center coordination.',
    iconType: 'disaster',
  },
  {
    id: 'national_911',
    name: 'National Emergency Hotline',
    agency: 'Emergency 911',
    phone: '911',
    shortCode: '911',
    description: 'Direct national police, ambulance, and unified rescue response.',
    iconType: 'police',
  },
  {
    id: 'bfp_cebu',
    name: 'Bureau of Fire Protection (BFP) Cebu City',
    agency: 'BFP Special Rescue Unit',
    phone: '+63322560544',
    description: 'Water search and rescue (WASAR), boat deployment, and structure evacuation.',
    iconType: 'fire',
  },
  {
    id: 'pcg_visayas',
    name: 'Philippine Coast Guard - District Central Visayas',
    agency: 'PCG Search & Rescue',
    phone: '+63324166566',
    description: 'Maritime and coastal emergency response for port & estuary flash floods.',
    iconType: 'coastguard',
  },
  {
    id: 'red_cross_cebu',
    name: 'Philippine Red Cross - Cebu Chapter',
    agency: 'Red Cross Disaster Services',
    phone: '+63322552111',
    description: 'Emergency blood services, first aid trauma stations, and relief distributions.',
    iconType: 'medical',
  },
  {
    id: 'ems_ambulance',
    name: 'Emergency Medical Services (EMS) Ambulance',
    agency: 'Cebu City Health Dept',
    phone: '+63322550870',
    description: 'Mobile paramedic trauma response and hospital transfer dispatch.',
    iconType: 'medical',
  },
  {
    id: 'ccto_traffic',
    name: 'Cebu City Transportation Office (CCTO)',
    agency: 'Traffic Command Division',
    phone: '+63322539211',
    description: 'Real-time road rerouting, submerged intersection towing, and traffic control.',
    iconType: 'traffic',
  },
];
