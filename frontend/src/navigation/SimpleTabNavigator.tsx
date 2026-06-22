import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Import screens
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { CustomersScreen } from '../screens/Customers/CustomersScreen';
import { InventoryScreen } from '../screens/Inventory/InventoryScreen';
import { InvoicesScreen } from '../screens/Invoices/InvoicesScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';

const Tab = createBottomTabNavigator();

export const SimpleTabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Customers':
              iconName = 'people';
              break;
            case 'Inventory':
              iconName = 'inventory';
              break;
            case 'Invoices':
              iconName = 'receipt';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'help';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Customers" component={CustomersScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Invoices" component={InvoicesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};