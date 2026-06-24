import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getOrFetchMenu, ProcessedMenu, MenuItem } from '../services/menuService';
import { useCart } from '../context/CartContext';
import { useGroup } from '../context/GroupContext';

export default function RestaurantProfileScreen({ route, navigation }: any) {
  const { id, name, rating, tags, imageUrl, orderingUrl } = route.params;

  const [aiMenu, setAiMenu] = useState<ProcessedMenu | null>(null);
  const [loadingAi, setLoadingAi] = useState(true);
  const { items, addToCart, totalPrice } = useCart();
  const { isGroupModeActive } = useGroup();

  useEffect(() => {
    (async () => {
      const menu = await getOrFetchMenu(id, name, tags);
      setAiMenu(menu);
      setLoadingAi(false);
    })();
  }, [id]);

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      item_id: item.item_id,
      name: item.name,
      price: item.price,
      quantity: 1,
      restaurantId: id,
      restaurantUrl: orderingUrl,
      customization: item.customization,
    });
  };

  const renderMenuItem = (item: MenuItem, i: number) => (
    <View key={item.item_id || i} style={styles.menuItemRow}>
      <View style={{ flex: 1, paddingRight: 16 }}>
        <Text style={styles.menuItemName}>{item.name} - ${item.price.toFixed(2)}</Text>
        <Text style={styles.menuItemDescription}>{item.description}</Text>
        <View style={styles.badgeContainer}>
          {item.dietary_flags.is_vegan && <Text style={styles.badge}>Vegan</Text>}
          {item.dietary_flags.is_vegetarian && <Text style={styles.badge}>Veg</Text>}
          {item.dietary_flags.is_gluten_free && <Text style={styles.badge}>GF</Text>}
          {item.known_allergens.length > 0 && <Text style={styles.allergenBadge}>Contains: {item.known_allergens.join(', ')}</Text>}
        </View>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
        <Ionicons name="add" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

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
            
            {isGroupModeActive && (
              <View style={styles.groupBannerInline}>
                <Ionicons name="people" size={14} color="#065f46" />
                <Text style={styles.groupBannerTextInline}>Group Sync Active</Text>
              </View>
            )}
            
            {loadingAi ? (
               <View style={styles.aiLoading}>
                 <ActivityIndicator size="small" color="#1a1a1a" />
                 <Text style={styles.aiLoadingText}>Curating menu insights...</Text>
               </View>
            ) : aiMenu ? (
              <View>
                <Text style={styles.aiSummary}>{aiMenu.ai_cuisine_summary}</Text>
                
                <View style={styles.dietaryScores}>
                  <Text style={styles.scoreText}>🌱 Vegan: {aiMenu.overall_dietary_rating?.vegan_friendly_score}/10</Text>
                  <Text style={styles.scoreText}>🧀 Veg: {aiMenu.overall_dietary_rating?.vegetarian_friendly_score}/10</Text>
                  <Text style={styles.scoreText}>🌾 GF: {aiMenu.overall_dietary_rating?.gluten_free_friendly_score}/10</Text>
                </View>

                {aiMenu.menu_categories?.map((category, idx) => (
                  <View key={idx} style={styles.categoryBlock}>
                    <Text style={styles.categoryTitle}>{category.category_name}</Text>
                    {category.items.map(renderMenuItem)}
                  </View>
                ))}

                <TouchableOpacity 
                  style={styles.chatButton}
                  onPress={() => navigation.navigate('MenuChat', { menu: aiMenu, restaurantName: name, restaurantId: id, orderingUrl })}
                >
                  <Text style={styles.chatButtonText}>Ask Curate</Text>
                  <Ionicons name="chatbubbles" size={16} color="#1a1a1a" />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.chatSubtitle}>
                AI Menu could not be loaded at this time.
              </Text>
            )}
          </View>
          
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Floating Cart Button */}
      {items.length > 0 && (
        <SafeAreaView edges={['bottom']} style={styles.floatingCartContainer}>
          <TouchableOpacity 
            style={styles.floatingCartBtn}
            onPress={() => navigation.navigate('Checkout')}
          >
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>{items.reduce((s, i) => s + i.quantity, 0)}</Text>
            </View>
            <Text style={styles.floatingCartText}>View Cart</Text>
            <Text style={styles.floatingCartPrice}>${totalPrice.toFixed(2)}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}
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
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  groupBannerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start'
  },
  groupBannerTextInline: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
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
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  allergenBadge: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  dietaryScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  addButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCartContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  floatingCartBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  cartCountBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cartCountText: {
    color: '#1a1a1a',
    fontWeight: '800',
    fontSize: 14,
  },
  floatingCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  floatingCartPrice: {
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
