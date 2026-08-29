import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { User, Bell, Globe, CheckCircle2, Shield } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

const CEBU_BARANGAYS = [
  'Mabolo',
  'Kasambagan',
  'Mambaling',
  'Guadalupe',
  'Lahug',
  'Tejero',
  'Pari-an',
  'Banilad',
];

export function ProfileScreen() {
  const [selectedBarangay, setSelectedBarangay] = useState('Mabolo');
  const [language, setLanguage] = useState<'en' | 'tl'>('en');
  const [pushEnabled, setPushEnabled] = useState(true);

  const handleSelectBarangay = (b: string) => {
    setSelectedBarangay(b);
    Alert.alert(
      'Home Barangay Updated',
      `Subscribed to FCM topic "topics/barangay_${b.toLowerCase()}". You will receive localized flood warnings and evacuation notices for ${b}.`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <User color="#007AFF" size={32} />
        </View>
        <Text style={styles.userName}>Registered Cebu Citizen</Text>
        <View style={styles.geofenceTag}>
          <Shield color="#34C759" size={13} />
          <Text style={styles.geofenceText}>
            Subscribed: Barangay {selectedBarangay} Geofence
          </Text>
        </View>
      </View>

      {/* Section 1: Home Barangay Selector */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Home Barangay Geofence</Text>
      </View>

      <View style={styles.insetCard}>
        <Text style={styles.cardExplainer}>
          Select your primary residence to receive localized push alerts from CDRRMO.
        </Text>

        <View style={styles.chipGrid}>
          {CEBU_BARANGAYS.map((b) => {
            const isSelected = selectedBarangay === b;
            return (
              <TouchableOpacity
                key={b}
                style={[
                  styles.barangayChip,
                  isSelected && styles.barangayChipActive,
                ]}
                onPress={() => handleSelectBarangay(b)}
              >
                {isSelected && <CheckCircle2 color="#FFFFFF" size={13} />}
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextActive,
                  ]}
                >
                  {b}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Section 2: Notifications */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Emergency Alerts</Text>
      </View>

      <View style={styles.insetCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingIconWrap}>
            <Bell color="#007AFF" size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>FCM Barangay Push Warnings</Text>
            <Text style={styles.settingSub}>
              Instant alerts for flood crests & closed roads
            </Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
          />
        </View>
      </View>

      {/* Section 3: Language Preference */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Language / Wika</Text>
      </View>

      <View style={styles.insetCard}>
        <View style={styles.segmentedLanguage}>
          <TouchableOpacity
            style={[
              styles.langPill,
              language === 'en' && styles.langPillActive,
            ]}
            onPress={() => setLanguage('en')}
          >
            <Text
              style={[
                styles.langText,
                language === 'en' && styles.langTextActive,
              ]}
            >
              English
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.langPill,
              language === 'tl' && styles.langPillActive,
            ]}
            onPress={() => setLanguage('tl')}
          >
            <Text
              style={[
                styles.langText,
                language === 'tl' && styles.langTextActive,
              ]}
            >
              Tagalog / Filipino
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.appVersion}>CebuFloodWatch iOS v1.5.0</Text>
        <Text style={styles.appCredits}>
          Dual-Platform Disaster Warning & Evacuation System &bull; CIT-University
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  geofenceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EBF9EE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 6,
  },
  geofenceText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    gap: 12,
  },
  cardExplainer: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  barangayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  barangayChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  settingSub: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  segmentedLanguage: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  langPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  langPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  langText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  langTextActive: {
    color: '#007AFF',
    fontWeight: '800',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  appVersion: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
  },
  appCredits: {
    fontSize: 10,
    color: '#AEAEC2',
    textAlign: 'center',
  },
});
