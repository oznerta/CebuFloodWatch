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
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.card,
              borderBottomColor: COLORS.border,
            },
            headerTintColor: COLORS.text,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 16,
            },
            tabBarStyle: {
              backgroundColor: COLORS.card,
              borderTopColor: COLORS.border,
              height: 64,
              paddingBottom: 8,
              paddingTop: 6,
            },
            tabBarItemStyle: {
              paddingVertical: 2,
            },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textSecondary,
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
              title: 'Flood Map',
              tabBarLabel: 'Map',
              tabBarIcon: ({ color }) => <Map color={color} size={20} />,
            }}
          />
          <Tab.Screen
            name="ReportFlood"
            component={ReportFloodScreen}
            options={{
              title: 'Report Flood',
              tabBarLabel: 'Report',
              tabBarIcon: ({ color }) => <PlusCircle color={color} size={20} />,
            }}
          />
          <Tab.Screen
            name="Evacuation"
            component={SafeEvacuationScreen}
            options={{
              title: 'Safe Evacuation',
              tabBarLabel: 'Evacuate',
              tabBarIcon: ({ color }) => <Compass color={color} size={20} />,
            }}
          />
          <Tab.Screen
            name="Safety"
            component={SafetyNetworkScreen}
            options={{
              title: 'Safety Network',
              tabBarLabel: 'Safe',
              tabBarIcon: ({ color }) => <ShieldCheck color={color} size={20} />,
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: 'Profile & Alerts',
              tabBarLabel: 'Profile',
              tabBarIcon: ({ color }) => <User color={color} size={20} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
