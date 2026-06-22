import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

// Import landing pages
import { LandingHomeScreen } from '../screens/Landing/LandingHomeScreen';
import { LandingFeaturesScreen } from '../screens/Landing/LandingFeaturesScreen';
import { LandingPricingScreen } from '../screens/Landing/LandingPricingScreen';
import { LandingAboutScreen } from '../screens/Landing/LandingAboutScreen';
import { LandingContactScreen } from '../screens/Landing/LandingContactScreen';

// Import auth screens
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { AgencyRegistrationScreen } from '../screens/Auth/AgencyRegistrationScreen';

// Import all main screens
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { CustomersScreen } from '../screens/Customers/CustomersScreen';
import { CustomerDetailScreen } from '../screens/Customers/CustomerDetailScreen';
import { CustomerFormScreen } from '../screens/Customers/CustomerFormScreen';
import { UsersScreen } from '../screens/Users/UsersScreen';
import { UserFormScreen } from '../screens/Users/UserFormScreen';
import { InventoryScreen } from '../screens/Inventory/InventoryScreen';
import { ItemFormScreen } from '../screens/Inventory/ItemFormScreen';
import { InvoicesScreen } from '../screens/Invoices/InvoicesScreen';
import { InvoiceFormScreen } from '../screens/Invoices/InvoiceFormScreen';
import { VendorsScreen } from '../screens/Vendors/VendorsScreen';
import { VendorFormScreen } from '../screens/Vendors/VendorFormScreen';
import { PurchasesScreen } from '../screens/Purchases/PurchasesScreen';
import { PurchaseFormScreen } from '../screens/Purchases/PurchaseFormScreen';
import { PaymentsScreen } from '../screens/Payments/PaymentsScreen';
import { PaymentFormScreen } from '../screens/Payments/PaymentFormScreen';
import { ExpensesScreen } from '../screens/Expenses/ExpensesScreen';
import { ExpenseFormScreen } from '../screens/Expenses/ExpenseFormScreen';
import { ReportsScreen } from '../screens/Reports/ReportsScreen';
import { ReportDetailScreen } from '../screens/Reports/ReportDetailScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { PlanUpgradeScreen } from '../screens/Settings/PlanUpgradeScreen';
import { SubscriptionManagementScreen } from '../screens/Settings/SubscriptionManagementScreen';
import { PaymentHistoryScreen } from '../screens/Settings/PaymentHistoryScreen';
import { GatePassScreen } from '../screens/Inventory/GatePassScreen';
import { GatePassFormScreen } from '../screens/Inventory/GatePassFormScreen';
import { QuotationScreen } from '../screens/Invoices/QuotationScreen';
import { QuotationFormScreen } from '../screens/Invoices/QuotationFormScreen';
import { DeliveryChallanScreen } from '../screens/Invoices/DeliveryChallanScreen';
import { DeliveryChallanFormScreen } from '../screens/Invoices/DeliveryChallanFormScreen';
import { SupplierScreen } from '../screens/Vendors/SupplierScreen';
import { APITestScreen } from '../screens/Test/APITestScreen';
import { PurchaseOrdersScreen } from '../screens/PurchaseOrders/PurchaseOrdersScreen';
import { PurchaseOrderFormScreen } from '../screens/PurchaseOrders/PurchaseOrderFormScreen';
import { ProductionOrdersScreen } from '../screens/Production/ProductionOrdersScreen';
import { ProductionOrderFormScreen } from '../screens/Production/ProductionOrderFormScreen';
import { BillOfMaterialsScreen } from '../screens/BillOfMaterials/BillOfMaterialsScreen';
import { BOMFormScreen } from '../screens/BillOfMaterials/BOMFormScreen';
import { RecurringInvoicesScreen } from '../screens/Recurring/RecurringInvoicesScreen';
import { RecurringInvoiceFormScreen } from '../screens/Recurring/RecurringInvoiceFormScreen';
import { TimeTrackingScreen } from '../screens/TimeTracking/TimeTrackingScreen';
import { TimeEntryFormScreen } from '../screens/TimeTracking/TimeEntryFormScreen';
import { ProjectsScreen } from '../screens/Projects/ProjectsScreen';
import { ProjectFormScreen } from '../screens/Projects/ProjectFormScreen';
import { TripSheetsScreen } from '../screens/TripSheets/TripSheetsScreen';
import { TripSheetFormScreen } from '../screens/TripSheets/TripSheetFormScreen';
import { FleetScreen } from '../screens/Fleet/FleetScreen';
import { VehicleFormScreen } from '../screens/Fleet/VehicleFormScreen';
import { BatchTrackingScreen } from '../screens/BatchTracking/BatchTrackingScreen';
import { BatchFormScreen } from '../screens/BatchTracking/BatchFormScreen';
import { CustomsScreen } from '../screens/Customs/CustomsScreen';
import { CustomsFormScreen } from '../screens/Customs/CustomsFormScreen';
import { POSScreen } from '../screens/POS/POSScreen';
import { POSFormScreen } from '../screens/POS/POSFormScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const authState = useSelector((state: RootState) => state.auth);
  const isAuthenticated = authState.isAuthenticated;

  console.log('=== APP NAVIGATOR RENDER ===');
  console.log('Full auth state:', {
    isAuthenticated: authState.isAuthenticated,
    isInitialized: authState.isInitialized,
    isLoading: authState.isLoading,
    hasUser: !!authState.user,
    hasToken: !!authState.token,
    userId: authState.user?.id,
    userName: authState.user?.name,
    userRole: authState.user?.role
  });
  console.log('Rendering:', isAuthenticated ? 'MAIN APP STACK' : 'LANDING PAGES');

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? 'Dashboard' : 'LandingHome'}
      screenOptions={{
        headerShown: false, // We'll use our own TopBar in MainLayout
      }}
    >
      {!isAuthenticated ? (
        // Auth Stack - Landing Pages
        <>
          <Stack.Screen name="LandingHome" component={LandingHomeScreen} />
          <Stack.Screen name="LandingFeatures" component={LandingFeaturesScreen} />
          <Stack.Screen name="LandingPricing" component={LandingPricingScreen} />
          <Stack.Screen name="LandingAbout" component={LandingAboutScreen} />
          <Stack.Screen name="LandingContact" component={LandingContactScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="AgencyRegistration" component={AgencyRegistrationScreen} />
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Customers" component={CustomersScreen} />
          <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
          <Stack.Screen name="CustomerForm" component={CustomerFormScreen} />
          <Stack.Screen name="Users" component={UsersScreen} />
          <Stack.Screen name="UserForm" component={UserFormScreen} />
          <Stack.Screen name="Inventory" component={InventoryScreen} />
          <Stack.Screen name="ItemForm" component={ItemFormScreen} />
          <Stack.Screen name="Invoices" component={InvoicesScreen} />
          <Stack.Screen name="InvoiceForm" component={InvoiceFormScreen} />
          <Stack.Screen name="Vendors" component={VendorsScreen} />
          <Stack.Screen name="VendorForm" component={VendorFormScreen} />
          <Stack.Screen name="Purchases" component={PurchasesScreen} />
          <Stack.Screen name="PurchaseForm" component={PurchaseFormScreen} />
          <Stack.Screen name="Payments" component={PaymentsScreen} />
          <Stack.Screen name="PaymentForm" component={PaymentFormScreen} />
          <Stack.Screen name="Expenses" component={ExpensesScreen} />
          <Stack.Screen name="ExpenseForm" component={ExpenseFormScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="SubscriptionManagement" component={SubscriptionManagementScreen} />
          <Stack.Screen name="PlanUpgrade" component={PlanUpgradeScreen} />
          <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
          <Stack.Screen name="GatePass" component={GatePassScreen} />
          <Stack.Screen name="GatePassForm" component={GatePassFormScreen} />
          <Stack.Screen name="Quotation" component={QuotationScreen} />
          <Stack.Screen name="QuotationForm" component={QuotationFormScreen} />
          <Stack.Screen name="DeliveryChallan" component={DeliveryChallanScreen} />
          <Stack.Screen name="DeliveryChallanForm" component={DeliveryChallanFormScreen} />
          <Stack.Screen name="Supplier" component={SupplierScreen} />
          <Stack.Screen name="APITest" component={APITestScreen} />
          <Stack.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} />
          <Stack.Screen name="PurchaseOrderForm" component={PurchaseOrderFormScreen} />
          <Stack.Screen name="ProductionOrders" component={ProductionOrdersScreen} />
          <Stack.Screen name="ProductionOrderForm" component={ProductionOrderFormScreen} />
          <Stack.Screen name="BillOfMaterials" component={BillOfMaterialsScreen} />
          <Stack.Screen name="BOMForm" component={BOMFormScreen} />
          <Stack.Screen name="RecurringInvoices" component={RecurringInvoicesScreen} />
          <Stack.Screen name="RecurringInvoiceForm" component={RecurringInvoiceFormScreen} />
          <Stack.Screen name="TimeTracking" component={TimeTrackingScreen} />
          <Stack.Screen name="TimeEntryForm" component={TimeEntryFormScreen} />
          <Stack.Screen name="Projects" component={ProjectsScreen} />
          <Stack.Screen name="ProjectForm" component={ProjectFormScreen} />
          <Stack.Screen name="TripSheets" component={TripSheetsScreen} />
          <Stack.Screen name="TripSheetForm" component={TripSheetFormScreen} />
          <Stack.Screen name="Fleet" component={FleetScreen} />
          <Stack.Screen name="VehicleForm" component={VehicleFormScreen} />
          <Stack.Screen name="BatchTracking" component={BatchTrackingScreen} />
          <Stack.Screen name="BatchForm" component={BatchFormScreen} />
          <Stack.Screen name="Customs" component={CustomsScreen} />
          <Stack.Screen name="CustomsForm" component={CustomsFormScreen} />
          <Stack.Screen name="POS" component={POSScreen} />
          <Stack.Screen name="POSForm" component={POSFormScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};