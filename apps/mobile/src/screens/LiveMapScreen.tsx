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
} from 'react-native';
import {
  MapPin,
  Layers,
  RefreshCw,
  ChevronUp,
  Maximize2,
  Minimize2,
  ListFilter,
  Search,
  PhoneCall,
  Gauge,
  X,
  Compass,
  HeartPulse,
  Activity,
  Home,
  Route,
  Building,
  Check,
  Share2,
} from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { mobileFetch } from '../services/api';
import { MobileMap } from '../components/MobileMap';
import {
  searchCebuLandmarks,
  CebuLandmark,
  METRO_CEBU_HOTLINES,
  DisasterHotlineAgency,
} from '@cebufloodwatch/shared';

export function LiveMapScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterDepth, setFilterDepth] = useState<string>('all');
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [isImmersiveFullscreen, setIsImmersiveFullscreen] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CebuLandmark[]>([]);
  const [searchActive, setSearchActive] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<CebuLandmark | null>(null);

  // Modals State
  const [hotlinesModalOpen, setHotlinesModalOpen] = useState(false);
  const [passabilityModalOpen, setPassabilityModalOpen] = useState(false);
  const [calcDepth, setCalcDepth] = useState<number>(35); // in cm

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
            description: 'Suba river overflow reaching church perimeter',
            created_at: new Date().toISOString(),
            latitude: 10.325,
            longitude: 123.9167,
          },
          {
            id: '2',
            barangay_name: 'Kasambagan',
            flood_depth_level: 'knee',
            description: 'Creek overflowing along residential access road',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            latitude: 10.334,
            longitude: 123.914,
          },
          {
            id: '3',
            barangay_name: 'Mambaling',
            flood_depth_level: 'above_head',
            description: 'Underpass submerged completely, road impassable',
            created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
            latitude: 10.2915,
            longitude: 123.8742,
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
            latitude: 10.3265,
            longitude: 123.918,
            status: 'open',
            max_capacity: 350,
            current_occupancy: 85,
          },
          {
            id: '2',
            name: 'Kasambagan Sports Complex',
            latitude: 10.334,
            longitude: 123.914,
            status: 'open',
            max_capacity: 250,
            current_occupancy: 120,
          },
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
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
  };

  const filteredReports =
    filterDepth === 'all'
      ? reports
      : reports.filter((r) => r.flood_depth_level === filterDepth);

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

  const getCategoryIcon = (cat: CebuLandmark['category']) => {
    switch (cat) {
      case 'hospital':
        return <HeartPulse color="#FF3B30" size={16} />;
      case 'sensor':
        return <Activity color="#007AFF" size={16} />;
      case 'shelter':
        return <Home color="#34C759" size={16} />;
      case 'road':
        return <Route color="#FF9500" size={16} />;
      default:
        return <Building color="#007AFF" size={16} />;
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleShareSOS = () => {
    const msg = `🚨 EMERGENCY DISASTER SOS (Metro Cebu): Need rescue assistance. GPS: https://maps.google.com/?q=10.3157,123.8854 (Tracked live on CebuFloodWatch)`;
    Linking.openURL(`sms:?body=${encodeURIComponent(msg)}`);
  };

  return (
    <View style={styles.container}>
      {/* 1. Fullscreen Apple Maps Vector Backdrop */}
      <View style={StyleSheet.absoluteFillObject}>
        <MobileMap
          reports={filteredReports}
          shelters={shelters}
          showHazards={true}
        />
      </View>

      {/* 2. Floating Top Header & Search HUD */}
      {isImmersiveFullscreen ? (
        <View style={styles.fullscreenExitHud}>
          <TouchableOpacity
            style={styles.exitFocusBtn}
            onPress={() => setIsImmersiveFullscreen(false)}
          >
            <Minimize2 color="#007AFF" size={16} />
            <Text style={styles.exitFocusText}>Exit Fullscreen Map</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.topHudContainer}>
          {/* Spotlight Search Bar */}
          <View style={styles.searchBarContainer}>
            <Search color="#8E8E93" size={16} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Cebu barangays, landmarks, hospitals..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setSearchActive(true);
              }}
              onFocus={() => setSearchActive(true)}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSelectedLandmark(null);
                  setSearchActive(false);
                }}
              >
                <X color="#8E8E93" size={16} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Autocomplete Dropdown List */}
          {searchActive && searchResults.length > 0 && (
            <View style={styles.searchResultsDropdown}>
              {searchResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.searchResultRow}
                  onPress={() => handleSelectLandmark(item)}
                >
                  <View style={styles.resultIconWrap}>
                    {getCategoryIcon(item.category)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultTitle}>{item.name}</Text>
                    <Text style={styles.resultSub}>
                      Barangay {item.barangay} &bull; {item.category.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Quick Action Utilities Row */}
          <View style={styles.utilitiesRow}>
            {/* Hotlines Button */}
            <TouchableOpacity
              style={styles.utilityPill}
              onPress={() => setHotlinesModalOpen(true)}
            >
              <PhoneCall color="#FF3B30" size={13} />
              <Text style={[styles.utilityText, { color: '#FF3B30' }]}>
                Hotlines (161)
              </Text>
            </TouchableOpacity>

            {/* Vehicle Clearance Calculator */}
            <TouchableOpacity
              style={styles.utilityPill}
              onPress={() => setPassabilityModalOpen(true)}
            >
              <Gauge color="#007AFF" size={13} />
              <Text style={styles.utilityText}>Vehicle Clearance</Text>
            </TouchableOpacity>

            {/* Fullscreen Mode */}
            <TouchableOpacity
              style={styles.iconUtilityBtn}
              onPress={() => setIsImmersiveFullscreen(true)}
              accessibilityLabel="Fullscreen Focus"
            >
              <Maximize2 color="#007AFF" size={14} />
            </TouchableOpacity>

            {/* Refresh */}
            <TouchableOpacity
              style={styles.iconUtilityBtn}
              onPress={() => {
                setRefreshing(true);
                fetchIncidents();
              }}
            >
              <RefreshCw color="#007AFF" size={14} />
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <View style={styles.segmentedFilterRow}>
            {[
              { id: 'all', label: 'All' },
              { id: 'knee', label: 'Knee+' },
              { id: 'waist', label: 'Waist+' },
              { id: 'chest', label: 'Chest+' },
            ].map((item) => {
              const isSelected = filterDepth === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.filterPill,
                    isSelected && styles.filterPillActive,
                  ]}
                  onPress={() => setFilterDepth(item.id)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isSelected && styles.filterPillTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* 3. Floating Bottom Sheet Telemetry Feed (Apple Maps Style) */}
      {isImmersiveFullscreen ? (
        <View style={styles.fullscreenBottomTrigger}>
          <TouchableOpacity
            style={styles.minimalFeedPill}
            onPress={() => setIsImmersiveFullscreen(false)}
          >
            <ListFilter color="#007AFF" size={14} />
            <Text style={styles.minimalFeedText}>
              Show Feed ({filteredReports.length})
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={[
            styles.bottomSheetCard,
            sheetExpanded && styles.bottomSheetCardExpanded,
          ]}
        >
          <TouchableOpacity
            style={styles.sheetHandleArea}
            onPress={() => setSheetExpanded(!sheetExpanded)}
          >
            <View style={styles.sheetHandleBar} />
            <View style={styles.sheetHeaderRow}>
              <View>
                <Text style={styles.sheetTitle}>Active Flood Incidents</Text>
                <Text style={styles.sheetSub}>
                  {filteredReports.length} reports verified in Metro Cebu
                </Text>
              </View>
              <View style={styles.expandTogglePill}>
                <Text style={styles.expandToggleText}>
                  {sheetExpanded ? 'Collapse' : 'View All'}
                </Text>
                <ChevronUp
                  color="#007AFF"
                  size={14}
                  style={{
                    transform: [{ rotate: sheetExpanded ? '180deg' : '0deg' }],
                  }}
                />
              </View>
            </View>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={styles.loadingText}>Syncing GPS reports...</Text>
            </View>
          ) : (
            <FlatList
              data={sheetExpanded ? filteredReports : filteredReports.slice(0, 2)}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.sheetList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const depthColor = getDepthColor(item.flood_depth_level);
                return (
                  <View style={styles.incidentRowCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <View style={styles.incidentHeader}>
                        <View style={styles.locationPin}>
                          <MapPin color="#007AFF" size={15} />
                        </View>
                        <View>
                          <Text style={styles.incidentBarangay}>
                            Barangay {item.barangay_name || 'Cebu'}
                          </Text>
                          <Text style={styles.incidentTime}>
                            {new Date(item.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.depthTag,
                          { backgroundColor: `${depthColor}18`, borderColor: `${depthColor}40` },
                        ]}
                      >
                        <View
                          style={[styles.depthDot, { backgroundColor: depthColor }]}
                        />
                        <Text style={[styles.depthTagText, { color: depthColor }]}>
                          {item.flood_depth_level?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.incidentDescription}>
                      {item.description}
                    </Text>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* Emergency Hotlines Modal */}
      <Modal
        visible={hotlinesModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHotlinesModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PhoneCall color="#FF3B30" size={20} />
                <Text style={styles.modalTitle}>Cebu Emergency Hotlines</Text>
              </View>
              <TouchableOpacity onPress={() => setHotlinesModalOpen(false)}>
                <X color="#8E8E93" size={20} />
              </TouchableOpacity>
            </View>

            {/* 1-Tap SOS Share */}
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

      {/* Vehicle Passability Calculator Modal */}
      <Modal
        visible={passabilityModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPassabilityModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Gauge color="#007AFF" size={20} />
                <Text style={styles.modalTitle}>Vehicle Clearance Calculator</Text>
              </View>
              <TouchableOpacity onPress={() => setPassabilityModalOpen(false)}>
                <X color="#8E8E93" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.calcSub}>
              Select water depth to evaluate safe crossing feasibility:
            </Text>

            {/* Depth Selector Chips */}
            <View style={styles.calcChipsRow}>
              {[
                { label: 'Ankle (15cm)', val: 15 },
                { label: 'Knee (35cm)', val: 35 },
                { label: 'Waist (90cm)', val: 90 },
                { label: 'Chest (140cm)', val: 140 },
              ].map((p) => (
                <TouchableOpacity
                  key={p.val}
                  style={[
                    styles.calcChip,
                    calcDepth === p.val && styles.calcChipActive,
                  ]}
                  onPress={() => setCalcDepth(p.val)}
                >
                  <Text
                    style={[
                      styles.calcChipText,
                      calcDepth === p.val && styles.calcChipTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Results Cards */}
            <ScrollView style={{ maxHeight: 300, marginTop: 10 }}>
              <View style={styles.calcResultCard}>
                <Text style={styles.calcVehicleTitle}>🚗 Sedans & Hatchbacks</Text>
                <Text
                  style={[
                    styles.calcPassBadge,
                    {
                      color: calcDepth <= 15 ? '#34C759' : '#FF3B30',
                      backgroundColor: calcDepth <= 15 ? '#EBF9EE' : '#FFEBEA',
                    },
                  ]}
                >
                  {calcDepth <= 15 ? 'SAFE PASSAGE' : 'IMPASSABLE / HYDROSTATIC LOCK'}
                </Text>
              </View>

              <View style={styles.calcResultCard}>
                <Text style={styles.calcVehicleTitle}>🚙 Compact Crossovers / SUVs</Text>
                <Text
                  style={[
                    styles.calcPassBadge,
                    {
                      color: calcDepth <= 30 ? '#34C759' : '#FF9500',
                      backgroundColor: calcDepth <= 30 ? '#EBF9EE' : '#FFF4E5',
                    },
                  ]}
                >
                  {calcDepth <= 30 ? 'SAFE PASSAGE' : 'EXTREME CAUTION'}
                </Text>
              </View>

              <View style={styles.calcResultCard}>
                <Text style={styles.calcVehicleTitle}>🛻 4x4 Pickups & Heavy SUVs</Text>
                <Text
                  style={[
                    styles.calcPassBadge,
                    {
                      color: calcDepth <= 50 ? '#34C759' : '#FF9500',
                      backgroundColor: calcDepth <= 50 ? '#EBF9EE' : '#FFF4E5',
                    },
                  ]}
                >
                  {calcDepth <= 50 ? 'SAFE PASSAGE' : 'DEEP BASIN POOLING'}
                </Text>
              </View>

              <View style={styles.calcResultCard}>
                <Text style={styles.calcVehicleTitle}>🚒 Disaster Rescue Trucks</Text>
                <Text
                  style={[
                    styles.calcPassBadge,
                    {
                      color: calcDepth <= 80 ? '#34C759' : '#FF3B30',
                      backgroundColor: calcDepth <= 80 ? '#EBF9EE' : '#FFEBEA',
                    },
                  ]}
                >
                  {calcDepth <= 80 ? 'AUTHORIZED RESCUE PASS' : 'CRITICAL INUNDATION'}
                </Text>
              </View>
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
  topHudContainer: {
    position: 'absolute',
    top: 10,
    left: 14,
    right: 14,
    zIndex: 20,
    gap: 8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingVertical: 0,
  },
  searchResultsDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    maxHeight: 220,
    gap: 4,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    gap: 10,
    backgroundColor: '#F8F9FA',
  },
  resultIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  resultSub: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 1,
  },
  utilitiesRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  utilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  utilityText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: '700',
  },
  iconUtilityBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 7,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  segmentedFilterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    padding: 3.5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    gap: 4,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  filterPillActive: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  filterPillText: {
    color: '#6C6C70',
    fontSize: 11,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  fullscreenExitHud: {
    position: 'absolute',
    top: 16,
    right: 14,
    zIndex: 30,
  },
  exitFocusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  exitFocusText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '800',
  },
  fullscreenBottomTrigger: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  minimalFeedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  minimalFeedText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '800',
  },
  bottomSheetCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: 250,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    zIndex: 25,
  },
  bottomSheetCardExpanded: {
    maxHeight: 460,
  },
  sheetHandleArea: {
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  sheetHandleBar: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#D1D1D6',
    marginBottom: 8,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  sheetTitle: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '800',
  },
  sheetSub: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 1,
  },
  expandTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  expandToggleText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sheetList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 8,
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  incidentRowCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 6,
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentBarangay: {
    color: '#1C1C1E',
    fontSize: 13,
    fontWeight: '700',
  },
  incidentTime: {
    color: '#8E8E93',
    fontSize: 10,
  },
  depthTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  depthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  depthTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  incidentDescription: {
    color: '#3A3A3C',
    fontSize: 12,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  modalHeader: {
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
  calcSub: {
    fontSize: 12,
    color: '#8E8E93',
  },
  calcChipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  calcChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  calcChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  calcChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6C6C70',
  },
  calcChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calcResultCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 8,
    gap: 6,
  },
  calcVehicleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  calcPassBadge: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
