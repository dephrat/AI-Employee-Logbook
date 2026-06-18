import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { getForms, FormData } from '../storage/forms';

const CATEGORIES: { label: string; field: keyof FormData }[] = [
  { label: 'Non-Perishable', field: 'nonPerishable' },
  { label: 'Produce',        field: 'produce' },
  { label: 'Dairy',          field: 'dairy' },
  { label: 'Meat',           field: 'meat' },
  { label: 'Baked Goods',    field: 'bakedGoods' },
  { label: 'Pet Food',       field: 'petFood' },
  { label: 'Toys',           field: 'toys' },
  { label: 'Hygiene',        field: 'hygiene' },
  { label: 'School Supplies',field: 'schoolSupplies' },
];

export default function FormDetailReadonlyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [form, setForm] = useState<Partial<FormData>>({});
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    getForms().then(forms => {
      const found = forms.find(f => f.id === id);
      if (found) setForm(found);
    });
  }, [id]);

  function Field({ label, value }: { label: string; value?: string }) {
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value || '—'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.readonlyBanner}>
        <Ionicons name="lock-closed-outline" size={14} color="#633806" />
        <Text style={styles.readonlyText}>Read only — already saved to spreadsheet</Text>
      </View>

      {form.photoUri && (
        <Image source={{ uri: form.photoUri }} style={styles.photo} resizeMode="contain" />
      )}

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Donation info</Text>
        <Field label="Date received" value={form.date} />
        <Field label="Donor / Event" value={form.donor} />
        <Field label="Total weight (lbs)" value={form.weight} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Category weights</Text>
        {CATEGORIES.map(({ label, field }) => {
          const val = form[field] as string;
          if (!val) return null;
          return (
            <View key={label} style={styles.catRow}>
              <Text style={styles.catLabel}>{label}</Text>
              <Text style={styles.catValue}>{val}</Text>
            </View>
          );
        })}
        {form.other ? (
          <Field label="Other" value={form.other} />
        ) : null}
      </View>

      {(form.contactName || form.contactEmail || form.contactPhone) && (
        <View style={styles.card}>
          <TouchableOpacity style={styles.collapseHeader} onPress={() => setShowContact(v => !v)}>
            <Text style={styles.collapseTitle}>Contact info</Text>
            <Ionicons name={showContact ? 'chevron-up' : 'chevron-down'} size={18} color="#888" />
          </TouchableOpacity>
          {showContact && (
            <View style={styles.fields}>
              <Field label="Name / Business" value={form.contactName} />
              <Field label="Address" value={form.contactAddress} />
              <Field label="Email" value={form.contactEmail} />
              <Field label="Phone" value={form.contactPhone} />
              <Field label="New donor?" value={form.newDonor || undefined} />
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/save-confirmation')}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  readonlyBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FAEEDA', borderRadius: 8, padding: 10 },
  readonlyText: { fontSize: 13, color: '#633806' },
  photo: { width: '100%', height: 300, borderRadius: 12, backgroundColor: '#111' },
  card: { borderWidth: 0.5, borderColor: '#0002', borderRadius: 12, padding: 14, gap: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  fields: { gap: 10 },
  field: { gap: 2 },
  fieldLabel: { fontSize: 13, color: '#888' },
  fieldValue: { fontSize: 15, color: '#1a1a1a' },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#0001' },
  catLabel: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  catValue: { fontSize: 14, color: '#1a1a1a', fontWeight: '500' },
  collapseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  collapseTitle: { fontSize: 14, color: '#1a1a1a' },
  backBtn: { padding: 13, borderWidth: 0.5, borderColor: '#185FA5', borderRadius: 10, alignItems: 'center' },
  backText: { color: '#185FA5', fontSize: 15 },
});