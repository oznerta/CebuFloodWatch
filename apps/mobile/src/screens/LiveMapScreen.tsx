import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { MapPin, AlertTriangle, ShieldCheck, Radio } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { mobileFetch } from '../services/api';

export function LiveMapScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await mobileFetch<any[]>('/reports');
      setReports(data);
    } catch {
      // Offline fallback sample data
      setReports([
        {
          id: '1',
          barangay_name: 'Mabolo',
          flood_depth_level: 'waist',
          description: 'Suba river overflow near Mabolo church',
          latitude: 10.325,
          longitude: 123.9167,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          barangay_name: 'Mambaling',
          flood_depth_level: 'chest',
          description: 'Underpass flooded, avoid light vehicles',
          latitude: 10.2915,
          longitude: 123.8742,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Alert Header */}
      <View style={styles.header}>
        <View style={styles.alertBanner}>
          <AlertTriangle color="#ea3838" size={18} />
          <Text style={styles.alertText}>Active Flood Advisory: Metro Cebu</Text>
        </View>
      </View>

      {/* Map Placeholder Container */}
      <View style={styles.mapContainer}>
        <Radio color={COLORS.primary} size={36} />
        <Text style={styles.mapTitle}>Metro Cebu Live Hazard Grid</Text>
        <Text style={styles.mapSubtitle}>UP NOAH 5/25/100-Year Flood Hazard Overlays</Text>
      </View>

      {/* Nearby Reports List */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Recent Nearby Reports</Text>
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.reportCard}>
              <View style={styles.cardHeader}>
                <View style={styles.locRow}>
                  <MapPin color={COLORS.textSecondary} size={14} />
                  <Text style={styles.barangayName}>{item.barangay_name || 'Barangay'}</Text>
                </View>
                <View style={[styles.badge, item.flood_depth_level === 'waist' ? styles.badgeRed : styles.badgeOrange]}>
                  <Text style={styles.badgeText}>{item.flood_depth_level?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.reportDesc}>{item.description}</Text>
              <Text style={styles.reportTime}>{new Date(item.created_at).toLocaleTimeString()}</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a0d0d',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    gap: 8,
  },
  alertText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: 'bold',
  },
  mapContainer: {
    height: 180,
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 8,
  },
  mapSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  listSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportCard: {
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
    marginBottom: 6,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barangayName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeRed: {
    backgroundColor: '#7f1d1d',
  },
  badgeOrange: {
    backgroundColor: '#78350f',
  },
  badgeText: {
    color: '#fef3c7',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reportDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  reportTime: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 6,
  },
});
