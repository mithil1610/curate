import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView, Modal, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import RestaurantCard from '../components/RestaurantCard';
import { fetchNearbyRestaurants, Place } from '../services/placesApi';
import { getUserPreferences } from '../services/userService';
import { sortRestaurantsByRelevance } from '../utils/sorting';

const PILL_OPTIONS = ['All', 'Vegetarian Options', 'Vegan Options'];

export default function HomeScreen({ navigation }: any) {
  const [restaurants, setRestaurants] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activePill, setActivePill] = useState('All');
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [strictVeg, setStrictVeg] = useState(false);
  const [strictVegan, setStrictVegan] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      
      // Fetch data and preferences in parallel
      const [places, prefs] = await Promise.all([
        fetchNearbyRestaurants(location.coords.latitude, location.coords.longitude),
        getUserPreferences()
      ]);

      const sorted = sortRestaurantsByRelevance(places, prefs);
      setRestaurants(sorted);
      setLoading(false);
    })();
  }, []);

  const getFilteredRestaurants = () => {
    return restaurants.filter(r => {
      const lowerTags = r.tags.map(t => t.toLowerCase());
      if (strictVegan && !lowerTags.includes('vegan')) return false;
      if (strictVeg && !lowerTags.includes('vegetarian') && !lowerTags.includes('vegan')) return false;
      
      if (activePill === 'Vegan Options' && !lowerTags.includes('vegan options') && !lowerTags.includes('vegan')) return false;
      if (activePill === 'Vegetarian Options' && !lowerTags.includes('vegetarian options') && !lowerTags.includes('vegetarian')) return false;
      
      return true;
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants, cuisines..."
            placeholderTextColor="#888"
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
          <Ionicons name="options-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Pill Toggles */}
      <View style={styles.pillContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScrollContent}>
          {PILL_OPTIONS.map((option) => {
            const isActive = activePill === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => setActivePill(option)}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a1a1a" />
          <Text style={styles.loadingText}>Curating nearby restaurants...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredRestaurants()}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feed}
          renderItem={({ item }) => (
            <RestaurantCard
              name={item.name}
              rating={item.rating}
              tags={item.tags}
              imageUrl={item.imageUrl}
              onPress={() => {
                // Background logging
                const { logRestaurantClick } = require('../services/userService');
                logRestaurantClick(item.tags);
                
                navigation.navigate('RestaurantProfile', item);
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={isFilterVisible} animationType="slide" transparent={true} onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dietary Filters</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>100% Vegetarian Only</Text>
              <Switch value={strictVeg} onValueChange={setStrictVeg} trackColor={{ false: '#e0e0e0', true: '#4ade80' }} />
            </View>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>100% Vegan Only</Text>
              <Switch value={strictVegan} onValueChange={setStrictVegan} trackColor={{ false: '#e0e0e0', true: '#4ade80' }} />
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={() => setFilterVisible(false)}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filterButton: {
    marginLeft: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pillContainer: {
    marginBottom: 16,
  },
  pillScrollContent: {
    paddingHorizontal: 20,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  pillActive: {
    backgroundColor: '#1a1a1a',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  pillTextActive: {
    color: '#fff',
  },
  feed: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
