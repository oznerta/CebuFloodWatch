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
  Phone,
  MessageSquare,
  Trash2,
  Users,
  Radio,
} from 'lucide-react-native';
import { COLORS } from '../constants/theme';

export function SafetyNetworkScreen() {
  const [markedSafe, setMarkedSafe] = useState(false);
  const [contacts, setContacts] = useState([
    { id: '1', name: 'Maria Santos', role: 'Mother', phone: '+639175551234' },
    { id: '2', name: 'Juan Dela Cruz', role: 'Brother', phone: '+639185555678' },
  ]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleBroadcastSafe = () => {
    setMarkedSafe(true);
    Alert.alert(
      'Status Broadcasted! 🟢',
      `"Marked Safe in Metro Cebu" registered. FCM push dispatches sent to your ${contacts.length} emergency contacts.`
    );
  };

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    setContacts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newContactName,
        role: newContactRole || 'Family',
        phone: newContactPhone,
      },
    ]);
    setNewContactName('');
    setNewContactRole('');
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
      `Hi ${name}, I am confirmed safe from floodwaters in Metro Cebu. Tracking live updates on CebuFloodWatch.`
    );
    Linking.openURL(`sms:${phone}?body=${body}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Safety Network</Text>
        <Text style={styles.headerSubtitle}>
          Broadcast your safety status to family members and registered contacts with 1 tap.
        </Text>
      </View>

      {/* Giant Apple-Style "Mark Safe" Card */}
      <View
        style={[
          styles.safeStatusCard,
          markedSafe && styles.safeStatusCardActive,
        ]}
      >
        <View style={styles.statusTopRow}>
          <View
            style={[
              styles.statusIconWrap,
              { backgroundColor: markedSafe ? '#EBF9EE' : '#FFF4E5' },
            ]}
          >
            <ShieldCheck
              color={markedSafe ? '#34C759' : '#FF9500'}
              size={32}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusLabel}>Current Safety Status</Text>
            <Text
              style={[
                styles.statusValue,
                { color: markedSafe ? '#34C759' : '#FF9500' },
              ]}
            >
              {markedSafe ? 'Confirmed Safe ✅' : 'Status Unconfirmed ⚠️'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.broadcastBtn, markedSafe && styles.broadcastBtnActive]}
          onPress={handleBroadcastSafe}
        >
          <Radio color="#FFFFFF" size={18} />
          <Text style={styles.broadcastBtnText}>
            {markedSafe ? 'Re-Broadcast "I am Safe"' : 'Broadcast "I am Safe" Status'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Apple Contacts Inset Group */}
      <View style={styles.sectionHeader}>
        <Users color="#007AFF" size={16} />
        <Text style={styles.sectionTitle}>Emergency Contacts ({contacts.length})</Text>
      </View>

      <View style={styles.contactsGroup}>
        {contacts.map((c, index) => (
          <View
            key={c.id}
            style={[
              styles.contactRow,
              index !== contacts.length - 1 && styles.contactRowBorder,
            ]}
          >
            <View style={styles.contactAvatar}>
              <Text style={styles.avatarLetter}>
                {c.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>{c.name}</Text>
              <Text style={styles.contactRole}>
                {c.role} &bull; {c.phone}
              </Text>
            </View>

            <View style={styles.actionsPillRow}>
              <TouchableOpacity
                style={styles.actionCallBtn}
                onPress={() => handleCall(c.phone)}
              >
                <Phone color="#34C759" size={15} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionSmsBtn}
                onPress={() => handleSMS(c.phone, c.name)}
              >
                <MessageSquare color="#007AFF" size={15} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionDeleteBtn}
                onPress={() => handleDeleteContact(c.id)}
              >
                <Trash2 color="#FF3B30" size={15} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Add Contact Card */}
      <View style={styles.addContactCard}>
        <Text style={styles.addCardTitle}>Add Emergency Contact</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name (e.g. Elena Reyes)"
          placeholderTextColor="#8E8E93"
          value={newContactName}
          onChangeText={setNewContactName}
        />
        <TextInput
          style={styles.input}
          placeholder="Relationship (e.g. Sister, Neighbor)"
          placeholderTextColor="#8E8E93"
          value={newContactRole}
          onChangeText={setNewContactRole}
        />
        <TextInput
          style={styles.input}
          placeholder="Mobile Number (+63 9XX XXX XXXX)"
          placeholderTextColor="#8E8E93"
          value={newContactPhone}
          onChangeText={setNewContactPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.addBtn} onPress={handleAddContact}>
          <Plus color="#FFFFFF" size={18} />
          <Text style={styles.addBtnText}>Save Contact</Text>
        </TouchableOpacity>
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
    gap: 16,
  },
  headerBox: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    lineHeight: 20,
  },
  safeStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    gap: 16,
  },
  safeStatusCardActive: {
    borderColor: '#34C759',
    backgroundColor: '#FFFFFF',
    shadowColor: '#34C759',
    shadowOpacity: 0.15,
  },
  statusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  broadcastBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  broadcastBtnActive: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
  },
  broadcastBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
    textTransform: 'uppercase',
  },
  contactsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  contactRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '800',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  contactRole: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 1,
  },
  actionsPillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionCallBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#EBF9EE',
  },
  actionSmsBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#E5F1FF',
  },
  actionDeleteBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FFEBEA',
  },
  addContactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  addCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  addBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
