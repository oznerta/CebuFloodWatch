import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  UserPlus,
  LogIn,
  MapPin,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileFetch } from '../services/api';

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

interface AuthScreenProps {
  onSuccess: (userData: {
    name: string;
    email: string;
    token: string;
    barangay?: string;
  }) => void;
  onCancel?: () => void;
}

export function AuthScreen({ onSuccess, onCancel }: AuthScreenProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('Mabolo');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await mobileFetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      if (res && res.success && res.user && res.token) {
        await AsyncStorage.setItem('user_token', res.token);
        await AsyncStorage.setItem(
          'user_session',
          JSON.stringify({
            name: res.user.name,
            email: res.user.email,
            role: res.user.role,
            barangay: res.user.barangay || 'Mabolo',
            token: res.token,
          })
        );

        onSuccess({
          name: res.user.name,
          email: res.user.email,
          token: res.token,
          barangay: res.user.barangay,
        });
      } else {
        setErrorMessage(res?.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await mobileFetch<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role: 'citizen',
          barangay: selectedBarangay,
        }),
      });

      if (res && res.success && res.user && res.token) {
        await AsyncStorage.setItem('user_token', res.token);
        await AsyncStorage.setItem(
          'user_session',
          JSON.stringify({
            name: res.user.name,
            email: res.user.email,
            role: res.user.role,
            barangay: res.user.barangay || selectedBarangay,
            token: res.token,
          })
        );

        onSuccess({
          name: res.user.name,
          email: res.user.email,
          token: res.token,
          barangay: res.user.barangay,
        });
      } else {
        setErrorMessage(res?.error || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Shield & Title */}
        <View style={styles.brandHeader}>
          <View style={styles.shieldIconWrap}>
            <ShieldCheck color="#FFFFFF" size={32} />
          </View>
          <Text style={styles.brandTitle}>CebuFloodWatch</Text>
          <Text style={styles.brandSubtitle}>Metro Cebu Citizen Disaster Network</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.authCard}>
          {/* Segmented Switcher: Sign In vs Register */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentBtn, tab === 'login' && styles.segmentBtnActive]}
              onPress={() => {
                setTab('login');
                setErrorMessage(null);
              }}
            >
              <LogIn color={tab === 'login' ? '#FFFFFF' : '#6C6C70'} size={14} />
              <Text style={[styles.segmentText, tab === 'login' && styles.segmentTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, tab === 'register' && styles.segmentBtnActive]}
              onPress={() => {
                setTab('register');
                setErrorMessage(null);
              }}
            >
              <UserPlus color={tab === 'register' ? '#FFFFFF' : '#6C6C70'} size={14} />
              <Text style={[styles.segmentText, tab === 'register' && styles.segmentTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message Banner */}
          {errorMessage && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Fields */}
          {tab === 'register' && (
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <View style={styles.inputRow}>
                <User color="#8E8E93" size={16} />
                <TextInput
                  style={styles.inputFlex}
                  placeholder="e.g. Maria Santos"
                  placeholderTextColor="#8E8E93"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputRow}>
              <Mail color="#8E8E93" size={16} />
              <TextInput
                style={styles.inputFlex}
                placeholder="name@email.com"
                placeholderTextColor="#8E8E93"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>
              {tab === 'register' ? 'PASSWORD (MIN. 6 CHARACTERS)' : 'PASSWORD'}
            </Text>
            <View style={styles.inputRow}>
              <Lock color="#8E8E93" size={16} />
              <TextInput
                style={styles.inputFlex}
                placeholder="••••••••"
                placeholderTextColor="#8E8E93"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {tab === 'register' && (
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>HOME BARANGAY GEOFENCE</Text>
              <View style={styles.barangayPillGrid}>
                {CEBU_BARANGAYS.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[
                      styles.barangayPill,
                      selectedBarangay === b && styles.barangayPillActive,
                    ]}
                    onPress={() => setSelectedBarangay(b)}
                  >
                    <Text
                      style={[
                        styles.barangayPillText,
                        selectedBarangay === b && styles.barangayPillTextActive,
                      ]}
                    >
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Primary Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={tab === 'login' ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {tab === 'login' ? 'Sign In to Flood Network' : 'Register Account'}
                </Text>
                <ArrowRight color="#FFFFFF" size={16} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Security & Disaster Protocol Disclaimer */}
        <Text style={styles.footerNote}>
          🇵🇭 Powered by Cebu City Disaster Risk Reduction & Management Office (CDRRMO) &bull; UP NOAH
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 20,
  },
  brandHeader: {
    alignItems: 'center',
    gap: 8,
  },
  shieldIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  authCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 3.5,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 13,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  segmentText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6C6C70',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  errorCard: {
    backgroundColor: '#FFEBEA',
    borderWidth: 1,
    borderColor: '#FFD0CE',
    borderRadius: 14,
    padding: 10,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF3B30',
    textAlign: 'center',
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    paddingHorizontal: 14,
    gap: 8,
  },
  inputFlex: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  barangayPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  barangayPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  barangayPillActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  barangayPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  barangayPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 18,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  footerNote: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '600',
  },
});
