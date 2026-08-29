import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { ShieldCheck, UserCheck, Plus, Bell, HeartHandshake } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

export function SafetyNetworkScreen() {
  const [markedSafe, setMarkedSafe] = useState(false);
  const [contacts, setContacts] = useState([
    { id: '1', name: 'Maria Santos (Mother)', phone: '+63 917 555 1234' },
    { id: '2', name: 'Juan Dela Cruz (Brother)', phone: '+63 918 555 5678' },
  ]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleBroadcastSafe = () => {
    setMarkedSafe(true);
    Alert.alert(
      'Status Broadcasted',
      'FCM push notification dispatched: "Marked Safe at Metro Cebu evacuation zone" sent to your 2 emergency contacts.'
    );
  };

  const handleAddContact = () => {
    if (!newContactName || !newContactPhone) return;
    setContacts((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newContactName, phone: newContactPhone },
    ]);
    setNewContactName('');
    setNewContactPhone('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Safety Network & Broadcast</Text>
      <Text style={styles.subtitle}>
        Broadcast your safety status to your family & emergency contacts with 1-tap.
      </Text>

      {/* Broadcast Button */}
      <View style={styles.broadcastBox}>
        <View style={styles.statusHeader}>
          <ShieldCheck color={markedSafe ? '#10b981' : '#f5820d'} size={28} />
          <View>
            <Text style={styles.statusTitle}>Current Safety Status</Text>
            <Text style={[styles.statusState, { color: markedSafe ? '#34d399' : '#fbbf24' }]}>
              {markedSafe ? 'BROADCASTED: MARKED SAFE' : 'UNCONFIRMED STATUS'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.safeBtn, markedSafe && styles.safeBtnActive]}
          onPress={handleBroadcastSafe}
        >
          <UserCheck color="#ffffff" size={18} />
          <Text style={styles.safeBtnText}>
            {markedSafe ? 'Re-Broadcast "Marked Safe"' : 'Broadcast "I am Safe"'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Contacts Directory */}
      <Text style={styles.sectionHeader}>Emergency Contacts ({contacts.length})</Text>
      {contacts.map((c) => (
        <View key={c.id} style={styles.contactCard}>
          <View>
            <Text style={styles.contactName}>{c.name}</Text>
            <Text style={styles.contactPhone}>{c.phone}</Text>
          </View>
          <View style={styles.smsChip}>
            <Bell color="#94a3b8" size={14} />
            <Text style={styles.smsChipText}>FCM Push</Text>
          </View>
        </View>
      ))}

      {/* Add Contact Form */}
      <View style={styles.addCard}>
        <Text style={styles.addTitle}>Add Emergency Contact</Text>
        <TextInput
          style={styles.input}
          placeholder="Name & Relationship (e.g. Elena - Sister)"
          placeholderTextColor="#64748b"
          value={newContactName}
          onChangeText={setNewContactName}
        />
        <TextInput
          style={styles.input}
          placeholder="Mobile Number (+63 9XX XXX XXXX)"
          placeholderTextColor="#64748b"
          value={newContactPhone}
          onChangeText={setNewContactPhone}
          keyboardType="phone-pad"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAddContact}>
          <Plus color="#ffffff" size={16} />
          <Text style={styles.addBtnText}>Save Contact</Text>
        </TouchableOpacity>
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
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  broadcastBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statusTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  statusState: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  safeBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  safeBtnActive: {
    backgroundColor: '#047857',
  },
  safeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionHeader: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  contactCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  contactPhone: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  smsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  smsChipText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    color: COLORS.text,
    fontSize: 13,
    marginBottom: 10,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
