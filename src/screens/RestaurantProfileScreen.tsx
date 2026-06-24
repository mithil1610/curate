import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getOrFetchMenu, ProcessedMenu } from '../services/menuService';

export default function RestaurantProfileScreen({ route, navigation }: any) {
  const { id, name, rating, tags, imageUrl } = route.params;

  const [aiMenu, setAiMenu] = useState<ProcessedMenu | null>(null);
  const [loadingAi, setLoadingAi] = useState(true);

  useEffect(() => {
    (async () => {
      const menu = await getOrFetchMenu(id, name, tags);
      setAiMenu(menu);
      setLoadingAi(false);
    })();
  }, [id, name, tags]);

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={18} color="#FFD700" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          </View>
          
          <View style={styles.tagsContainer}>
            {tags.map((tag: string, index: number) => (
              <View key={index} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* AI Menu Section */}
          <View style={styles.chatSection}>
            <View style={styles.chatHeader}>
              <Ionicons name="sparkles" size={22} color="#1a1a1a" />
              <Text style={styles.chatTitle}>AI Menu Concierge</Text>
            </View>
            
            {loadingAi ? (
               <View style={styles.aiLoading}>
                 <ActivityIndicator size="small" color="#1a1a1a" />
                 <Text style={styles.aiLoadingText}>Curating menu insights...</Text>
               </View>
            ) : aiMenu ? (
              <View>
                <Text style={styles.aiSummary}>{aiMenu.summary}</Text>
                
                {aiMenu.categories.Vegan.length > 0 && (
                  <View style={styles.categoryBlock}>
                    <Text style={styles.categoryTitle}>🌱 Vegan</Text>
                    {aiMenu.categories.Vegan.map((item, i) => <Text key={i} style={styles.categoryItem}>• {item}</Text>)}
                  </View>
                )}

                {aiMenu.categories.Vegetarian.length > 0 && (
                  <View style={styles.categoryBlock}>
                    <Text style={styles.categoryTitle}>🧀 Vegetarian</Text>
                    {aiMenu.categories.Vegetarian.map((item, i) => <Text key={i} style={styles.categoryItem}>• {item}</Text>)}
                  </View>
                )}

                {aiMenu.categories.Meat.length > 0 && (
                  <View style={styles.categoryBlock}>
                    <Text style={styles.categoryTitle}>🥩 Meat</Text>
                    {aiMenu.categories.Meat.map((item, i) => <Text key={i} style={styles.categoryItem}>• {item}</Text>)}
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.chatSubtitle}>
                AI Menu could not be loaded at this time.
              </Text>
            )}
          </View>
          
          {/* Spacer to allow scrolling past the fixed Order Now button */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Fixed Order Now Button */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <TouchableOpacity style={styles.orderButton}>
          <Text style={styles.orderButtonText}>Order Now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  heroContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  content: {
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  name: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginRight: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tagBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
  },
  chatSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  chatSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  aiSummary: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 16,
    fontStyle: 'italic'
  },
  categoryBlock: {
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  categoryItem: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  aiLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  aiLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  }
});
