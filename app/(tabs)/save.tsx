import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SaveScreen() {
  function handleSave() {
    Alert.alert(
      'Save to spreadsheet?',
      '3 reviewed forms will be added to the June 2026 spreadsheet.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => {} },
      ]
    );
  }

  function handleDiscard() {
    Alert.alert(
      'Discard unsaved changes?',
      'All photos and form data will be cleared. This cannot be undone.',
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => {} },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Text style={styles.sectionLabel}>Preview — June 2026</Text>
      <ScrollView horizontal style={styles.tableWrap}>
        <View>
          <View style={[styles.row, styles.headerRow]}>
            {['Date','Source','Non-Per.','Produce','Dairy','Meat','Total'].map(col => (
              <Text key={col} style={[styles.cell, styles.headerCell]}>{col}</Text>
            ))}
          </View>
          {[
            ['5/20','Port BIC','29','','','','29'],
            ['6/1','SDM','160','','360','','520'],
            ['6/2','Anon','','91','','','91'],
          ].map((r, i) => (
            <View key={i} style={styles.row}>
              {r.map((cell, j) => <Text key={j} style={styles.cell}>{cell}</Text>)}
            </View>
          ))}
          <View style={[styles.row, styles.totalRow]}>
            {['Total','','189','91','360','','640'].map((cell, j) => (
              <Text key={j} style={[styles.cell, styles.totalCell]}>{cell}</Text>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.warning}>
        <Ionicons name="warning-outline" size={15} color="#633806" />
        <Text style={styles.warningText}>1 form still needs review — it won't be saved.</Text>
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Destination</Text>
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Server URL</Text>
        <TextInput
          style={styles.input}
          defaultValue="http://192.168.1.100:5000"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Ionicons name="save-outline" size={18} color="#fff" />
        <Text style={styles.saveBtnText}>Save 3 forms to spreadsheet</Text>
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
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#0001' },
  headerRow: { backgroundColor: '#185FA5' },
  cell: { width: 72, padding: 7, fontSize: 11, color: '#1a1a1a' },
  headerCell: { color: '#fff', fontWeight: '500' },
  totalRow: { backgroundColor: '#f5f5f3' },
  totalCell: { fontWeight: '500' },
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