import { Alert, View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { getForms, updateForm, deleteForm, FormData } from '../storage/forms';

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

export default function FormDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [form, setForm] = useState<Partial<FormData>>({});
  const [showContact, setShowContact] = useState(false);
  const [newDonor, setNewDonor] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    getForms().then(forms => {
      const found = forms.find(f => f.id === id);
      if (found) {
        setForm(found);
        setNewDonor(found.newDonor);
      }
    });
  }, [id]);

  function setField(field: keyof FormData, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleApprove() {
    if (!id) return;
    await updateForm(id, { ...form, newDonor, status: 'approved' });
    router.back();
  }

  async function handleDelete() {
    Alert.alert(
      'Delete this form?',
      'The photo and all extracted data will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          if (!id) return;
          await deleteForm(id as string);
          router.back();
        }},
      ]
    );
  }

  const categorySum = [
    form.nonPerishable, form.produce, form.dairy, form.meat,
    form.bakedGoods, form.petFood, form.toys, form.hygiene, form.schoolSupplies
  ].reduce((sum, v) => sum + (parseFloat(v as string || '0') || 0), 0);

  const totalWeight = parseFloat(form.weight as string || '0') || 0;
  const weightMismatch = totalWeight > 0 && categorySum > 0 && Math.abs(categorySum - totalWeight) > 0.5;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {form.photoUri && (
        <Image
          source={{ uri: form.photoUri }}
          style={styles.photo}
          resizeMode="contain"
        />
      )}

      {/* Donation info */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Donation info</Text>
        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Date received</Text>
            <TextInput
              style={styles.input}
              placeholder="mm/dd/yyyy"
              value={form.date || ''}
              onChangeText={v => setField('date', v)}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Donor / Event</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. SDM, Port BIC, Anon"
              value={form.donor || ''}
              onChangeText={v => setField('donor', v)}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Total weight (lbs)</Text>
            <TextInput
              style={[styles.input, weightMismatch && styles.inputWarning]}
              placeholder="0"
              keyboardType="numeric"
              value={form.weight || ''}
              onChangeText={v => setField('weight', v)}
            />
            {weightMismatch && (
              <Text style={styles.weightWarning}>
                Category weights sum to {categorySum} — doesn't match total of {totalWeight}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Category weights */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Category weights</Text>
        {CATEGORIES.map(({ label, field }) => (
          <View key={label} style={styles.catRow}>
            <Text style={styles.catLabel}>{label}</Text>
            <TextInput
              style={styles.catInput}
              placeholder="—"
              keyboardType="numeric"
              value={(form[field] as string) || ''}
              onChangeText={v => setField(field, v)}
            />
          </View>
        ))}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Other</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe other items..."
            value={form.other || ''}
            onChangeText={v => setField('other', v)}
          />
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
              <TextInput style={styles.input} placeholder="" value={form.contactName || ''} onChangeText={v => setField('contactName', v)} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput style={styles.input} placeholder="" value={form.contactAddress || ''} onChangeText={v => setField('contactAddress', v)} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput style={styles.input} placeholder="" keyboardType="email-address" value={form.contactEmail || ''} onChangeText={v => setField('contactEmail', v)} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput style={styles.input} placeholder="" keyboardType="phone-pad" value={form.contactPhone || ''} onChangeText={v => setField('contactPhone', v)} />
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
        <TouchableOpacity style={styles.approveBtn} onPress={handleApprove}>
          <Text style={styles.approveText}>Approve</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete this form</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  photo: { width: '100%', height: 300, borderRadius: 12, backgroundColor: '#111' },
  card: { borderWidth: 0.5, borderColor: '#0002', borderRadius: 12, padding: 14, gap: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  fields: { gap: 10 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 13, color: '#888' },
  input: { borderWidth: 0.5, borderColor: '#0002', borderRadius: 8, padding: 9, fontSize: 15, color: '#1a1a1a' },
  inputWarning: { borderColor: '#E07B00', borderWidth: 1.5 },
  weightWarning: { fontSize: 12, color: '#E07B00', marginTop: 2 },
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
  approveBtn: { flex: 2, padding: 13, backgroundColor: '#185FA5', borderRadius: 10, alignItems: 'center' },
  approveText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  deleteBtn: { padding: 14, alignItems: 'center' },
  deleteText: { color: '#A32D2D', fontSize: 14 },
});