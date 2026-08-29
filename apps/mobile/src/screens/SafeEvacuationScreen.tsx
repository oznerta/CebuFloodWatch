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
} from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { getOfflineShelters, getOfflineCorridors } from '../services/sqlite';
import { mobileFetch } from '../services/api';

export function SafeEvacuationScreen() {
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

  return (
    <View style={styles.container}>
      {/* Offline Resilience Mode Banner */}
      <View style={styles.offlineBanner}>
        <WifiOff color="#60a5fa" size={14} />
        <Text style={styles.offlineBannerText}>
          Offline 2-Tier Resilient Mode Active — SQLite Cached Corridors
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shelters' && styles.activeTab]}
          onPress={() => {
            setActiveTab('shelters');
            setSelectedCorridor(null);
          }}
        >
          <Home color={activeTab === 'shelters' ? '#ffffff' : COLORS.textSecondary} size={16} />
          <Text style={[styles.tabText, activeTab === 'shelters' && styles.activeTabText]}>
            Nearby Shelters ({shelters.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'corridors' && styles.activeTab]}
          onPress={() => setActiveTab('corridors')}
        >
          <Compass color={activeTab === 'corridors' ? '#ffffff' : COLORS.textSecondary} size={16} />
          <Text style={[styles.tabText, activeTab === 'corridors' && styles.activeTabText]}>
            Safe Corridors ({corridors.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Shelters List View */}
      {activeTab === 'shelters' ? (
        <FlatList
          data={shelters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const occPct = Math.round(((item.current_occupancy || 0) / item.max_capacity) * 100);
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.barangayBadge}>
                      Barangay {item.barangay_name || 'Cebu'}
                    </Text>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'open' ? styles.statusOpen : styles.statusFull,
                    ]}
                  >
                    <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={styles.cardSubtitle}>{item.address}</Text>

                {/* Capacity Gauge */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressText}>Occupancy</Text>
                    <Text style={styles.progressText}>
                      {item.current_occupancy || 0} / {item.max_capacity} ({occPct}%)
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, occPct)}%`,
                          backgroundColor: occPct >= 90 ? '#ef4444' : '#10b981',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Action Footer */}
                <View style={styles.cardFooter}>
                  {item.distance_meters ? (
                    <Text style={styles.distanceText}>📍 {item.distance_meters}m away</Text>
                  ) : (
                    <Text style={styles.distanceText}>📍 Metro Cebu High Ground</Text>
                  )}

                  {item.contact_number && (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => handleCall(item.contact_number)}
                    >
                      <Phone color="#ffffff" size={12} />
                      <Text style={styles.callBtnText}>Call Shelter</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      ) : selectedCorridor ? (
        /* Corridor Step-by-Step Waypoint Detail View */
        <ScrollView style={styles.corridorDetail} contentContainerStyle={styles.detailContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedCorridor(null)}
          >
            <Text style={styles.backBtnText}>← Back to All Corridors</Text>
          </TouchableOpacity>

          <Text style={styles.detailTitle}>{selectedCorridor.route_name}</Text>
          <Text style={styles.detailSub}>
            Destination: {selectedCorridor.destination_shelter}
          </Text>

          <View style={styles.metricRow}>
            <View style={styles.metricBox}>
              <Navigation color={COLORS.primary} size={16} />
              <Text style={styles.metricVal}>{selectedCorridor.distance_meters}m</Text>
              <Text style={styles.metricLbl}>Walking Distance</Text>
            </View>
            <View style={styles.metricBox}>
              <Mountain color="#10b981" size={16} />
              <Text style={styles.metricVal}>+{selectedCorridor.elevation_gain_meters}m</Text>
              <Text style={styles.metricLbl}>Elevation Gain</Text>
            </View>
          </View>

          {/* Hazard Avoidance Notes */}
          <View style={styles.hazardNotesBox}>
            <AlertTriangle color="#f5820d" size={16} />
            <Text style={styles.hazardNotesText}>
              {selectedCorridor.hazard_avoidance_notes}
            </Text>
          </View>

          {/* Turn-by-Turn Navigation Steps */}
          <Text style={styles.stepsHeading}>Offline Step-by-Step Route Guidance</Text>
          {selectedCorridor.turn_steps?.map((step: string, index: number) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        /* Corridors Directory List */
        <FlatList
          data={corridors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelectedCorridor(item)}
            >
              <Text style={styles.routeOrigin}>From: Barangay {item.origin_barangay}</Text>
              <Text style={styles.cardTitle}>{item.route_name}</Text>
              <Text style={styles.cardSubtitle}>
                To: {item.destination_shelter} ({item.distance_meters}m)
              </Text>

              <View style={styles.routeFooter}>
                <CheckCircle color="#10b981" size={14} />
                <Text style={styles.passableText}>Verified Safe High-Ground Corridor</Text>
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
    backgroundColor: COLORS.background,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e3a8a',
    paddingVertical: 8,
    gap: 6,
  },
  offlineBannerText: {
    color: '#bfdbfe',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#ffffff',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  barangayBadge: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusOpen: {
    backgroundColor: '#064e3b',
  },
  statusFull: {
    backgroundColor: '#78350f',
  },
  statusText: {
    color: '#d1fae5',
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 10,
    marginBottom: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  distanceText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  callBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  routeOrigin: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  routeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  passableText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: 'bold',
  },
  corridorDetail: {
    flex: 1,
  },
  detailContent: {
    padding: 16,
    paddingBottom: 30,
  },
  backBtn: {
    marginBottom: 12,
  },
  backBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  detailTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 14,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricVal: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  metricLbl: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  hazardNotesBox: {
    flexDirection: 'row',
    backgroundColor: '#451a03',
    borderRadius: 8,
    padding: 12,
    gap: 10,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#78350f',
  },
  hazardNotesText: {
    color: '#fed7aa',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  stepsHeading: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    color: COLORS.text,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
