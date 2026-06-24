import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroup } from '../context/GroupContext';

export default function GroupSyncScreen() {
  const { isGroupModeActive, combinedProfile, activateGroupMode, deactivateGroupMode } = useGroup();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid friend\'s email to sync with.');
      return;
    }
    
    setLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    await activateGroupMode(email);
    setLoading(false);
  };

  const handleDisconnect = () => {
    deactivateGroupMode();
    setEmail('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Group Sync</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="people-circle" size={80} color={isGroupModeActive ? '#10b981' : '#1a1a1a'} />
        </View>
        
        <Text style={styles.title}>
          {isGroupModeActive ? 'Group Mode Active' : 'Pair with a Friend'}
        </Text>
        
        <Text style={styles.description}>
          {isGroupModeActive 
            ? 'We have securely synced your dietary preferences. Curate will now only recommend restaurants and dishes that satisfy BOTH of you perfectly.'
            : 'Enter a friend\'s email to sync your Taste & Allergy Profiles. We\'ll automatically filter out restaurants that don\'t accommodate both of you.'}
        </Text>

        {!isGroupModeActive ? (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="friend@example.com"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity 
              style={styles.syncBtn} 
              onPress={handleSync}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.syncBtnText}>Sync Profiles</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activeContainer}>
            <View style={styles.profileCard}>
              <Text style={styles.cardTitle}>Combined Restrictions</Text>
              <Text style={styles.cardText}>
                <Text style={{fontWeight: '700'}}>Allergies:</Text> {combinedProfile?.allergies.length ? combinedProfile.allergies.join(', ') : 'None'}
              </Text>
              <Text style={styles.cardText}>
                <Text style={{fontWeight: '700'}}>Baseline:</Text> {combinedProfile?.dietaryBaseline || 'None'}
              </Text>
            </View>

            <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
              <Text style={styles.disconnectBtnText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 24, paddingTop: 32, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  content: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  iconContainer: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 16, textAlign: 'center' },
  description: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  formContainer: { width: '100%' },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  syncBtn: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  syncBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  activeContainer: { width: '100%', alignItems: 'center' },
  profileCard: {
    width: '100%',
    backgroundColor: '#f0fdf4', // light green tint
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 32
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#166534', marginBottom: 12 },
  cardText: { fontSize: 15, color: '#15803d', marginBottom: 8 },
  disconnectBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%'
  },
  disconnectBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '700' }
});
