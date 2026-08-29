import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { User, MapPin, Globe, Bell, Shield, LogOut } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

export function ProfileScreen() {
  const [selectedBarangay, setSelectedBarangay] = useState('Mabolo');
  const [language, setLanguage] = useState<'en' | 'tl'>('en');
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <User color="#ffffff" size={32} />
        </View>
        <Text style={styles.userName}>Citizen User (Cebu Resident)</Text>
        <Text style={styles.userRole}>Registered Household Member</Text>
      </View>

      {/* Settings Section */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Location & Geofencing</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <MapPin color={COLORS.primary} size={18} />
            <Text style={styles.rowLabel}>Home Barangay</Text>
          </View>
          <Text style={styles.rowValue}>{selectedBarangay}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Emergency Notification Preferences</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Bell color={COLORS.primary} size={18} />
            <Text style={styles.rowLabel}>FCM Barangay Push Alerts</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: '#334155', true: COLORS.primary }}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Language & Localization</Text>
        <View style={styles.langToggle}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'tl' && styles.langBtnActive]}
            onPress={() => setLanguage('tl')}
          >
            <Text style={[styles.langText, language === 'tl' && styles.langTextActive]}>Tagalog</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>CebuFloodWatch Mobile v1.0.0</Text>
        <Text style={styles.appCredits}>CIT-U Senior Capstone Project · CDRRMO Integrated</Text>
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
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
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
    color: COLORS.textSecondary,
    fontSize: 12,
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
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowLabel: {
    color: COLORS.text,
    fontSize: 13,
  },
  rowValue: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  langToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: COLORS.cardSubtle,
  },
  langBtnActive: {
    backgroundColor: COLORS.primary,
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
    marginTop: 20,
    paddingBottom: 20,
  },
  appVersion: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  appCredits: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 4,
  },
});
