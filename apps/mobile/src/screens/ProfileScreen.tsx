import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import {
  User,
  Bell,
  CheckCircle2,
  Shield,
  LogOut,
  Mail,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface ProfileScreenProps {
  onLogout?: () => void;
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    barangay?: string;
  } | null>(null);

  const [selectedBarangay, setSelectedBarangay] = useState('Mabolo');
  const [language, setLanguage] = useState<'en' | 'ceb'>('ceb');
  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('user_session').then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
          if (parsed.barangay) {
            setSelectedBarangay(parsed.barangay);
          }
        } catch {}
      }
    });
  }, []);

  const handleSelectBarangay = (b: string) => {
    setSelectedBarangay(b);
    Alert.alert(
      'Home Barangay Geofence Updated',
      `Subscribed to real-time flood crests, river overflow alerts, and road passability for Barangay ${b}.`
    );
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_token');
    await AsyncStorage.removeItem('user_session');
    if (onLogout) {
      onLogout();
    } else {
      Alert.alert('Signed Out', 'You have been signed out. Please restart the app to log in again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <User color="#007AFF" size={32} />
        </View>
        <Text style={styles.userName}>{currentUser?.name || 'Registered Citizen'}</Text>
        <Text style={styles.userEmail}>{currentUser?.email || 'citizen@email.com'}</Text>

        <View style={styles.geofenceTag}>
          <Shield color="#34C759" size={13} />
          <Text style={styles.geofenceText}>
            Subscribed: Barangay {selectedBarangay} Geofence
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          <LogOut color="#FF3B30" size={14} />
          <Text style={styles.logoutBtnText}>Sign Out of Account</Text>
        </TouchableOpacity>
      </View>

      {/* Section 1: Home Barangay Geofence */}
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

      {/* Section 2: Emergency Notifications */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Emergency Alerts</Text>
      </View>

      <View style={styles.insetCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingIconWrap}>
            <Bell color="#007AFF" size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>CDRRMO Flood Crest Warnings</Text>
            <Text style={styles.settingSub}>
              Instant push alerts for critical river levels and impassable roads
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
        <Text style={styles.sectionTitle}>Disaster Language / Pinulongan</Text>
      </View>

      <View style={styles.insetCard}>
        <View style={styles.segmentedLanguage}>
          <TouchableOpacity
            style={[
              styles.langPill,
              language === 'ceb' && styles.langPillActive,
            ]}
            onPress={() => setLanguage('ceb')}
          >
            <Text
              style={[
                styles.langText,
                language === 'ceb' && styles.langTextActive,
              ]}
            >
              Cebuano / Bisaya (Default)
            </Text>
          </TouchableOpacity>

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
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.appVersion}>CebuFloodWatch Citizen Edition v1.5.0</Text>
        <Text style={styles.appCredits}>
          Disaster Warning & Evacuation Network &bull; CDRRMO Metro Cebu
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
    gap: 4,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  userEmail: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
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
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFEBEA',
    marginTop: 10,
  },
  logoutBtnText: {
    fontSize: 11.5,
    color: '#FF3B30',
    fontWeight: '800',
  },
  sectionHeader: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
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
    gap: 6,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  barangayChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    color: '#1C1C1E',
    fontSize: 12,
    fontWeight: '600',
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
    borderRadius: 10,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 13,
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
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  langPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 11,
  },
  langPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  langText: {
    fontSize: 11.5,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
  },
  appCredits: {
    fontSize: 10,
    color: '#C7C7CC',
    textAlign: 'center',
  },
});
