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
  Zap,
  Droplets,
  HeartPulse,
  Package,
  Map as MapIcon,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import { getOfflineShelters, getOfflineCorridors } from '../services/sqlite';
import { mobileFetch } from '../services/api';

export function SafeEvacuationScreen() {
  const navigation = useNavigation<any>();
  const [shelters, setShelters] = useState<any[]>([]);
  const [corridors, setCorridors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'shelters' | 'corridors'>('shelters');
  const [selectedCorridor, setSelectedCorridor] = useState<any | null>(null);

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

  const handleViewOnLiveMap = () => {
    navigation.navigate('LiveMap');
  };

  return (
    <View style={styles.container}>
      {/* 1. Top Header & Offline Banner */}
      <View style={styles.headerContainer}>
        <View style={styles.offlineBanner}>
          <View style={styles.offlineTag}>
            <WifiOff color="#007AFF" size={13} />
            <Text style={styles.offlineText}>2-Tier SQLite Offline Cache Active</Text>
          </View>
          <TouchableOpacity
            style={styles.sosQuickBtn}
            onPress={() => Linking.openURL('tel:161')}
          >
            <Phone color="#FFFFFF" size={12} />
            <Text style={styles.sosQuickText}>CDRRMO 161</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Apple Segmented Control Tabs */}
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
              Shelter Directory ({shelters.length})
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
              Safe Corridors ({corridors.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Main Directory Body */}
      {activeTab === 'shelters' ? (
        <FlatList
          data={shelters}
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
                      BARANGAY {item.barangay_name?.toUpperCase() || 'CEBU'}
                    </Text>
                    <Text style={styles.shelterName}>{item.name}</Text>
                    <Text style={styles.shelterAddress}>
                      📍 {item.distance_meters ? `${item.distance_meters}m away` : 'Metro Cebu Zone'} &bull; {item.address || 'Designated Disaster Center'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'open' ? styles.statusOpen : styles.statusFull,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.status === 'open' ? styles.statusTextOpen : styles.statusTextFull,
                      ]}
                    >
                      {item.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Capacity Gauge */}
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

                {/* Facility Badges */}
                <View style={styles.facilitiesRow}>
                  <View style={styles.facilityPill}>
                    <Zap color="#FF9500" size={11} />
                    <Text style={styles.facilityText}>Generator Backup</Text>
                  </View>
                  <View style={styles.facilityPill}>
                    <Droplets color="#007AFF" size={11} />
                    <Text style={styles.facilityText}>Clean Water</Text>
                  </View>
                  <View style={styles.facilityPill}>
                    <HeartPulse color="#FF3B30" size={11} />
                    <Text style={styles.facilityText}>First Aid</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.viewMapButton}
                    onPress={handleViewOnLiveMap}
                  >
                    <MapIcon color="#007AFF" size={13} />
                    <Text style={styles.viewMapText}>View on Live Map</Text>
                  </TouchableOpacity>

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
        /* Step-by-Step Waypoint Detail View */
        <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailScrollContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedCorridor(null)}
          >
            <Text style={styles.backBtnText}>← Back to All Corridors</Text>
          </TouchableOpacity>

          <Text style={styles.corridorTitle}>{selectedCorridor.route_name}</Text>
          <Text style={styles.corridorDestination}>
            Destination: {selectedCorridor.destination_shelter}
          </Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Navigation color="#007AFF" size={18} />
              <Text style={styles.metricBig}>{selectedCorridor.distance_meters}m</Text>
              <Text style={styles.metricSmall}>Total Distance</Text>
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

          <Text style={styles.stepsTitle}>Turn-by-Turn Flood-Free Waypoints</Text>
          {selectedCorridor.turn_steps?.map((step: string, index: number) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeNum}>{index + 1}</Text>
              </View>
              <Text style={styles.stepDesc}>{step}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={handleViewOnLiveMap}
          >
            <MapIcon color="#FFFFFF" size={16} />
            <Text style={styles.primaryActionText}>Inspect Route on Live Map</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* Corridors Directory List */
        <FlatList
          data={corridors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.corridorCard}
              onPress={() => setSelectedCorridor(item)}
            >
              <View style={styles.corridorTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.corridorOrigin}>FROM BARANGAY {item.origin_barangay?.toUpperCase()}</Text>
                  <Text style={styles.corridorName}>{item.route_name}</Text>
                  <Text style={styles.corridorTarget}>
                    Target: {item.destination_shelter} &bull; {item.distance_meters}m distance
                  </Text>
                </View>
                <View style={styles.safeTag}>
                  <CheckCircle color="#34C759" size={13} />
                  <Text style={styles.safeTagText}>Verified Safe</Text>
                </View>
              </View>

              <Text style={styles.corridorSnippet}>
                {item.hazard_avoidance_notes}
              </Text>

              <View style={styles.corridorFooter}>
                <Text style={styles.seeRouteText}>See Turn-by-Turn Waypoints →</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 10,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  offlineText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sosQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  sosQuickText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 3.5,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 13,
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
  listContent: {
    padding: 16,
    paddingBottom: 36,
    gap: 12,
  },
  shelterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  barangayTag: {
    color: '#007AFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  shelterName: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  shelterAddress: {
    color: '#8E8E93',
    fontSize: 12,
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
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  facilitiesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  facilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  facilityText: {
    fontSize: 10,
    color: '#6C6C70',
    fontWeight: '600',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 10,
    gap: 8,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  viewMapText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: '700',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  corridorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  corridorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  corridorOrigin: {
    color: '#007AFF',
    fontSize: 10,
    fontWeight: '800',
  },
  corridorName: {
    color: '#1C1C1E',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  corridorTarget: {
    color: '#8E8E93',
    fontSize: 12,
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
  corridorSnippet: {
    color: '#3A3A3C',
    fontSize: 12,
    lineHeight: 16,
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 12,
  },
  corridorFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  seeRouteText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: '800',
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    padding: 16,
    paddingBottom: 36,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
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
    borderRadius: 14,
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
    lineHeight: 16,
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
    backgroundColor: '#FFFFFF',
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
    flex: 1,
    fontSize: 12,
    color: '#1C1C1E',
    lineHeight: 16,
  },
  primaryActionBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
