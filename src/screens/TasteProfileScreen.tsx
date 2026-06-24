import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getTasteProfile, saveTasteProfile, TasteProfile } from '../services/userService';

const ALLERGY_OPTIONS = ['Peanuts', 'Dairy', 'Gluten', 'Shellfish', 'Tree Nuts', 'Soy'];
const DIET_OPTIONS = ['None', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto'];

export default function TasteProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietaryBaseline, setDietaryBaseline] = useState('None');
  const [personalTastes, setPersonalTastes] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getTasteProfile();
      if (profile) {
        setAllergies(profile.allergies || []);
        setDietaryBaseline(profile.dietaryBaseline || 'None');
        setPersonalTastes(profile.personalTastes || '');
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const toggleAllergy = (allergy: string) => {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter(a => a !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const profile: TasteProfile = {
      allergies,
      dietaryBaseline,
      personalTastes
    };
    await saveTasteProfile(profile);
    setSaving(false);
    Alert.alert('Success', 'Taste Profile saved successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Taste & Allergy Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.description}>
          Curate uses this profile to intelligently filter recommendations and automatically append safety notes to your kitchen orders.
        </Text>

        {/* Dietary Baseline */}
        <Text style={styles.sectionTitle}>Dietary Baseline</Text>
        <View style={styles.pillContainer}>
          {DIET_OPTIONS.map(diet => (
            <TouchableOpacity 
              key={diet}
              style={[styles.pill, dietaryBaseline === diet && styles.pillActive]}
              onPress={() => setDietaryBaseline(diet)}
            >
              <Text style={[styles.pillText, dietaryBaseline === diet && styles.pillTextActive]}>{diet}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Strict Allergies */}
        <Text style={styles.sectionTitle}>Strict Allergies</Text>
        <View style={styles.pillContainer}>
          {ALLERGY_OPTIONS.map(allergy => {
            const isActive = allergies.includes(allergy);
            return (
              <TouchableOpacity 
                key={allergy}
                style={[styles.pill, isActive && styles.pillDangerActive]}
                onPress={() => toggleAllergy(allergy)}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextDangerActive]}>{allergy}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* Personal Tastes */}
        <Text style={styles.sectionTitle}>Personal Tastes & Nuances</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="e.g., 'I love spicy food but hate cilantro' or 'Prefer low sodium'"
          placeholderTextColor="#888"
          value={personalTastes}
          onChangeText={setPersonalTastes}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Profile</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  content: { padding: 24 },
  description: { fontSize: 15, color: '#64748b', lineHeight: 22, marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  pill: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 20, 
    backgroundColor: '#f1f5f9', 
    marginRight: 12, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  pillActive: { backgroundColor: '#1a1a1a' },
  pillText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  pillTextActive: { color: '#fff' },
  pillDangerActive: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
  pillTextDangerActive: { color: '#b91c1c' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 24 },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    paddingTop: 16,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  saveBtn: { backgroundColor: '#1a1a1a', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
