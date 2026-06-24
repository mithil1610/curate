import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RestaurantProfileScreen from './src/screens/RestaurantProfileScreen';
import MenuChatScreen from './src/screens/MenuChatScreen';
import { ProcessedMenu } from './src/services/menuService';
import { CartProvider } from './src/context/CartContext';
import { GroupProvider } from './src/context/GroupContext';

import TasteProfileScreen from './src/screens/TasteProfileScreen';
import GroupSyncScreen from './src/screens/GroupSyncScreen';

export type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  GroupSync: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator();

export type HomeStackParamList = {
  HomeFeed: undefined;
  RestaurantProfile: {
    id: string;
    name: string;
    rating: number;
    tags: string[];
    imageUrl: string;
  };
  MenuChat: {
    menu: ProcessedMenu;
    restaurantName: string;
    restaurantId: string;
    orderingUrl: string;
  };
};

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeFeed" component={HomeScreen} />
      <HomeStack.Screen name="RestaurantProfile" component={RestaurantProfileScreen} />
      <HomeStack.Screen name="MenuChat" component={MenuChatScreen} />
    </HomeStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false, presentation: 'modal' }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="TasteProfile" component={TasteProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'GroupSync') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1a1a1a',
        tabBarInactiveTintColor: '#888',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          elevation: 0,
          shadowOpacity: 0,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="GroupSync" component={GroupSyncScreen} options={{ title: 'Group' }} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GroupProvider>
        <CartProvider>
          <NavigationContainer>
            <TabNavigator />
          </NavigationContainer>
        </CartProvider>
      </GroupProvider>
    </SafeAreaProvider>
  );
}
