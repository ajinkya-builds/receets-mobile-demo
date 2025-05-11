import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, ActivityIndicator } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import axios from 'axios';
import { API_URL } from '../../api/config';
import { useAuth } from '../../context/AuthContext';

type ScanScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Scan'>;

interface QRCodeData {
  merchantId: string;
  locationId: string;
  type: 'purchase' | 'return';
  code: string;
}

const ScanScreen = () => {
  const navigation = useNavigation<ScanScreenNavigationProp>();
  const { state } = useAuth();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [merchantInfo, setMerchantInfo] = useState<{
    merchantId: string;
    merchantName: string;
    locationId: string;
    locationName: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    try {
      setScanned(true);
      setIsProcessing(true);
      
      // Parse QR code data
      let qrData: QRCodeData;
      try {
        qrData = JSON.parse(data);
      } catch (error) {
        Alert.alert('Invalid QR Code', 'This QR code is not valid for Receets.');
        setIsProcessing(false);
        return;
      }
      
      // Validate QR code with server
      const response = await axios.post(`${API_URL}/qrcodes/validate`, {
        code: qrData.code
      });
      
      if (response.data.success) {
        setMerchantInfo({
          merchantId: response.data.merchantId,
          merchantName: response.data.merchantName,
          locationId: response.data.locationId,
          locationName: response.data.locationName
        });
        
        // If QR code type is 'return', navigate to returns flow
        if (qrData.type === 'return') {
          // Navigate to returns screen or flow
          Alert.alert(
            'Return Process',
            `You're initiating a return at ${response.data.merchantName}. Would you like to continue?`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  setScanned(false);
                  setIsProcessing(false);
                  setMerchantInfo(null);
                }
              },
              {
                text: 'Continue',
                onPress: () => {
                  // In a real app, this would navigate to a returns screen
                  // For now, we'll just reset the scanner
                  setScanned(false);
                  setIsProcessing(false);
                  setMerchantInfo(null);
                  
                  // This would be replaced with actual navigation
                  Alert.alert('Return Process', 'Return process initiated. This feature is coming soon.');
                }
              }
            ]
          );
        } else {
          // Default to purchase flow
          Alert.alert(
            'Purchase Process',
            `You're initiating a purchase at ${response.data.merchantName}. Would you like to continue?`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  setScanned(false);
                  setIsProcessing(false);
                  setMerchantInfo(null);
                }
              },
              {
                text: 'Continue',
                onPress: () => {
                  // In a real app, this would wait for POS to initiate a sale
                  // For now, we'll just reset the scanner
                  setScanned(false);
                  setIsProcessing(false);
                  setMerchantInfo(null);
                  
                  // This would be replaced with actual navigation
                  Alert.alert('Purchase Process', 'Purchase process initiated. This feature is coming soon.');
                }
              }
            ]
          );
        }
      } else {
        Alert.alert('Invalid QR Code', 'This QR code is not recognized by Receets.');
        setScanned(false);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert('Error', 'Failed to process QR code. Please try again.');
      setScanned(false);
      setIsProcessing(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setMerchantInfo(null);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
        <Button 
          mode="contained" 
          onPress={() => BarCodeScanner.requestPermissionsAsync()}
          style={styles.button}
        >
          Request Permission
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.headerContainer}>
        <Text style={styles.headerText}>Scan Merchant QR Code</Text>
        <Text style={styles.subHeaderText}>
          Scan a merchant's QR code to initiate a purchase or return
        </Text>
      </Surface>

      <View style={styles.scannerContainer}>
        {!scanned ? (
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={styles.scanner}
          />
        ) : (
          <View style={styles.processingContainer}>
            {isProcessing ? (
              <>
                <ActivityIndicator size="large" color="#4A6FFF" />
                <Text style={styles.processingText}>Processing QR code...</Text>
              </>
            ) : (
              <>
                {merchantInfo && (
                  <View style={styles.merchantInfoContainer}>
                    <Text style={styles.merchantName}>{merchantInfo.merchantName}</Text>
                    <Text style={styles.locationName}>{merchantInfo.locationName}</Text>
                  </View>
                )}
                <Button 
                  mode="contained" 
                  onPress={handleScanAgain}
                  style={styles.button}
                >
                  Scan Again
                </Button>
              </>
            )}
          </View>
        )}
      </View>

      <Surface style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          1. Ensure you're at the merchant's checkout counter
        </Text>
        <Text style={styles.instructionsText}>
          2. Position the QR code within the scanner frame
        </Text>
        <Text style={styles.instructionsText}>
          3. Hold steady until the code is recognized
        </Text>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    padding: 20,
    elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subHeaderText: {
    color: '#666',
  },
  scannerContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
    margin: 16,
    backgroundColor: '#000',
  },
  scanner: {
    flex: 1,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
  },
  merchantInfoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  merchantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  instructionsContainer: {
    padding: 20,
    elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    marginTop: 8,
  },
  instructionsText: {
    marginBottom: 8,
  },
});

export default ScanScreen;
