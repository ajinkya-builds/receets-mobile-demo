import { NavigatorScreenParams } from '@react-navigation/native';

// Define the types for the main tab navigator
export type MainTabParamList = {
  Home: undefined;
  Scan: undefined;
  Receipts: undefined;
  Profile: undefined;
};

// Define the types for the root stack navigator
export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
  // Main tab navigator
  Main: NavigatorScreenParams<MainTabParamList>;
  
  // Transaction screens
  SaleDetails: { saleId: string };
  EditSale: { saleId: string };
  Payment: { saleId: string };
  Receipt: { saleId: string };
};
