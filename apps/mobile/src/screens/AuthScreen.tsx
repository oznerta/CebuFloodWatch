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
} from 'react-native';
import {
  ShieldCheck,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  UserCheck,
  Sparkles,
} from 'lucide-react-native';

interface AuthScreenProps {
  onSuccess: (userData: { name: string; phone?: string; email?: string; isAnonymous?: boolean }) => void;
  onCancel?: () => void;
}

export function AuthScreen({ onSuccess, onCancel }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('+63 917 123 4567');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('Juan Citizen');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess({
        name: fullName || 'Cebu Citizen',
        phone,
        isAnonymous: false,
      });
    }, 600);
  };

  const handleEmailSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess({
        name: fullName || 'Cebu Citizen',
        email,
        isAnonymous: false,
      });
    }, 600);
  };

  const handleAnonymous = () => {
    onSuccess({
      name: 'Guest Citizen',
      isAnonymous: true,
    });
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
          {/* Segmented Auth Method Switcher */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentBtn, authMode === 'phone' && styles.segmentBtnActive]}
              onPress={() => setAuthMode('phone')}
            >
              <Phone color={authMode === 'phone' ? '#FFFFFF' : '#6C6C70'} size={14} />
              <Text style={[styles.segmentText, authMode === 'phone' && styles.segmentTextActive]}>
                Mobile SMS OTP
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, authMode === 'email' && styles.segmentBtnActive]}
              onPress={() => setAuthMode('email')}
            >
              <Mail color={authMode === 'email' ? '#FFFFFF' : '#6C6C70'} size={14} />
              <Text style={[styles.segmentText, authMode === 'email' && styles.segmentTextActive]}>
                Email Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>YOUR FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Juan Dela Cruz"
              placeholderTextColor="#8E8E93"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {authMode === 'phone' ? (
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>MOBILE PHONE NUMBER (FOR EMERGENCY SMS)</Text>
              <View style={styles.inputRow}>
                <Phone color="#8E8E93" size={16} />
                <TextInput
                  style={styles.inputFlex}
                  placeholder="+63 900 000 0000"
                  placeholderTextColor="#8E8E93"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
              <Text style={styles.fieldHint}>
                We will send localized disaster warnings and family safety updates to this number.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                <View style={styles.inputRow}>
                  <Mail color="#8E8E93" size={16} />
                  <TextInput
                    style={styles.inputFlex}
                    placeholder="juan@email.com"
                    placeholderTextColor="#8E8E93"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
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
            </>
          )}

          {/* Primary Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={authMode === 'phone' ? handlePhoneSubmit : handleEmailSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {authMode === 'phone' ? 'Verify & Continue with SMS' : 'Sign In / Register'}
                </Text>
                <ArrowRight color="#FFFFFF" size={16} />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>EMERGENCY ACCESS</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Anonymous Emergency Bypass Button */}
          <TouchableOpacity style={styles.anonymousBtn} onPress={handleAnonymous}>
            <UserCheck color="#007AFF" size={16} />
            <Text style={styles.anonymousBtnText}>Continue as Anonymous Citizen</Text>
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
    paddingTop: 36,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#6C6C70',
  },
  segmentTextActive: {
    color: '#FFFFFF',
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
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
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
  fieldHint: {
    fontSize: 10,
    color: '#8E8E93',
    lineHeight: 14,
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
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8E8E93',
  },
  anonymousBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    paddingVertical: 12,
    gap: 6,
  },
  anonymousBtnText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '800',
  },
  footerNote: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '600',
  },
});
