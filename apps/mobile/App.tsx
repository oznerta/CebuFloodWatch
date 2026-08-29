import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Map, PlusCircle, Compass, ShieldCheck, User } from 'lucide-react-native';

import { LiveMapScreen } from './src/screens/LiveMapScreen';
import { ReportFloodScreen } from './src/screens/ReportFloodScreen';
import { SafeEvacuationScreen } from './src/screens/SafeEvacuationScreen';
import { SafetyNetworkScreen } from './src/screens/SafetyNetworkScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { COLORS } from './src/constants/theme';

const Tab = createBottomTabNavigator();

export default function App() {
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
              backgroundColor: '#FFFFFF',
              borderTopColor: '#E5E5EA',
              height: 65,
              paddingBottom: 8,
              paddingTop: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.05,
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
          <Tab.Screen
            name="LiveMap"
            component={LiveMapScreen}
            options={{
              title: 'Cebu Flood Map',
              tabBarLabel: 'Map',
              tabBarIcon: ({ color }) => <Map color={color} size={22} />,
            }}
          />
          <Tab.Screen
            name="ReportFlood"
            component={ReportFloodScreen}
            options={{
              title: 'Report Incident',
              tabBarLabel: 'Report',
              tabBarIcon: ({ color }) => <PlusCircle color={color} size={22} />,
            }}
          />
          <Tab.Screen
            name="Evacuation"
            component={SafeEvacuationScreen}
            options={{
              title: 'Safe Evacuation',
              tabBarLabel: 'Evacuate',
              tabBarIcon: ({ color }) => <Compass color={color} size={22} />,
            }}
          />
          <Tab.Screen
            name="Safety"
            component={SafetyNetworkScreen}
            options={{
              title: 'Safety Network',
              tabBarLabel: 'Safe',
              tabBarIcon: ({ color }) => <ShieldCheck color={color} size={22} />,
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: 'Settings & Alerts',
              tabBarLabel: 'Settings',
              tabBarIcon: ({ color }) => <User color={color} size={22} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
