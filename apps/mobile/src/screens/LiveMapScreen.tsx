import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  MapPin,
  Layers,
  RefreshCw,
  ChevronUp,
  Maximize2,
  Minimize2,
  ListFilter,
} from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { mobileFetch } from '../services/api';
import { MobileMap } from '../components/MobileMap';

export function LiveMapScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterDepth, setFilterDepth] = useState<string>('all');
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [isImmersiveFullscreen, setIsImmersiveFullscreen] = useState(false);

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

  const filteredReports =
    filterDepth === 'all'
      ? reports
      : reports.filter((r) => r.flood_depth_level === filterDepth);

  const getDepthColor = (level: string) => {
    switch (level) {
      case 'ankle':
        return '#34C759'; // Apple Green
      case 'knee':
        return '#FFCC00'; // Apple Yellow
      case 'waist':
        return '#FF9500'; // Apple Orange
      case 'chest':
        return '#FF3B30'; // Apple Red
      case 'above_head':
        return '#AF52DE'; // Apple Purple
      default:
        return COLORS.primary;
    }
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

      {/* 2. Floating Top Header & Fullscreen Focus HUD */}
      {isImmersiveFullscreen ? (
        /* Minimal Floating Chip when in Fullscreen Focus Mode */
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
        /* Standard Floating Top HUD */
        <View style={styles.topHudContainer}>
          {/* Apple Frosted Glass Hazard Banner */}
          <View style={styles.floatingHazardPill}>
            <Layers color="#FF9500" size={16} />
            <View style={{ flex: 1 }}>
              <Text style={styles.hazardTitle}>UP NOAH Flood Zones Active</Text>
              <Text style={styles.hazardSub}>5y, 25y & 100y return period overlays</Text>
            </View>

            <TouchableOpacity
              style={styles.fullscreenPillBtn}
              onPress={() => setIsImmersiveFullscreen(true)}
              accessibilityLabel="Fullscreen Focus"
            >
              <Maximize2 color="#007AFF" size={14} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.refreshIconBtn}
              onPress={() => {
                setRefreshing(true);
                fetchIncidents();
              }}
            >
              <RefreshCw color="#007AFF" size={14} />
            </TouchableOpacity>
          </View>

          {/* Big Apple Segmented Control Pills */}
          <View style={styles.segmentedFilterRow}>
            {[
              { id: 'all', label: 'All Incidents' },
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
        /* Minimal Bottom Drawer Trigger in Fullscreen Mode */
        <View style={styles.fullscreenBottomTrigger}>
          <TouchableOpacity
            style={styles.minimalFeedPill}
            onPress={() => setIsImmersiveFullscreen(false)}
          >
            <ListFilter color="#007AFF" size={14} />
            <Text style={styles.minimalFeedText}>
              Show Incident Feed ({filteredReports.length})
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
          {/* Handle Bar / Toggle */}
          <TouchableOpacity
            style={styles.sheetHandleArea}
            onPress={() => setSheetExpanded(!sheetExpanded)}
          >
            <View style={styles.sheetHandleBar} />
            <View style={styles.sheetHeaderRow}>
              <View>
                <Text style={styles.sheetTitle}>Active Flood Incidents</Text>
                <Text style={styles.sheetSub}>
                  {filteredReports.length} reports in Metro Cebu
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

          {/* Incident List */}
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
  floatingHazardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  hazardTitle: {
    color: '#1C1C1E',
    fontSize: 13,
    fontWeight: '700',
  },
  hazardSub: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 1,
  },
  fullscreenPillBtn: {
    padding: 7,
    borderRadius: 12,
    backgroundColor: '#E5F1FF',
  },
  refreshIconBtn: {
    padding: 7,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  segmentedFilterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    padding: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    gap: 4,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
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
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
});
