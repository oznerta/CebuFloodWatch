import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Home, Compass, MapPin, CheckCircle, WifiOff } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { getOfflineShelters, getOfflineCorridors } from '../services/sqlite';

export function SafeEvacuationScreen() {
  const [shelters, setShelters] = useState<any[]>([]);
  const [corridors, setCorridors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'shelters' | 'routes'>('shelters');

  useEffect(() => {
    async function loadOfflineData() {
      try {
        const s = await getOfflineShelters();
        const c = await getOfflineCorridors();
        setShelters(s);
        setCorridors(c);
      } catch (err) {
        console.warn('Error loading offline SQLite shelters:', err);
      }
    }
    loadOfflineData();
  }, []);

  return (
    <View style={styles.container}>
      {/* Offline Status Badge */}
      <View style={styles.offlineBanner}>
        <WifiOff color="#60a5fa" size={14} />
        <Text style={styles.offlineBannerText}>
          Offline Resilience Mode Active — SQLite Local Cache
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shelters' && styles.activeTab]}
          onPress={() => setActiveTab('shelters')}
        >
          <Home color={activeTab === 'shelters' ? '#ffffff' : COLORS.textSecondary} size={16} />
          <Text style={[styles.tabText, activeTab === 'shelters' && styles.activeTabText]}>
            Shelters ({shelters.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'routes' && styles.activeTab]}
          onPress={() => setActiveTab('routes')}
        >
          <Compass color={activeTab === 'routes' ? '#ffffff' : COLORS.textSecondary} size={16} />
          <Text style={[styles.tabText, activeTab === 'routes' && styles.activeTabText]}>
            Pre-Routes ({corridors.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content List */}
      {activeTab === 'shelters' ? (
        <FlatList
          data={shelters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
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
              <View style={styles.cardFooter}>
                <Text style={styles.capacityText}>Max Capacity: {item.max_capacity} people</Text>
                <Text style={styles.contactText}>{item.contact_number}</Text>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={corridors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.routeOrigin}>From: Barangay {item.origin_barangay}</Text>
              <Text style={styles.cardTitle}>{item.route_name}</Text>
              <Text style={styles.cardSubtitle}>Destination: {item.destination_shelter}</Text>
              <View style={styles.routeFooter}>
                <CheckCircle color="#10b981" size={14} />
                <Text style={styles.passableText}>Verified Safe High-Ground Corridor</Text>
              </View>
            </View>
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
    paddingBottom: 20,
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
  cardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  capacityText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  contactText: {
    color: COLORS.primary,
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
});
