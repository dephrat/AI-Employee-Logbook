import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { getSavedFormsSummary, clearSavedFormsSummary, FormData } from '../storage/forms';

const COLUMNS = ['Date', 'Source', 'Non-Per.', 'Produce', 'Dairy', 'Meat', 'Baked Goods', 'Pet Food', 'Toys', 'Hygiene', 'School Sup.', 'Total'];

function getRow(form: FormData): string[] {
  const total = [
    form.nonPerishable, form.produce, form.dairy, form.meat,
    form.bakedGoods, form.petFood, form.toys, form.hygiene, form.schoolSupplies
  ].reduce((sum, v) => sum + (parseFloat(v || '0') || 0), 0);
  return [
    form.date || '—', form.donor || '—',
    form.nonPerishable || '', form.produce || '', form.dairy || '',
    form.meat || '', form.bakedGoods || '', form.petFood || '',
    form.toys || '', form.hygiene || '', form.schoolSupplies || '',
    total > 0 ? total.toString() : '—',
  ];
}

function getTotals(forms: FormData[]): string[] {
  const fields: (keyof FormData)[] = ['nonPerishable', 'produce', 'dairy', 'meat', 'bakedGoods', 'petFood', 'toys', 'hygiene', 'schoolSupplies'];
  const sums = fields.map(f => forms.reduce((sum, form) => sum + (parseFloat(form[f] as string || '0') || 0), 0));
  const grand = sums.reduce((a, b) => a + b, 0);
  return ['Total', '', ...sums.map(s => s > 0 ? s.toString() : ''), grand > 0 ? grand.toString() : '—'];
}

export default function SaveConfirmationScreen() {
  const [savedForms, setSavedForms] = useState<FormData[]>([]);
  const [tapping, setTapping] = useState(false);

  useEffect(() => {
    getSavedFormsSummary().then(setSavedForms);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setTapping(false);
    }, [])
  );

  async function handleDone() {
    await clearSavedFormsSummary();
    router.push('/(tabs)/');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.successHeader}>
        <Ionicons name="checkmark-circle" size={40} color="#3B6D11" />
        <Text style={styles.successTitle}>Saved successfully</Text>
        <Text style={styles.successSub}>{savedForms.length} form{savedForms.length !== 1 ? 's' : ''} added to spreadsheet</Text>
      </View>

      <Text style={styles.sectionLabel}>What was saved</Text>
      <ScrollView horizontal style={styles.tableWrap}>
        <View>
          <View style={[styles.tableRow, styles.headerRow]}>
            {COLUMNS.map(col => <Text key={col} style={[styles.cell, styles.headerCell]}>{col}</Text>)}
          </View>
          {savedForms.map(form => (
            <View key={form.id} style={styles.tableRow}>
              {getRow(form).map((cell, j) => <Text key={j} style={styles.cell}>{cell}</Text>)}
            </View>
          ))}
          <View style={[styles.tableRow, styles.totalRow]}>
            {getTotals(savedForms).map((cell, j) => <Text key={j} style={[styles.cell, styles.totalCell]}>{cell}</Text>)}
          </View>
        </View>
      </ScrollView>

      <Text style={styles.sectionLabel}>Form details</Text>
      {savedForms.map(form => (
        <TouchableOpacity
          key={form.id}
          style={styles.formRow}
          disabled={tapping}
          onPress={() => {
            setTapping(true);
            router.replace({ pathname: '/form-detail-readonly', params: { id: form.id } });
          }}
        >
          <View style={styles.formRowInfo}>
            <Text style={styles.formRowName}>{form.donor || 'Unnamed'}</Text>
            <Text style={styles.formRowMeta}>{form.date || '—'} · {form.weight || '—'} lbs</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#888" />
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  successHeader: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  successTitle: { fontSize: 20, fontWeight: '600', color: '#27500A' },
  successSub: { fontSize: 14, color: '#3B6D11' },
  sectionLabel: { fontSize: 12, fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableWrap: { borderWidth: 0.5, borderColor: '#0002', borderRadius: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#0001' },
  headerRow: { backgroundColor: '#185FA5' },
  cell: { width: 80, padding: 7, fontSize: 11, color: '#1a1a1a' },
  headerCell: { color: '#fff', fontWeight: '500' },
  totalRow: { backgroundColor: '#f5f5f3' },
  totalCell: { fontWeight: '500' },
  formRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#0001' },
  formRowInfo: { flex: 1 },
  formRowName: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  formRowMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  doneBtn: { backgroundColor: '#185FA5', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});