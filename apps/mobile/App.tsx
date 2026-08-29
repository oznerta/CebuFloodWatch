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
            },
            headerTintColor: COLORS.text,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 16,
            },
            tabBarStyle: {
              backgroundColor: COLORS.card,
              borderTopColor: COLORS.border,
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textSecondary,
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen
            name="LiveMap"
            component={LiveMapScreen}
            options={{
              title: 'Flood Map',
              tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="ReportFlood"
            component={ReportFloodScreen}
            options={{
              title: 'Report Flood',
              tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Evacuation"
            component={SafeEvacuationScreen}
            options={{
              title: 'Evacuation',
              tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Safety"
            component={SafetyNetworkScreen}
            options={{
              title: 'Safety Network',
              tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
