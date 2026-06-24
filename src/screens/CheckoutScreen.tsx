import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { submitOrderToToast } from '../services/toastApiService';

export default function CheckoutScreen({ navigation }: any) {
  const { items, totalPrice, clearCart, restaurantId } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const tax = totalPrice * 0.08;
  const deliveryFee = 4.99;
  const finalTotal = totalPrice + tax + deliveryFee;

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      const response = await submitOrderToToast(restaurantId || '', items);
      if (response.success) {
        clearCart();
        navigation.replace('OrderConfirmation', { 
          orderId: response.orderId, 
          prepTime: response.estimatedPrepTime 
        });
      }
    } catch (e) {
      alert("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
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
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemQuantity}>{item.quantity}x</Text>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
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
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.placeOrderBtn} 
          onPress={handlePlaceOrder}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
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
  itemQuantity: { width: 30, fontWeight: '600', color: '#666' },
  itemName: { flex: 1, fontSize: 16 },
  itemPrice: { fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryText: { fontSize: 15, color: '#666' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  totalText: { fontSize: 20, fontWeight: '800' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  placeOrderBtn: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  placeOrderText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
