import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const CATEGORIES = [
  'Non-Perishable', 'Produce', 'Dairy', 'Meat',
  'Baked Goods', 'Pet Food', 'Toys', 'Hygiene', 'School Supplies',
];

export default function FormDetailScreen() {
  const [showContact, setShowContact] = useState(false);
  const [newDonor, setNewDonor] = useState<'yes' | 'no' | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Donation info */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Donation info</Text>
        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Date received</Text>
            <TextInput style={styles.input} placeholder="mm/dd/yyyy" />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Donor / Event</Text>
            <TextInput style={styles.input} placeholder="e.g. SDM, Port BIC, Anon" />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Total weight (lbs)</Text>
            <TextInput style={styles.input} placeholder="0" keyboardType="numeric" />
          </View>
        </View>
      </View>

      {/* Category weights */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Category weights</Text>
        {CATEGORIES.map(cat => (
          <View key={cat} style={styles.catRow}>
            <Text style={styles.catLabel}>{cat}</Text>
            <TextInput style={styles.catInput} placeholder="—" keyboardType="numeric" />
          </View>
        ))}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Other</Text>
          <TextInput style={styles.input} placeholder="Describe other items..." />
        </View>
      </View>

      {/* Contact info */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.collapseHeader} onPress={() => setShowContact(v => !v)}>
          <Text style={styles.collapseTitle}>Contact info <Text style={styles.optional}>(optional)</Text></Text>
          <Ionicons name={showContact ? 'chevron-up' : 'chevron-down'} size={18} color="#888" />
        </TouchableOpacity>
        {showContact && (
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Name / Business</Text>
              <TextInput style={styles.input} placeholder="" />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput style={styles.input} placeholder="" />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput style={styles.input} placeholder="" keyboardType="email-address" />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput style={styles.input} placeholder="" keyboardType="phone-pad" />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>New donor?</Text>
              <View style={styles.ynRow}>
                <TouchableOpacity
                  style={[styles.ynBtn, newDonor === 'yes' && styles.ynBtnSelected]}
                  onPress={() => setNewDonor('yes')}>
                  <Text style={[styles.ynText, newDonor === 'yes' && styles.ynTextSelected]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ynBtn, newDonor === 'no' && styles.ynBtnSelected]}
                  onPress={() => setNewDonor('no')}>
                  <Text style={[styles.ynText, newDonor === 'no' && styles.ynTextSelected]}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stageBtn} onPress={() => router.back()}>
          <Text style={styles.stageText}>Stage</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { borderWidth: 0.5, borderColor: '#0002', borderRadius: 12, padding: 14, gap: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  fields: { gap: 10 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 13, color: '#888' },
  input: { borderWidth: 0.5, borderColor: '#0002', borderRadius: 8, padding: 9, fontSize: 15, color: '#1a1a1a' },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#0001' },
  catLabel: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  catInput: { width: 72, borderWidth: 0.5, borderColor: '#0002', borderRadius: 8, padding: 7, fontSize: 14, color: '#1a1a1a', textAlign: 'right' },
  collapseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  collapseTitle: { fontSize: 14, color: '#1a1a1a' },
  optional: { color: '#888', fontWeight: '400' },
  ynRow: { flexDirection: 'row', gap: 8 },
  ynBtn: { flex: 1, padding: 9, borderWidth: 0.5, borderColor: '#0002', borderRadius: 8, alignItems: 'center' },
  ynBtnSelected: { backgroundColor: '#E6F1FB', borderColor: '#378ADD' },
  ynText: { fontSize: 14, color: '#1a1a1a' },
  ynTextSelected: { color: '#0C447C' },
  btnRow: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, padding: 13, borderWidth: 0.5, borderColor: '#185FA5', borderRadius: 10, alignItems: 'center' },
  cancelText: { color: '#185FA5', fontSize: 15 },
  stageBtn: { flex: 2, padding: 13, backgroundColor: '#185FA5', borderRadius: 10, alignItems: 'center' },
  stageText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});