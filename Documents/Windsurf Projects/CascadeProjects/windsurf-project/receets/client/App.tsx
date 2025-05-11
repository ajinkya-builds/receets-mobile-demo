import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';

// Main Screens
import HomeScreen from './screens/main/HomeScreen';
import ScanScreen from './screens/main/ScanScreen';
import ReceiptsScreen from './screens/main/ReceiptsScreen';
import ProfileScreen from './screens/main/ProfileScreen';

// Transaction Screens
import SaleDetailsScreen from './screens/transaction/SaleDetailsScreen';
import EditSaleScreen from './screens/transaction/EditSaleScreen';
import PaymentScreen from './screens/transaction/PaymentScreen';
import ReceiptScreen from './screens/transaction/ReceiptScreen';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Types
import { RootStackParamList, MainTabParamList } from './types/navigation';

// Theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4A6FFF',
    accent: '#FF6B6B',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#333333',
    error: '#FF5252',
  },
};

// Stack Navigator
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Tab Navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Scan') {
            iconName = focused ? 'qr-code' : 'qr-code-outline';
          } else if (route.name === 'Receipts') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Receipts" component={ReceiptsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Root Navigator with Auth Check
const RootNavigator = () => {
  const { state } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {state.isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="SaleDetails" component={SaleDetailsScreen} options={{ headerShown: true, title: 'Sale Details' }} />
          <Stack.Screen name="EditSale" component={EditSaleScreen} options={{ headerShown: true, title: 'Edit Sale' }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: true, title: 'Payment' }} />
          <Stack.Screen name="Receipt" component={ReceiptScreen} options={{ headerShown: true, title: 'Receipt' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
