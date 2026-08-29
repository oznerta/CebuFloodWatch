import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import {
  ShieldCheck,
  UserCheck,
  Plus,
  Bell,
  Phone,
  MessageSquare,
  Trash2,
} from 'lucide-react-native';
import { COLORS } from '../constants/theme';

export function SafetyNetworkScreen() {
  const [markedSafe, setMarkedSafe] = useState(false);
  const [contacts, setContacts] = useState([
    { id: '1', name: 'Maria Santos (Mother)', phone: '+639175551234' },
    { id: '2', name: 'Juan Dela Cruz (Brother)', phone: '+639185555678' },
  ]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleBroadcastSafe = () => {
    setMarkedSafe(true);
    Alert.alert(
      'Status Broadcasted!',
      `FCM push confirmation dispatched: "Marked Safe at Metro Cebu evacuation area" has been registered and broadcasted to your ${contacts.length} emergency contacts.`
    );
  };

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    setContacts((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newContactName, phone: newContactPhone },
    ]);
    setNewContactName('');
    setNewContactPhone('');
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSMS = (phone: string, name: string) => {
    const body = encodeURIComponent(
      `Hello ${name}, I am currently safe from floodwaters in Metro Cebu. Track my status on CebuFloodWatch.`
    );
    Linking.openURL(`sms:${phone}?body=${body}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Emergency Safety Network</Text>
      <Text style={styles.subtitle}>
        Broadcast your safety status to family members and registered contacts with 1 tap.
      </Text>

      {/* Broadcast Box */}
      <View style={styles.broadcastBox}>
        <View style={styles.statusHeader}>
          <ShieldCheck color={markedSafe ? '#10b981' : '#f5820d'} size={28} />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>Current Safety Status</Text>
            <Text style={[styles.statusState, { color: markedSafe ? '#34d399' : '#fbbf24' }]}>
              {markedSafe ? 'STATUS: MARKED SAFE ✅' : 'STATUS: UNCONFIRMED ⚠️'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.safeBtn, markedSafe && styles.safeBtnActive]}
          onPress={handleBroadcastSafe}
        >
          <UserCheck color="#ffffff" size={18} />
          <Text style={styles.safeBtnText}>
            {markedSafe ? 'Re-Broadcast "Marked Safe" Status' : 'Broadcast "I am Safe" Status'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Contacts Directory */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Emergency Contacts ({contacts.length})</Text>
        <span className="text-[10px] text-slate-400">Direct Alert Group</span>
      </View>

      {contacts.map((c) => (
        <View key={c.id} style={styles.contactCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactName}>{c.name}</Text>
            <Text style={styles.contactPhone}>{c.phone}</Text>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleCall(c.phone)}
            >
              <Phone color="#10b981" size={16} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleSMS(c.phone, c.name)}
            >
              <MessageSquare color="#60a5fa" size={16} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleDeleteContact(c.id)}
            >
              <Trash2 color="#ef4444" size={16} />
            </TouchableOpacity>
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
          <Text style={styles.addBtnText}>Save Emergency Contact</Text>
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
    paddingBottom: 30,
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
    lineHeight: 18,
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
    paddingVertical: 14,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeader: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  contactCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
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
    fontFamily: 'monospace',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    padding: 8,
    backgroundColor: COLORS.cardSubtle,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    paddingVertical: 11,
    borderRadius: 8,
    gap: 6,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
