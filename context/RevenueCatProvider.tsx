import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, { LOG_LEVEL, CustomerInfo } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { useAuth } from './AuthContext';

const API_KEYS = {
  apple: 'appl_tLcplPpzbomgZuygniFoOxYBypH',
  // apple: 'test_LdxViVUoBIJXgLAcQuvxlSdawBe',
  google: 'test_LdxViVUoBIJXgLAcQuvxlSdawBe',
};

const ENTITLEMENT_ID = 'Little Virtues Pro';

type RevenueCatContextType = {
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  presentPaywall: () => Promise<void>;
  presentCustomerCenter: () => Promise<void>;
};

const RevenueCatContext = createContext<RevenueCatContextType>({
  isPro: false,
  customerInfo: null,
  presentPaywall: async () => { },
  presentCustomerCenter: async () => { },
});

export const useRevenueCat = () => useContext(RevenueCatContext);

export const RevenueCatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: API_KEYS.apple });
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: API_KEYS.google }); // Safe fallback
    }

    const customerInfoUpdateListener = (info: CustomerInfo) => {
      setCustomerInfo(info);
      if (info.entitlements.active[ENTITLEMENT_ID] !== undefined) {
        setIsPro(true);
      } else {
        setIsPro(false);
      }
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoUpdateListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoUpdateListener);
    };
  }, []);

  useEffect(() => {
    const handleUserSync = async () => {
      try {
        if (user?.uid) {
          const { customerInfo } = await Purchases.logIn(user.uid);
          setCustomerInfo(customerInfo);
          setIsPro(customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined);
        } else {
          // If no user, maybe ensure we logout or stay anonymous
          // If the app relies heavily on AuthContext for state, we can logOut
          // if there is a previously cached user.
          if (!await Purchases.isAnonymous()) {
            const newCustomerInfo = await Purchases.logOut();
            setCustomerInfo(newCustomerInfo);
            setIsPro(false);
          }
        }
      } catch (e) {
        console.error("RevenueCat sync error", e);
      }
    };
    handleUserSync();
  }, [user]);

  const presentPaywall = async () => {
    if (isPro) return;

    try {
      // The presentPaywallIfNeeded will cleverly display only if the entitlement is missing.
      const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
      });

      console.log('Paywall result:', paywallResult);
      // No need to manually update state here, the addCustomerInfoUpdateListener 
      // will capture the newly assigned entitlement and flip isPro to true automatically.
    } catch (e) {
      console.error("Error presenting paywall", e);
      Alert.alert("Error", "Could not load the paywall. Please check your connection.");
    }
  };

  const presentCustomerCenter = async () => {
    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch (e) {
      console.error("Error presenting customer center", e);
      Alert.alert("Error", "RevenueCat Customer Center could not be presented.");
    }
  };

  return (
    <RevenueCatContext.Provider value={{ isPro, customerInfo, presentPaywall, presentCustomerCenter }}>
      {children}
    </RevenueCatContext.Provider>
  );
};
