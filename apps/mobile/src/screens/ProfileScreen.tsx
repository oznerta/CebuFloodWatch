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
import { User, MapPin, Globe, Bell, Shield, CheckCircle2 } from 'lucide-react-native';
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
      {/* Profile Card */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <User color="#ffffff" size={32} />
        </View>
        <Text style={styles.userName}>Registered Cebu Citizen</Text>
        <Text style={styles.userRole}>
          Subscribed to: Barangay {selectedBarangay} Geofence
        </Text>
      </View>

      {/* Home Barangay Selection */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>1. Home Barangay (FCM Push Topic)</Text>
        <Text style={styles.cardSectionDesc}>
          Emergency alerts are targeted to your selected residence area.
        </Text>

        <View style={styles.chipGrid}>
          {CEBU_BARANGAYS.map((b) => {
            const isSelected = selectedBarangay === b;
            return (
              <TouchableOpacity
                key={b}
                style={[styles.barangayChip, isSelected && styles.barangayChipActive]}
                onPress={() => handleSelectBarangay(b)}
              >
                {isSelected && <CheckCircle2 color="#ffffff" size={12} />}
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {b}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Notification Settings */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>2. Emergency Notification Preferences</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Bell color={COLORS.primary} size={18} />
            <View>
              <Text style={styles.rowLabel}>FCM Barangay Push Alerts</Text>
              <Text style={styles.rowSub}>Instant warnings for flood crests & road blocks</Text>
            </View>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: '#334155', true: COLORS.primary }}
          />
        </View>
      </View>

      {/* Language Settings */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>3. Language Preference</Text>
        <View style={styles.langToggle}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
              English (Default)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'tl' && styles.langBtnActive]}
            onPress={() => setLanguage('tl')}
          >
            <Text style={[styles.langText, language === 'tl' && styles.langTextActive]}>
              Tagalog / Filipino
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info Footer */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>CebuFloodWatch Mobile v1.4.0</Text>
        <Text style={styles.appCredits}>
          Metro Cebu Flood Early Warning & Evacuation System · CDRRMO Linked
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  userName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userRole: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardSectionTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardSectionDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  barangayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  barangayChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  rowSub: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  langToggle: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.cardSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  langText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  langTextActive: {
    color: '#ffffff',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 10,
  },
  appVersion: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  appCredits: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 3,
    textAlign: 'center',
  },
});
