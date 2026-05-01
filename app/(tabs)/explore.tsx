import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { getPacks, getValues } from '../../services/api';

export default function ExploreScreen() {
  const [packs, setPacks] = useState<any[]>([]);
  const [values, setValues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packsRes, valuesRes] = await Promise.all([
          getPacks(),
          getValues()
        ]);

        console.log("packsres", packsRes);

        // Strapi v5 returns arrays directly under the data key
        if (packsRes?.data) setPacks(packsRes.data);
        if (valuesRes?.data) setValues(valuesRes.data);
      } catch (error) {
        console.error("Failed to fetch Strapi data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.pinkD} />
        <Text style={styles.loadingText}>Loading Library...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Library</Text>

        {/* <Text style={styles.sectionTitle}>Available Packs</Text>
        {packs.length === 0 ? (
          <Text style={styles.emptyText}>No packs found.</Text>
        ) : (
          packs.map((pack: any) => (
            <TouchableOpacity key={pack.id || pack.documentId} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{pack.title || pack.attributes?.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {pack.description || pack.attributes?.description || "No description"}
                </Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.priceTag}>
                  {(pack.isFree || pack.attributes?.isFree)
                    ? "Free"
                    : `$${pack.price || pack.attributes?.price || 0}`}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )} */}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Individual Values</Text>
        {values.length === 0 ? (
          <Text style={styles.emptyText}>No values found.</Text>
        ) : (
          values.map((val: any) => (
            <TouchableOpacity key={val.id || val.documentId} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{val.title || val.attributes?.title}</Text>
                <Text style={styles.categoryTag}>{val.category || val.attributes?.category || 'General'}</Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.priceTag}>
                  {(val.isFree || val.attributes?.isFree) ? "Free" : "Premium"}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cream,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.mid,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.brown,
    marginBottom: 12,
  },
  emptyText: {
    color: Colors.mid,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    paddingRight: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.brown,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.mid,
  },
  categoryTag: {
    fontSize: 12,
    color: Colors.lavD,
    fontWeight: '600',
  },
  cardFooter: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceTag: {
    backgroundColor: Colors.safLt,
    color: Colors.saffron,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: '800',
    fontSize: 12,
    overflow: 'hidden',
  }
});
