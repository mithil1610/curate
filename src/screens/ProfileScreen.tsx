import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Profile</Text>
      </View>
      
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.settingsRow}
          onPress={() => navigation.navigate('TasteProfile')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="restaurant" size={24} color="#1a1a1a" />
          </View>
          <View style={styles.settingsTextContainer}>
            <Text style={styles.settingsTitle}>Taste & Allergy Profile</Text>
            <Text style={styles.settingsSubtitle}>Manage your dietary needs and tastes</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    padding: 24,
    paddingTop: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a'
  },
  content: {
    padding: 24
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  settingsTextContainer: {
    flex: 1
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#64748b'
  }
});
