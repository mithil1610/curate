import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import * as Clipboard from 'expo-clipboard';

export default function CheckoutScreen({ navigation }: any) {
  const { items, totalPrice, clearCart, restaurantId, restaurantUrl, removeFromCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const tax = totalPrice * 0.08;
  const deliveryFee = 4.99;
  const finalTotal = totalPrice + tax + deliveryFee;

  // Generate the AI-like order summary snippet
  const orderSummarySnippet = "Awesome! I've prepared your order:\n" + items.map(item => {
    let line = `- ${item.quantity}x ${item.name}`;
    const mods: string[] = [];
    if (item.customization) {
      item.customization.removable_ingredients.forEach(i => mods.push(`No ${i}`));
      item.customization.protein_add_ons.forEach(i => mods.push(`Add ${i}`));
    }
    if (mods.length > 0) {
      line += ` (${mods.join(', ')})`;
    }
    return line;
  }).join('\n');

  const handleCopy = async () => {
    await Clipboard.setStringAsync(orderSummarySnippet);
    Alert.alert("Copied!", "Order details copied to clipboard.");
  };

  const handleDeepLink = async () => {
    if (restaurantUrl) {
      const supported = await Linking.canOpenURL(restaurantUrl);
      if (supported) {
        await Linking.openURL(restaurantUrl);
      } else {
        Alert.alert("Error", "Cannot open the ordering link.");
      }
    } else {
      Alert.alert("Error", "No ordering link available for this restaurant.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Your Order</Text>
        {items.map(item => (
          <View key={item.item_id} style={styles.itemContainer}>
            <View style={styles.itemRow}>
              <Text style={styles.itemQuantity}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item.item_id)} style={styles.removeBtn}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Subtotal</Text>
          <Text style={styles.summaryText}>${totalPrice.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Tax & Fees</Text>
          <Text style={styles.summaryText}>${tax.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Delivery</Text>
          <Text style={styles.summaryText}>${deliveryFee.toFixed(2)}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalText}>${finalTotal.toFixed(2)}</Text>
        </View>

        <View style={styles.snippetContainer}>
          <Text style={styles.snippetTitle}>Curate Summary</Text>
          <Text style={styles.snippetText}>{orderSummarySnippet}</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <Ionicons name="copy-outline" size={16} color="#065f46" />
            <Text style={styles.copyBtnText}>Copy to Clipboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.deepLinkBtn} 
          onPress={handleDeepLink}
        >
          <Text style={styles.deepLinkText}>Order via Restaurant Website</Text>
          <Ionicons name="open-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  itemRow: { flexDirection: 'row', marginBottom: 12 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  removeBtn: { padding: 8 },
  itemQuantity: { width: 30, fontWeight: '600', color: '#666' },
  itemName: { flex: 1, fontSize: 16 },
  itemPrice: { fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryText: { fontSize: 15, color: '#666' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  totalText: { fontSize: 20, fontWeight: '800' },
  snippetContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  snippetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8
  },
  snippetText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8
  },
  copyBtnText: {
    color: '#065f46',
    fontWeight: '700',
    fontSize: 14
  },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  deepLinkBtn: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  deepLinkText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
