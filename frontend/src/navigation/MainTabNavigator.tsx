import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Import all screens
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { CustomersScreen } from '../screens/Customers/CustomersScreen';
import { CustomerDetailScreen } from '../screens/Customers/CustomerDetailScreen';
import { CustomerFormScreen } from '../screens/Customers/CustomerFormScreen';
import { InventoryScreen } from '../screens/Inventory/InventoryScreen';
import { ItemDetailScreen } from '../screens/Inventory/ItemDetailScreen';
import { ItemFormScreen } from '../screens/Inventory/ItemFormScreen';
import { InvoicesScreen } from '../screens/Invoices/InvoicesScreen';
import { InvoiceDetailScreen } from '../screens/Invoices/InvoiceDetailScreen';
import { InvoiceFormScreen } from '../screens/Invoices/InvoiceFormScreen';
import { VendorsScreen } from '../screens/Vendors/VendorsScreen';
import { VendorDetailScreen } from '../screens/Vendors/VendorDetailScreen';
import { VendorFormScreen } from '../screens/Vendors/VendorFormScreen';
import { PurchasesScreen } from '../screens/Purchases/PurchasesScreen';
import { PurchaseDetailScreen } from '../screens/Purchases/PurchaseDetailScreen';
import { PurchaseFormScreen } from '../screens/Purchases/PurchaseFormScreen';
import { PaymentsScreen } from '../screens/Payments/PaymentsScreen';
import { PaymentDetailScreen } from '../screens/Payments/PaymentDetailScreen';
import { PaymentFormScreen } from '../screens/Payments/PaymentFormScreen';
import { ExpensesScreen } from '../screens/Expenses/ExpensesScreen';
import { ExpenseDetailScreen } from '../screens/Expenses/ExpenseDetailScreen';
import { ExpenseFormScreen } from '../screens/Expenses/ExpenseFormScreen';
import { ReportsScreen } from '../screens/Reports/ReportsScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack navigators for each tab
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashboardMain" component={DashboardScreen} options={{ title: 'Dashboard' }} />
  </Stack.Navigator>
);

const CustomersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CustomersList" component={CustomersScreen} options={{ title: 'Customers' }} />
    <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} options={{ title: 'Customer Details' }} />
    <Stack.Screen name="CustomerForm" component={CustomerFormScreen} options={{ title: 'Customer Form' }} />
  </Stack.Navigator>
);

const InventoryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="InventoryList" component={InventoryScreen} options={{ title: 'Inventory' }} />
    <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Item Details' }} />
    <Stack.Screen name="ItemForm" component={ItemFormScreen} options={{ title: 'Item Form' }} />
  </Stack.Navigator>
);

const InvoicesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="InvoicesList" component={InvoicesScreen} options={{ title: 'Invoices' }} />
    <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Invoice Details' }} />
    <Stack.Screen name="InvoiceForm" component={InvoiceFormScreen} options={{ title: 'Invoice Form' }} />
  </Stack.Navigator>
);

const MoreStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MoreMain" component={MoreScreen} options={{ title: 'More' }} />
    <Stack.Screen name="Vendors" component={VendorsScreen} options={{ title: 'Vendors' }} />
    <Stack.Screen name="VendorDetail" component={VendorDetailScreen} options={{ title: 'Vendor Details' }} />
    <Stack.Screen name="VendorForm" component={VendorFormScreen} options={{ title: 'Vendor Form' }} />
    <Stack.Screen name="Purchases" component={PurchasesScreen} options={{ title: 'Purchases' }} />
    <Stack.Screen name="PurchaseDetail" component={PurchaseDetailScreen} options={{ title: 'Purchase Details' }} />
    <Stack.Screen name="PurchaseForm" component={PurchaseFormScreen} options={{ title: 'Purchase Form' }} />
    <Stack.Screen name="Payments" component={PaymentsScreen} options={{ title: 'Payments' }} />
    <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} options={{ title: 'Payment Details' }} />
    <Stack.Screen name="PaymentForm" component={PaymentFormScreen} options={{ title: 'Payment Form' }} />
    <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Expenses' }} />
    <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} options={{ title: 'Expense Details' }} />
    <Stack.Screen name="ExpenseForm" component={ExpenseFormScreen} options={{ title: 'Expense Form' }} />
    <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
  </Stack.Navigator>
);

// More screen component for additional navigation
const MoreScreen = ({ navigation }: any) => {
  const theme = useTheme();
  
  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* This will be implemented as a proper React Native component */}
    </View>
  );
};

export const MainTabNavigator: React.FC = () => {
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
            case 'More':
              iconName = 'more-horiz';
              break;
            default:
              iconName = 'help';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          height: 75,
          paddingBottom: 14,
          paddingTop: 14,
          paddingHorizontal: 0,
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(0, 0, 0, 0.06)',
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Customers" component={CustomersStack} />
      <Tab.Screen name="Inventory" component={InventoryStack} />
      <Tab.Screen name="Invoices" component={InvoicesStack} />
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
};