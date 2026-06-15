import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#185FA5',
        tabBarInactiveTintColor: '#888',
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '500' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Logbook',
          tabBarLabel: 'Camera',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="camera-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Review',
          tabBarLabel: 'Review',
          tabBarIcon: ({ color, size }) => <Ionicons name="images-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="save"
        options={{
          title: 'Save',
          tabBarLabel: 'Save',
          tabBarIcon: ({ color, size }) => <Ionicons name="save-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}