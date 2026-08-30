import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Map, PlusCircle, ShieldCheck, User } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LiveMapScreen } from './src/screens/LiveMapScreen';
import { ReportFloodScreen } from './src/screens/ReportFloodScreen';
import { SafetyNetworkScreen } from './src/screens/SafetyNetworkScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [userSession, setUserSession] = useState<{
    name: string;
    email: string;
    token: string;
    barangay?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('user_session')
      .then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.token && parsed.email) {
              setUserSession(parsed);
            }
          } catch {}
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_token');
    await AsyncStorage.removeItem('user_session');
    setUserSession(null);
  };

  // If citizen hasn't logged in with email, present the AuthScreen
  if (loading) {
    return null;
  }

  if (!userSession) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthScreen
          onSuccess={(session) => setUserSession(session)}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#FFFFFF',
              borderBottomColor: '#E5E5EA',
              elevation: 0,
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: 2 },
            },
            headerTintColor: '#1C1C1E',
            headerTitleStyle: {
              fontWeight: '800',
              fontSize: 17,
              letterSpacing: -0.4,
            },
            tabBarStyle: {
              backgroundColor: 'rgba(255, 255, 255, 0.94)',
              borderTopColor: '#E5E5EA',
              borderTopWidth: 1,
              height: 64,
              paddingBottom: 8,
              paddingTop: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.06,
              shadowRadius: 16,
            },
            tabBarItemStyle: {
              paddingVertical: 2,
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#8E8E93',
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '700',
              marginTop: 2,
            },
          }}
        >
          {/* 1. Spatial Nervous Center (Map + Incidents + Shelters) */}
          <Tab.Screen
            name="LiveMap"
            component={LiveMapScreen}
            options={{
              headerShown: false,
              title: 'Cebu Flood Map',
              tabBarLabel: 'Map',
              tabBarIcon: ({ color }) => <Map color={color} size={22} />,
            }}
          />

          {/* 2. Rapid Incident Reporting Wizard */}
          <Tab.Screen
            name="ReportFlood"
            component={ReportFloodScreen}
            options={{
              title: 'Report Incident',
              tabBarLabel: 'Report',
              tabBarIcon: ({ color }) => <PlusCircle color={color} size={22} />,
            }}
          />

          {/* 3. Safety Network & 1-Tap SOS */}
          <Tab.Screen
            name="Safety"
            component={SafetyNetworkScreen}
            options={{
              title: 'Safety Network',
              tabBarLabel: 'Safety',
              tabBarIcon: ({ color }) => <ShieldCheck color={color} size={22} />,
            }}
          />

          {/* 4. Settings & Geofence Alerts */}
          <Tab.Screen
            name="Profile"
            options={{
              title: 'Settings & Alerts',
              tabBarLabel: 'Settings',
              tabBarIcon: ({ color }) => <User color={color} size={22} />,
            }}
          >
            {() => <ProfileScreen onLogout={handleLogout} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
