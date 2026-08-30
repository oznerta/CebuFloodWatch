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
  UserPlus,
} from 'lucide-react-native';
import { COLORS } from '../constants/theme';

export function SafetyNetworkScreen() {
  const [markedSafe, setMarkedSafe] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleBroadcastSafe = () => {
    setMarkedSafe(true);
    Alert.alert(
      'Status Broadcasted! 🟢',
      `"Marked Safe in Metro Cebu" registered. Safety broadcasts ready for your ${contacts.length} emergency contacts.`
    );
  };

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      Alert.alert('Required', 'Please enter a contact name and phone number.');
      return;
    }
    setContacts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newContactName.trim(),
        role: newContactRole.trim() || 'Family',
        phone: newContactPhone.trim(),
      },
    ]);
    setNewContactName('');
    setNewContactRole('');
    setNewContactPhone('');
    setIsAdding(false);
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
            <Text style={styles.statusHeading}>
              {markedSafe ? 'Confirmed Safe' : 'Safety Status Pending'}
            </Text>
            <Text style={styles.statusSub}>
              {markedSafe
                ? 'Your safety broadcast is active for Metro Cebu.'
                : 'Tap below to notify your registered family members.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.broadcastBtn,
            markedSafe ? styles.broadcastBtnActive : styles.broadcastBtnInactive,
          ]}
          onPress={handleBroadcastSafe}
        >
          <UserCheck color="#FFFFFF" size={16} />
          <Text style={styles.broadcastBtnText}>
            {markedSafe ? '✓ Status Broadcasted' : 'I Am Safe (1-Tap Broadcast)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Contacts Section */}
      <View style={styles.contactsSectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Users color="#007AFF" size={18} />
          <Text style={styles.sectionTitle}>Family & Emergency Contacts</Text>
        </View>
        <TouchableOpacity
          style={styles.addContactPill}
          onPress={() => setIsAdding(!isAdding)}
        >
          <Plus color="#007AFF" size={13} />
          <Text style={styles.addContactPillText}>
            {isAdding ? 'Close' : 'Add Contact'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Contact Form Drawer */}
      {isAdding && (
        <View style={styles.addContactCard}>
          <Text style={styles.addContactTitle}>Register Emergency Contact</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name (e.g. Maria Santos)"
            placeholderTextColor="#8E8E93"
            value={newContactName}
            onChangeText={setNewContactName}
          />
          <TextInput
            style={styles.input}
            placeholder="Relationship (e.g. Mother, Spouse)"
            placeholderTextColor="#8E8E93"
            value={newContactRole}
            onChangeText={setNewContactRole}
          />
          <TextInput
            style={styles.input}
            placeholder="Mobile Phone (e.g. +639171234567)"
            placeholderTextColor="#8E8E93"
            keyboardType="phone-pad"
            value={newContactPhone}
            onChangeText={setNewContactPhone}
          />
          <TouchableOpacity
            style={styles.saveContactBtn}
            onPress={handleAddContact}
          >
            <Text style={styles.saveContactBtnText}>Save Contact</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contacts List */}
      {contacts.length > 0 ? (
        contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <View style={styles.roleTag}>
                  <Text style={styles.roleText}>{contact.role}</Text>
                </View>
              </View>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </View>

            <View style={styles.contactActions}>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => handleCall(contact.phone)}
              >
                <Phone color="#34C759" size={15} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => handleSMS(contact.phone, contact.name)}
              >
                <MessageSquare color="#007AFF" size={15} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionIconBtnDanger}
                onPress={() => handleDeleteContact(contact.id)}
              >
                <Trash2 color="#FF3B30" size={15} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyContactsCard}>
          <Users color="#C7C7CC" size={32} />
          <Text style={styles.emptyContactsTitle}>No Contacts Added Yet</Text>
          <Text style={styles.emptyContactsSub}>
            Add family members or neighbors to send them instant 1-tap "I Am Safe" updates during a disaster.
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => setIsAdding(true)}
          >
            <UserPlus color="#FFFFFF" size={14} />
            <Text style={styles.emptyAddBtnText}>Add First Contact</Text>
          </TouchableOpacity>
        </View>
      )}
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
    gap: 14,
  },
  headerBox: {
    paddingVertical: 4,
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  safeStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  safeStatusCardActive: {
    borderColor: '#C3F0CD',
    backgroundColor: '#FAFCFA',
  },
  statusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  statusSub: {
    fontSize: 11,
    color: '#8E8E93',
    lineHeight: 15,
    marginTop: 1,
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  broadcastBtnInactive: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
  },
  broadcastBtnActive: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
  },
  broadcastBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  contactsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  addContactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
  },
  addContactPillText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: '800',
  },
  addContactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 10,
  },
  addContactTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveContactBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveContactBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  roleTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#8E8E93',
  },
  contactPhone: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  actionIconBtnDanger: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContactsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 8,
  },
  emptyContactsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  emptyContactsSub: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
    marginTop: 4,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
