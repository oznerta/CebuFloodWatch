import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import {
  Home,
  Compass,
  MapPin,
  CheckCircle,
  WifiOff,
  Phone,
  Navigation,
  Mountain,
  AlertTriangle,
  ChevronUp,
  Maximize2,
  Minimize2,
  ListFilter,
} from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { getOfflineShelters, getOfflineCorridors } from '../services/sqlite';
import { mobileFetch } from '../services/api';
import { MobileMap } from '../components/MobileMap';

export function SafeEvacuationScreen() {
  const [shelters, setShelters] = useState<any[]>([]);
  const [corridors, setCorridors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'shelters' | 'corridors'>('shelters');
  const [selectedCorridor, setSelectedCorridor] = useState<any | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [isImmersiveFullscreen, setIsImmersiveFullscreen] = useState(false);

  useEffect(() => {
    async function loadEvacuationData() {
      // 1. Try fetching online nearest shelters
      try {
        const liveShelters = await mobileFetch<any[]>('/shelters/nearest?lat=10.3157&lng=123.8854');
        if (liveShelters && liveShelters.length > 0) {
          setShelters(liveShelters);
        } else {
          const offlineS = await getOfflineShelters();
          setShelters(offlineS);
        }
      } catch {
        const offlineS = await getOfflineShelters();
        setShelters(offlineS);
      }

      // 2. Load pre-computed offline corridors
      try {
        const offlineC = await getOfflineCorridors();
        setCorridors(offlineC);
      } catch (err) {
        console.warn('Error loading offline corridors:', err);
      }
    }

    loadEvacuationData();
  }, []);

  const handleCall = (phoneNumber?: string) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Fullscreen Map Backdrop */}
      <View style={StyleSheet.absoluteFillObject}>
        <MobileMap shelters={shelters} showHazards={false} />
      </View>

      {/* 2. Floating Top Header & Segmented HUD */}
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
          {/* Offline Mode Banner with Fullscreen Pill */}
          <View style={styles.offlineBannerPill}>
            <WifiOff color="#007AFF" size={14} />
            <Text style={styles.offlineBannerText}>
              2-Tier Offline SQLite Active
            </Text>

            <TouchableOpacity
              style={styles.fullscreenIconBtn}
              onPress={() => setIsImmersiveFullscreen(true)}
              accessibilityLabel="Fullscreen Focus"
            >
              <Maximize2 color="#007AFF" size={13} />
            </TouchableOpacity>
          </View>

          {/* Apple Segmented Control */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                activeTab === 'shelters' && styles.segmentBtnActive,
              ]}
              onPress={() => {
                setActiveTab('shelters');
                setSelectedCorridor(null);
              }}
            >
              <Home
                color={activeTab === 'shelters' ? '#FFFFFF' : '#6C6C70'}
                size={15}
              />
              <Text
                style={[
                  styles.segmentText,
                  activeTab === 'shelters' && styles.segmentTextActive,
                ]}
              >
                Shelters ({shelters.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                activeTab === 'corridors' && styles.segmentBtnActive,
              ]}
              onPress={() => setActiveTab('corridors')}
            >
              <Compass
                color={activeTab === 'corridors' ? '#FFFFFF' : '#6C6C70'}
                size={15}
              />
              <Text
                style={[
                  styles.segmentText,
                  activeTab === 'corridors' && styles.segmentTextActive,
                ]}
              >
                Corridors ({corridors.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. Floating Bottom Sheet Evacuation Panel */}
      {isImmersiveFullscreen ? (
        <View style={styles.fullscreenBottomTrigger}>
          <TouchableOpacity
            style={styles.minimalFeedPill}
            onPress={() => setIsImmersiveFullscreen(false)}
          >
            <ListFilter color="#007AFF" size={14} />
            <Text style={styles.minimalFeedText}>
              Show {activeTab === 'shelters' ? 'Shelters' : 'Corridors'} List
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={[
            styles.bottomSheet,
            sheetExpanded && styles.bottomSheetExpanded,
          ]}
        >
          <TouchableOpacity
            style={styles.sheetHandleArea}
            onPress={() => setSheetExpanded(!sheetExpanded)}
          >
            <View style={styles.handleBar} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {activeTab === 'shelters'
                  ? 'Open Evacuation Centers'
                  : 'Safe High-Ground Corridors'}
              </Text>
              <View style={styles.togglePill}>
                <Text style={styles.toggleText}>
                  {sheetExpanded ? 'Collapse' : 'Expand'}
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

          {activeTab === 'shelters' ? (
            <FlatList
              data={sheetExpanded ? shelters : shelters.slice(0, 2)}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const occPct = Math.round(
                  ((item.current_occupancy || 0) / item.max_capacity) * 100
                );
                return (
                  <View style={styles.shelterCard}>
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.barangayTag}>
                          Barangay {item.barangay_name || 'Cebu'}
                        </Text>
                        <Text style={styles.shelterName}>{item.name}</Text>
                        <Text style={styles.shelterAddress}>{item.address}</Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          item.status === 'open'
                            ? styles.statusOpen
                            : styles.statusFull,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            item.status === 'open'
                              ? styles.statusTextOpen
                              : styles.statusTextFull,
                          ]}
                        >
                          {item.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.occupancyBox}>
                      <View style={styles.occupancyLabels}>
                        <Text style={styles.occupancyLabel}>Occupancy Capacity</Text>
                        <Text style={styles.occupancyValue}>
                          {item.current_occupancy || 0} / {item.max_capacity} ({occPct}%)
                        </Text>
                      </View>
                      <View style={styles.barBackground}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${Math.min(100, occPct)}%`,
                              backgroundColor: occPct >= 90 ? '#FF3B30' : '#34C759',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Card Action Buttons */}
                    <View style={styles.cardActionsRow}>
                      <Text style={styles.distanceBadge}>
                        📍 {item.distance_meters ? `${item.distance_meters}m away` : 'Metro Cebu Safe Zone'}
                      </Text>

                      {item.contact_number && (
                        <TouchableOpacity
                          style={styles.callButton}
                          onPress={() => handleCall(item.contact_number)}
                        >
                          <Phone color="#FFFFFF" size={13} />
                          <Text style={styles.callButtonText}>Call Center</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          ) : selectedCorridor ? (
            /* Step-by-step route view */
            <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailScrollContent}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setSelectedCorridor(null)}
              >
                <Text style={styles.backBtnText}>← All High-Ground Corridors</Text>
              </TouchableOpacity>

              <Text style={styles.corridorTitle}>{selectedCorridor.route_name}</Text>
              <Text style={styles.corridorDestination}>
                Target: {selectedCorridor.destination_shelter}
              </Text>

              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Navigation color="#007AFF" size={18} />
                  <Text style={styles.metricBig}>{selectedCorridor.distance_meters}m</Text>
                  <Text style={styles.metricSmall}>Distance</Text>
                </View>
                <View style={styles.metricCard}>
                  <Mountain color="#34C759" size={18} />
                  <Text style={styles.metricBig}>+{selectedCorridor.elevation_gain_meters}m</Text>
                  <Text style={styles.metricSmall}>Elevation Gain</Text>
                </View>
              </View>

              <View style={styles.hazardAlertPill}>
                <AlertTriangle color="#FF9500" size={16} />
                <Text style={styles.hazardAlertText}>
                  {selectedCorridor.hazard_avoidance_notes}
                </Text>
              </View>

              <Text style={styles.stepsTitle}>Turn-by-Turn Waypoints</Text>
              {selectedCorridor.turn_steps?.map((step: string, index: number) => (
                <View key={index} style={styles.stepCard}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeNum}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepDesc}>{step}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            /* Corridors List */
            <FlatList
              data={sheetExpanded ? corridors : corridors.slice(0, 2)}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.corridorRow}
                  onPress={() => setSelectedCorridor(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.corridorOrigin}>From Barangay {item.origin_barangay}</Text>
                    <Text style={styles.corridorName}>{item.route_name}</Text>
                    <Text style={styles.corridorTarget}>
                      To {item.destination_shelter} ({item.distance_meters}m)
                    </Text>
                  </View>
                  <View style={styles.safeTag}>
                    <CheckCircle color="#34C759" size={14} />
                    <Text style={styles.safeTagText}>Safe</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
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
    top: 12,
    left: 14,
    right: 14,
    zIndex: 20,
    gap: 8,
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
  offlineBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  offlineBannerText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: '700',
  },
  fullscreenIconBtn: {
    padding: 4,
    borderRadius: 10,
    backgroundColor: '#E5F1FF',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  segmentText: {
    color: '#6C6C70',
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: 280,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    zIndex: 25,
  },
  bottomSheetExpanded: {
    maxHeight: 520,
  },
  sheetHandleArea: {
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  handleBar: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#D1D1D6',
    marginBottom: 8,
  },
  sheetHeader: {
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
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  toggleText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  shelterCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  barangayTag: {
    color: '#007AFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  shelterName: {
    color: '#1C1C1E',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  shelterAddress: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusOpen: {
    backgroundColor: '#EBF9EE',
  },
  statusFull: {
    backgroundColor: '#FFF4E5',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextOpen: {
    color: '#34C759',
  },
  statusTextFull: {
    color: '#FF9500',
  },
  occupancyBox: {
    gap: 4,
  },
  occupancyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  occupancyLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
  },
  occupancyValue: {
    color: '#1C1C1E',
    fontSize: 11,
    fontWeight: '700',
  },
  barBackground: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 8,
  },
  distanceBadge: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  corridorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  corridorOrigin: {
    color: '#007AFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  corridorName: {
    color: '#1C1C1E',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  corridorTarget: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
  },
  safeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF9EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  safeTagText: {
    color: '#34C759',
    fontSize: 11,
    fontWeight: '700',
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  backBtn: {
    paddingVertical: 4,
  },
  backBtnText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '700',
  },
  corridorTitle: {
    color: '#1C1C1E',
    fontSize: 18,
    fontWeight: '800',
  },
  corridorDestination: {
    color: '#8E8E93',
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 4,
  },
  metricBig: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  metricSmall: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
  },
  hazardAlertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  hazardAlertText: {
    color: '#B25E00',
    fontSize: 11,
    flex: 1,
    fontWeight: '600',
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
    marginTop: 4,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeNum: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepDesc: {
    color: '#3A3A3C',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
});
