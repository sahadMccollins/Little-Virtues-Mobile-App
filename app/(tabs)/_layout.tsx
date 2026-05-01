import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../constants/Colors';

const TabIcon = ({ emoji, color }: { emoji: string, color: string }) => (
  <Text style={{ fontSize: 20, color }}>{emoji}</Text>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#f0e8e0',
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.lavD,
        tabBarInactiveTintColor: '#C8B8A8',
        tabBarLabelStyle: {
          fontFamily: 'System',
          fontWeight: '700',
          fontSize: 10,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="teach"
        options={{
          title: 'Teach',
          tabBarIcon: ({ color }) => <TabIcon emoji="📚" color={color} />,
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          title: 'Stories',
          tabBarIcon: ({ color }) => <TabIcon emoji="🌙" color={color} />,
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          title: 'Downloads',
          tabBarIcon: ({ color }) => <TabIcon emoji="⬇️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} />,
        }}
      />
      <Tabs.Screen
        name="jar"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
