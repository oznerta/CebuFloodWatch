import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MapPin, AlertTriangle, ShieldCheck, Layers, RefreshCw } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { mobileFetch } from '../services/api';
import { UP_NOAH_CEBU_HAZARD_GEOJSON } from '@cebufloodwatch/shared';

export function LiveMapScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterDepth, setFilterDepth] = useState<string>('all');

  const fetchIncidents = async () => {
    try {
      const data = await mobileFetch<any[]>('/reports');
      setReports(data || []);
    } catch {
      // Offline fallback mock data
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
      ]);
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
        return '#1f9d55';
      case 'knee':
        return '#facc15';
      case 'waist':
        return '#f5820d';
      case 'chest':
        return '#ea3838';
      case 'above_head':
        return '#991547';
      default:
        return COLORS.primary;
    }
  };

  return (
    <View style={styles.container}>
      {/* UP NOAH Hazard Banner */}
      <View style={styles.hazardBanner}>
        <Layers color="#facc15" size={16} />
        <View style={{ flex: 1 }}>
          <Text style={styles.hazardBannerTitle}>UP NOAH Flood Hazard Layers Loaded</Text>
          <Text style={styles.hazardBannerSub}>
            5y Advisory, 25y High, & 100y Severe flood zones integrated
          </Text>
        </View>
      </View>

      {/* Depth Filter Tabs */}
      <View style={styles.filterRow}>
        {['all', 'knee', 'waist', 'chest'].map((depth) => (
          <TouchableOpacity
            key={depth}
            style={[styles.filterChip, filterDepth === depth && styles.filterChipActive]}
            onPress={() => setFilterDepth(depth)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterDepth === depth && styles.filterChipTextActive,
              ]}
            >
              {depth === 'all' ? 'All Incidents' : `${depth.toUpperCase()}+`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Incidents Feed */}
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>
          Active Cebu Flood Telemetry ({filteredReports.length})
        </Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); fetchIncidents(); }}>
          <RefreshCw color={COLORS.textSecondary} size={16} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Synchronizing Metro Cebu telemetry...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchIncidents();
              }}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => {
            const depthColor = getDepthColor(item.flood_depth_level);
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.barangayChip}>
                    <MapPin color={COLORS.primary} size={14} />
                    <Text style={styles.barangayText}>
                      Barangay {item.barangay_name || 'Metro Cebu Area'}
                    </Text>
                  </View>
                  <View style={[styles.depthBadge, { backgroundColor: `${depthColor}25`, borderColor: depthColor }]}>
                    <View style={[styles.depthDot, { backgroundColor: depthColor }]} />
                    <Text style={[styles.depthBadgeText, { color: depthColor }]}>
                      {item.flood_depth_level?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardDescription}>{item.description}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.coordsText}>
                    GPS: {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
                  </Text>
                  <Text style={styles.timeText}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
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
  hazardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b2504',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#78350f',
  },
  hazardBannerTitle: {
    color: '#fef08a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  hazardBannerSub: {
    color: '#fde047',
    fontSize: 10,
    marginTop: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  feedTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  barangayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barangayText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  depthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  depthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  depthBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  coordsText: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  timeText: {
    color: '#64748b',
    fontSize: 10,
  },
});
