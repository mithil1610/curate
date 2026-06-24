import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Linking, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, chatWithMenuConcierge } from '../services/menuService';
import { useCart } from '../context/CartContext';
import { useGroup } from '../context/GroupContext';

export default function MenuChatScreen({ route, navigation }: any) {
  const { menu, restaurantName, restaurantId, orderingUrl } = route.params;
  const { items: cartItems, addToCart } = useCart();
  const { isGroupModeActive, combinedProfile } = useGroup();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: isGroupModeActive 
        ? `Welcome to ${restaurantName}! I'm Curate, your personal AI concierge. I see you're dining as a group. I've reviewed the menu and your combined preferences—what are you both in the mood for today?`
        : `Welcome to ${restaurantName}! I'm Curate, your personal AI concierge. I've reviewed the menu—what are you in the mood for today?`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setInputText('');

    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsTyping(true);

    // Call AI
    const reply = await chatWithMenuConcierge(
      restaurantName, 
      menu, 
      messages, 
      userText,
      isGroupModeActive ? combinedProfile : null
    );
    
    if (reply.startsWith('__TOOL_CALL__:addToCart:')) {
      const parts = reply.split(':');
      const itemName = parts[2];
      const quantity = parseInt(parts[3] || '1', 10);
      
      // Look up price from menu or default
      addToCart({
        item_id: Math.random().toString(),
        name: itemName,
        price: 15.00, // Mock default
        quantity: quantity,
        restaurantId: restaurantId,
        restaurantUrl: orderingUrl,
      });

      const successMsg = `I've added ${quantity}x ${itemName} to your cart!`;
      setMessages([...newMessages, { role: 'model', text: successMsg, isOrderCard: true }]);
    } else {
      setMessages([...newMessages, { role: 'model', text: reply }]);
    }
    
    setIsTyping(false);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    
    if (item.isOrderCard) {
      const itemsString = cartItems.map((cartItem) => {
        let text = cartItem.quantity > 1 ? `${cartItem.quantity}x ${cartItem.name}` : cartItem.name;
        const mods: string[] = [];
        if (cartItem.customization) {
          cartItem.customization.removable_ingredients.forEach(i => mods.push(`No ${i}`));
          cartItem.customization.protein_add_ons.forEach(i => mods.push(`Add ${i}`));
        }
        if (mods.length > 0) {
          text += ` (${mods.join(', ')})`;
        }
        return text;
      });

      let formattedItems = "";
      if (itemsString.length === 1) {
        formattedItems = itemsString[0];
      } else if (itemsString.length === 2) {
        formattedItems = `${itemsString[0]} and ${itemsString[1]}`;
      } else if (itemsString.length > 2) {
        formattedItems = itemsString.slice(0, -1).join(', ') + ` and ${itemsString[itemsString.length - 1]}`;
      }

      const orderSummarySnippet = `Awesome! I've prepared your order: ${formattedItems}.`;

      const handleCopy = async () => {
        await Clipboard.setStringAsync(orderSummarySnippet);
        showToast("Order copied to clipboard!");
      };

      const handleDeepLink = async () => {
        if (orderingUrl) {
          const supported = await Linking.canOpenURL(orderingUrl);
          if (supported) {
            await Linking.openURL(orderingUrl);
          } else {
            Alert.alert("Error", "Cannot open the ordering link.");
          }
        } else {
          Alert.alert("Error", "No ordering link available for this restaurant.");
        }
      };

      return (
        <View style={styles.orderCardContainer}>
          <Text style={styles.orderCardTitle}>Review My Order</Text>
          {cartItems.map((cartItem, idx) => (
             <View key={cartItem.item_id || idx} style={styles.orderCardItem}>
               <Text style={styles.orderCardItemText}>{cartItem.quantity}x {cartItem.name}</Text>
               <Text style={styles.orderCardItemPrice}>${(cartItem.price * cartItem.quantity).toFixed(2)}</Text>
             </View>
          ))}
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <Ionicons name="copy-outline" size={16} color="#065f46" />
            <Text style={styles.copyBtnText}>Copy Order Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deepLinkBtn} onPress={handleDeepLink}>
            <Text style={styles.deepLinkText}>Go to Restaurant Menu</Text>
            <Ionicons name="open-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAI]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Ask Curate</Text>
          <Text style={styles.headerSubtitle}>{restaurantName}</Text>
        </View>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isTyping && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#1a1a1a" />
            <Text style={styles.typingText}>Curate is typing...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about vegan options, wine..."
            placeholderTextColor="#888"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  chatList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAI: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#1a1a1a',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#1a1a1a',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    fontSize: 15,
    maxHeight: 100,
    color: '#1a1a1a',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  orderCardContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    marginHorizontal: 16,
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  orderCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  orderCardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  orderCardItemText: {
    fontSize: 15,
    color: '#334155',
    flex: 1,
  },
  orderCardItemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 12,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  copyBtnText: {
    color: '#065f46',
    fontWeight: '700',
    fontSize: 14,
  },
  deepLinkBtn: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  deepLinkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
