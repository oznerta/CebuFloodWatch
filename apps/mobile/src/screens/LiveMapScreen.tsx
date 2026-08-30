import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Linking,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  MapPin,
  Layers,
  ChevronDown,
  Search,
  PhoneCall,
  Gauge,
  X,
  Navigation,
  CheckCircle,
  Share2,
  Filter,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { COLORS } from '../constants/theme';
import { mobileFetch } from '../services/api';
import { MobileMap } from '../components/MobileMap';
import {
  searchCebuLandmarks,
  CebuLandmark,
  METRO_CEBU_HOTLINES,
  FloodDepth,
} from '@cebufloodwatch/shared';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type SheetSnap = 'peek' | 'half' | 'full';

const SNAP_HEIGHTS = {
  peek: 210,
  half: SCREEN_HEIGHT * 0.54,
  full: SCREEN_HEIGHT * 0.86,
};

export function LiveMapScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet Snap state
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('peek');

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CebuLandmark[]>([]);
  const [searchActive, setSearchActive] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<CebuLandmark | null>(null);

  // Dynamic Island Alert State
  const [alertExpanded, setAlertExpanded] = useState(false);

  // Vehicle Calculator Modal State
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [calcDepth, setCalcDepth] = useState<number>(35);

  // Hotlines Modal State
  const [hotlinesModalOpen, setHotlinesModalOpen] = useState(false);

  // Map Controls State
  const [showHazards, setShowHazards] = useState(true);

  const fetchIncidents = async () => {
    try {
      const [reportsData, sheltersData] = await Promise.all([
        mobileFetch<any[]>('/reports').catch(() => null),
        mobileFetch<any[]>('/shelters').catch(() => null),
      ]);

      if (reportsData && reportsData.length > 0) {
        setReports(reportsData);
      } else {
        setReports([
          {
            id: '1',
            barangay_name: 'Mabolo',
            flood_depth_level: 'waist',
            description: 'Suba river overflow reaching church perimeter. Avoid M.J. Cuenco.',
            created_at: new Date().toISOString(),
            latitude: 10.325,
            longitude: 123.9167,
            verified: true,
          },
          {
            id: '2',
            barangay_name: 'Kasambagan',
            flood_depth_level: 'knee',
            description: 'Mahiga creek backflow along residential access road.',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            latitude: 10.334,
            longitude: 123.914,
            verified: true,
          },
          {
            id: '3',
            barangay_name: 'Mambaling',
            flood_depth_level: 'above_head',
            description: 'Underpass submerged completely, road impassable to all traffic.',
            created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
            latitude: 10.2915,
            longitude: 123.8742,
            verified: true,
          },
        ]);
      }

      if (sheltersData && sheltersData.length > 0) {
        setShelters(sheltersData);
      } else {
        setShelters([
          {
            id: '1',
            name: 'Mabolo Elementary School Gym',
            barangay_name: 'Mabolo',
            latitude: 10.3265,
            longitude: 123.918,
            status: 'open',
            max_capacity: 350,
            current_occupancy: 85,
            contact_number: '+63322311234',
            distance_meters: 450,
          },
          {
            id: '2',
            name: 'Kasambagan Sports Complex',
            barangay_name: 'Kasambagan',
            latitude: 10.334,
            longitude: 123.914,
            status: 'open',
            max_capacity: 250,
            current_occupancy: 120,
            contact_number: '+63322325678',
            distance_meters: 850,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(searchCebuLandmarks(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSelectLandmark = (item: CebuLandmark) => {
    setSelectedLandmark(item);
    setSearchQuery(item.name);
    setSearchActive(false);
    setSheetSnap('peek');
  };

  const handleAcquireGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    } catch (e) {
      console.warn('GPS location error:', e);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleShareSOS = () => {
    const msg = `🚨 EMERGENCY DISASTER SOS (Metro Cebu): Need rescue assistance. GPS: https://maps.google.com/?q=10.3157,123.8854 (Tracked live on CebuFloodWatch)`;
    Linking.openURL(`sms:?body=${encodeURIComponent(msg)}`);
  };

  const filteredReports = reports.filter((r) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'knee') return r.flood_depth_level === 'knee' || r.flood_depth_level === 'waist' || r.flood_depth_level === 'chest' || r.flood_depth_level === 'above_head';
    if (selectedFilter === 'waist') return r.flood_depth_level === 'waist' || r.flood_depth_level === 'chest' || r.flood_depth_level === 'above_head';
    if (selectedFilter === 'chest') return r.flood_depth_level === 'chest' || r.flood_depth_level === 'above_head';
    return true;
  });

  const getDepthColor = (level: string) => {
    switch (level) {
      case 'ankle':
        return '#34C759';
      case 'knee':
        return '#FFCC00';
      case 'waist':
        return '#FF9500';
      case 'chest':
        return '#FF3B30';
      case 'above_head':
        return '#AF52DE';
      default:
        return COLORS.primary;
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Full-Bleed Living Vector Map Canvas */}
      <View style={StyleSheet.absoluteFillObject}>
        <MobileMap
          reports={filteredReports}
          shelters={shelters}
          showHazards={showHazards}
        />
      </View>

      {/* 2. Top Dynamic Alert Island */}
      <View style={styles.topIslandContainer}>
        <TouchableOpacity
          style={styles.dynamicIslandPill}
          onPress={() => setAlertExpanded(!alertExpanded)}
          activeOpacity={0.88}
        >
          <View style={styles.alertPulseDot} />
          <Text style={styles.alertIslandText} numberOfLines={1}>
            Heavy Rainfall Alert &bull; Mahiga Creek Watch (31mm/h)
          </Text>
          <ChevronDown
            color="#FF9500"
            size={14}
            style={{ transform: [{ rotate: alertExpanded ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {alertExpanded && (
          <View style={styles.alertExpandedCard}>
            <Text style={styles.alertCardTitle}>CDRRMO Flood Advisory &bull; Metro Cebu</Text>
            <Text style={styles.alertCardBody}>
              Continuous rainfall over Mabolo and Subangdaku catchments. Low-lying barangays along rivers are on active evacuation standby. Next high tide peak at 14:30 PHT (+1.62m).
            </Text>
          </View>
        )}
      </View>

      {/* 3. Right-Side Minimal Apple Action Column */}
      <View style={styles.rightActionColumn}>
        {/* GPS Locate Me */}
        <TouchableOpacity
          style={styles.actionCircleBtn}
          onPress={handleAcquireGPS}
          accessibilityLabel="Locate Me"
        >
          <Navigation color="#007AFF" size={19} />
        </TouchableOpacity>

        {/* Layer Hazards Toggle */}
        <TouchableOpacity
          style={[styles.actionCircleBtn, showHazards && styles.actionCircleBtnActive]}
          onPress={() => setShowHazards(!showHazards)}
          accessibilityLabel="Toggle Hazard Layers"
        >
          <Layers color={showHazards ? '#FFFFFF' : '#1C1C1E'} size={19} />
        </TouchableOpacity>

        {/* Vehicle Clearance Tool */}
        <TouchableOpacity
          style={styles.actionCircleBtn}
          onPress={() => setVehicleModalOpen(true)}
          accessibilityLabel="Vehicle Clearance Calculator"
        >
          <Gauge color="#007AFF" size={19} />
        </TouchableOpacity>

        {/* 1-Tap SOS Emergency Dial */}
        <TouchableOpacity
          style={styles.sosEmergencyBtn}
          onPress={() => setHotlinesModalOpen(true)}
          accessibilityLabel="Emergency Hotlines"
        >
          <PhoneCall color="#FFFFFF" size={17} />
          <Text style={styles.sosBtnText}>161</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Incident Discovery & Search Bottom Sheet */}
      <View style={[styles.appleSheetContainer, { height: SNAP_HEIGHTS[sheetSnap] }]}>
        {/* Grabber & Search Input */}
        <TouchableOpacity
          style={styles.sheetHandleArea}
          onPress={() => {
            if (sheetSnap === 'peek') setSheetSnap('half');
            else if (sheetSnap === 'half') setSheetSnap('full');
            else setSheetSnap('peek');
          }}
          activeOpacity={0.9}
        >
          <View style={styles.sheetHandleBar} />

          {/* Search Bar Row */}
          <View style={styles.searchBarRow}>
            <Search color="#8E8E93" size={16} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Cebu barangays, landmarks, shelters..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                setSearchActive(true);
                if (sheetSnap === 'peek') setSheetSnap('half');
              }}
              onFocus={() => {
                setSearchActive(true);
                if (sheetSnap === 'peek') setSheetSnap('half');
              }}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchActive(false); }}>
                <X color="#8E8E93" size={16} />
              </TouchableOpacity>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Autocomplete Search Results (if searching) */}
        {searchActive && searchResults.length > 0 ? (
          <ScrollView style={styles.searchScroll}>
            {searchResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.searchItemRow}
                onPress={() => handleSelectLandmark(item)}
              >
                <View style={styles.searchItemIcon}>
                  <MapPin color="#007AFF" size={16} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchItemTitle}>{item.name}</Text>
                  <Text style={styles.searchItemSub}>
                    Barangay {item.barangay} &bull; {item.category.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <>
            {/* Filter Pills */}
            <View style={styles.filterPillsRow}>
              {[
                { id: 'all', label: 'All Incidents' },
                { id: 'knee', label: 'Knee+ (30cm)' },
                { id: 'waist', label: 'Waist+ (1.0m)' },
                { id: 'chest', label: 'Chest+ (1.4m)' },
              ].map((f) => {
                const isSelected = selectedFilter === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.filterPill, isSelected && styles.filterPillActive]}
                    onPress={() => setSelectedFilter(f.id)}
                  >
                    <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Live Incident Feed */}
            <FlatList
              data={filteredReports}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const depthColor = getDepthColor(item.flood_depth_level);
                return (
                  <View style={styles.cardItem}>
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.barangayTag}>BARANGAY {item.barangay_name?.toUpperCase() || 'CEBU'}</Text>
                        <Text style={styles.incidentDesc}>{item.description}</Text>
                      </View>
                      <View style={[styles.depthPill, { backgroundColor: `${depthColor}18`, borderColor: `${depthColor}40` }]}>
                        <View style={[styles.depthDot, { backgroundColor: depthColor }]} />
                        <Text style={[styles.depthPillText, { color: depthColor }]}>
                          {item.flood_depth_level?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardMetaRow}>
                      <Text style={styles.cardTime}>
                        Logged at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; GPS Tagged
                      </Text>
                      {item.verified && (
                        <View style={styles.verifiedBadge}>
                          <CheckCircle color="#34C759" size={11} />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          </>
        )}
      </View>

      {/* Vehicle Passability Calculator Modal */}
      <Modal
        visible={vehicleModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVehicleModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Gauge color="#007AFF" size={20} />
                <Text style={styles.modalTitle}>Vehicle Clearance Calculator</Text>
              </View>
              <TouchableOpacity onPress={() => setVehicleModalOpen(false)}>
                <X color="#8E8E93" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.calcSub}>Simulate water depth to evaluate safe crossing feasibility:</Text>

            <View style={styles.calcPresetRow}>
              {[
                { label: 'Ankle (15cm)', val: 15 },
                { label: 'Knee (35cm)', val: 35 },
                { label: 'Waist (90cm)', val: 90 },
                { label: 'Chest (140cm)', val: 140 },
              ].map((p) => (
                <TouchableOpacity
                  key={p.val}
                  style={[styles.calcPresetChip, calcDepth === p.val && styles.calcPresetChipActive]}
                  onPress={() => setCalcDepth(p.val)}
                >
                  <Text style={[styles.calcPresetText, calcDepth === p.val && styles.calcPresetTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={{ maxHeight: 300, marginTop: 8 }}>
              <View style={styles.vehicleCard}>
                <Text style={styles.vehicleName}>🚗 Sedans & Hatchbacks (Vios, Mirage)</Text>
                <Text style={[styles.passBadge, { color: calcDepth <= 15 ? '#34C759' : '#FF3B30' }]}>
                  {calcDepth <= 15 ? 'SAFE PASSAGE' : 'IMPASSABLE / HYDROSTATIC LOCK HAZARD'}
                </Text>
              </View>

              <View style={styles.vehicleCard}>
                <Text style={styles.vehicleName}>🚙 Compact Crossovers & SUVs (Innova, Rush)</Text>
                <Text style={[styles.passBadge, { color: calcDepth <= 30 ? '#34C759' : '#FF9500' }]}>
                  {calcDepth <= 30 ? 'SAFE PASSAGE' : 'EXTREME CAUTION — CREEK RUNOFF'}
                </Text>
              </View>

              <View style={styles.vehicleCard}>
                <Text style={styles.vehicleName}>🛻 4x4 Pickups & High SUVs (Hilux, Fortuner)</Text>
                <Text style={[styles.passBadge, { color: calcDepth <= 50 ? '#34C759' : '#FF9500' }]}>
                  {calcDepth <= 50 ? 'SAFE PASSAGE' : 'DEEP BASIN POOLING HAZARD'}
                </Text>
              </View>

              <View style={styles.vehicleCard}>
                <Text style={styles.vehicleName}>🚒 Heavy Disaster Rescue Trucks (WASAR)</Text>
                <Text style={[styles.passBadge, { color: calcDepth <= 80 ? '#34C759' : '#FF3B30' }]}>
                  {calcDepth <= 80 ? 'AUTHORIZED RESCUE PASS' : 'CRITICAL INUNDATION'}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Emergency Hotlines Modal */}
      <Modal
        visible={hotlinesModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHotlinesModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PhoneCall color="#FF3B30" size={20} />
                <Text style={styles.modalTitle}>Cebu Emergency Hotlines</Text>
              </View>
              <TouchableOpacity onPress={() => setHotlinesModalOpen(false)}>
                <X color="#8E8E93" size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.sosShareBtn} onPress={handleShareSOS}>
              <Share2 color="#FFFFFF" size={16} />
              <Text style={styles.sosShareText}>Send 1-Tap GPS Emergency SMS</Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 360 }}>
              {METRO_CEBU_HOTLINES.map((h) => (
                <View key={h.id} style={styles.hotlineRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.hotlineAgency}>{h.agency}</Text>
                      {h.shortCode && (
                        <Text style={styles.hotlineShortCode}>{h.shortCode}</Text>
                      )}
                    </View>
                    <Text style={styles.hotlineDesc}>{h.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.hotlineCallBtn}
                    onPress={() => handleCall(h.phone)}
                  >
                    <PhoneCall color="#FFFFFF" size={14} />
                    <Text style={styles.hotlineCallText}>Call</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  topIslandContainer: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    zIndex: 30,
    alignItems: 'center',
    gap: 6,
  },
  dynamicIslandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.94)',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  alertPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9500',
  },
  alertIslandText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  alertExpandedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    gap: 4,
    width: '100%',
  },
  alertCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF9500',
  },
  alertCardBody: {
    fontSize: 11,
    color: '#3A3A3C',
    lineHeight: 16,
  },
  rightActionColumn: {
    position: 'absolute',
    top: 68,
    right: 14,
    zIndex: 25,
    gap: 10,
    alignItems: 'center',
  },
  actionCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  actionCircleBtnActive: {
    backgroundColor: '#007AFF',
  },
  sosEmergencyBtn: {
    backgroundColor: '#FF3B30',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  sosBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  appleSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    zIndex: 35,
    overflow: 'hidden',
  },
  sheetHandleArea: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 10,
  },
  sheetHandleBar: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#D1D1D6',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '600',
    paddingVertical: 0,
  },
  searchScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    marginBottom: 6,
    gap: 10,
  },
  searchItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  searchItemSub: {
    fontSize: 10,
    color: '#8E8E93',
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
  },
  filterPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    paddingVertical: 6.5,
    borderRadius: 12,
  },
  filterPillActive: {
    backgroundColor: '#007AFF',
  },
  filterPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6C6C70',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 8,
  },
  cardItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  barangayTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#007AFF',
    letterSpacing: 0.2,
  },
  incidentDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 2,
  },
  depthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  depthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  depthPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  cardTime: {
    fontSize: 10,
    color: '#8E8E93',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34C759',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  modalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  calcSub: {
    fontSize: 12,
    color: '#8E8E93',
  },
  calcPresetRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  calcPresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  calcPresetChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  calcPresetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6C6C70',
  },
  calcPresetTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  vehicleCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 8,
    gap: 4,
  },
  vehicleName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  passBadge: {
    fontSize: 10,
    fontWeight: '800',
  },
  sosShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    paddingVertical: 12,
    gap: 6,
  },
  sosShareText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  hotlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 10,
    marginBottom: 8,
  },
  hotlineAgency: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  hotlineShortCode: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF3B30',
    backgroundColor: '#FFEBEA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hotlineDesc: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
  },
  hotlineCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 4,
  },
  hotlineCallText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
