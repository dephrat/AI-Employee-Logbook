import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { clearForms, getForms, deleteForm, FormData, getServerUrl, saveServerUrl, setSavedFormsSummary } from '../../storage/forms';
import { router } from 'expo-router';

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

export default function SaveScreen() {
  const [forms, setForms] = useState<FormData[]>([]);
  const [serverUrl, setServerUrl] = useState('http://192.168.1.100:5000');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getForms().then(setForms);
      getServerUrl().then(setServerUrl);
    }, [])
  );

  const approved = forms.filter(f => f.status === 'approved');
  const notReviewed = forms.filter(f => f.status === 'unscanned' || f.status === 'needs_review');

  async function handleSave() {
    if (approved.length === 0) {
      Alert.alert('Nothing to save', 'Approve at least one form in Review first.');
      return;
    }
    Alert.alert(
      'Save to spreadsheet?',
      `${approved.length} form${approved.length !== 1 ? 's' : ''} will be added to the spreadsheet.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: doSave },
      ]
    );
  }

  async function doSave() {
    setSaving(true);
    try {
      const response = await fetch(`${serverUrl}/append`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forms: approved }),
      });
      if (!response.ok) throw new Error('Server error');
      await setSavedFormsSummary(approved);
      await Promise.all(approved.map(f => deleteForm(f.id)));
      router.push('/save-confirmation');
    } catch (e) {
      Alert.alert('Error', 'Could not reach the server. Check the URL and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDiscard() {
    Alert.alert(
      'Discard unsaved changes?',
      'All photos and form data will be cleared. This cannot be undone.',
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: async () => {
          await clearForms();
          router.push('/(tabs)/');
        }},
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Preview — {approved.length} approved form{approved.length !== 1 ? 's' : ''}</Text>

      {approved.length === 0
        ? <Text style={styles.empty}>No approved forms yet. Review and approve forms first.</Text>
        : <ScrollView horizontal style={styles.tableWrap}>
            <View>
              <View style={[styles.tableRow, styles.headerRow]}>
                {COLUMNS.map(col => <Text key={col} style={[styles.cell, styles.headerCell]}>{col}</Text>)}
              </View>
              {approved.map(form => (
                <View key={form.id} style={styles.tableRow}>
                  {getRow(form).map((cell, j) => <Text key={j} style={styles.cell}>{cell}</Text>)}
                </View>
              ))}
              <View style={[styles.tableRow, styles.totalRow]}>
                {getTotals(approved).map((cell, j) => <Text key={j} style={[styles.cell, styles.totalCell]}>{cell}</Text>)}
              </View>
            </View>
          </ScrollView>
      }

      {notReviewed.length > 0 && (
        <View style={styles.warning}>
          <Ionicons name="warning-outline" size={15} color="#633806" />
          <Text style={styles.warningText}>{notReviewed.length} form{notReviewed.length !== 1 ? 's' : ''} still need review — they won't be saved.</Text>
        </View>
      )}

      <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Destination</Text>
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Server URL</Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={async (v) => {
            setServerUrl(v);
            await saveServerUrl(v);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        <Ionicons name="save-outline" size={18} color="#fff" />
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : `Save ${approved.length} form${approved.length !== 1 ? 's' : ''} to spreadsheet`}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
        <Text style={styles.discardText}>Discard unsaved changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  sectionLabel: { fontSize: 12, fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableWrap: { borderWidth: 0.5, borderColor: '#0002', borderRadius: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#0001' },
  headerRow: { backgroundColor: '#185FA5' },
  cell: { width: 80, padding: 7, fontSize: 11, color: '#1a1a1a' },
  headerCell: { color: '#fff', fontWeight: '500' },
  totalRow: { backgroundColor: '#f5f5f3' },
  totalCell: { fontWeight: '500' },
  empty: { fontSize: 14, color: '#aaa', textAlign: 'center', paddingVertical: 20 },
  warning: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FAEEDA', borderRadius: 8, padding: 10 },
  warningText: { fontSize: 13, color: '#633806', flex: 1 },
  card: { borderWidth: 0.5, borderColor: '#0002', borderRadius: 10, padding: 14, gap: 6 },
  fieldLabel: { fontSize: 13, color: '#888' },
  input: { fontSize: 15, color: '#1a1a1a', borderWidth: 0.5, borderColor: '#0002', borderRadius: 8, padding: 9 },
  saveBtn: { backgroundColor: '#185FA5', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  discardBtn: { padding: 14, alignItems: 'center' },
  discardText: { color: '#A32D2D', fontSize: 14 },
});