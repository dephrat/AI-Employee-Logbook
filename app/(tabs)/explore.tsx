import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MOCK_FORMS = [
  { id: '1', donor: 'Port BIC', date: 'May 20', weight: '29 lbs', categories: 'Non-Perishable', status: 'staged' },
  { id: '2', donor: 'SDM', date: 'Jun 1', weight: '520 lbs', categories: 'Non-Perishable, Dairy', status: 'staged' },
  { id: '3', donor: 'Anon', date: 'Jun 2', weight: '91 lbs', categories: 'Produce', status: 'reviewed' },
  { id: '4', donor: 'Form 4', date: 'Jun 4', weight: '—', categories: 'Analyzed — tap to confirm', status: 'needs_review' },
];

const BADGE: Record<string, { label: string; bg: string; color: string }> = {
  staged:      { label: 'Staged',       bg: '#E6F1FB', color: '#0C447C' },
  reviewed:    { label: 'Reviewed',     bg: '#EAF3DE', color: '#27500A' },
  needs_review:{ label: 'Needs review', bg: '#FAEEDA', color: '#633806' },
};

export default function ReviewScreen() {
  const needsReview = MOCK_FORMS.filter(f => f.status === 'needs_review').length;

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>{MOCK_FORMS.length} total · {needsReview} need review</Text>
      <FlatList
        data={MOCK_FORMS}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const badge = BADGE[item.status] || BADGE.staged;
          return (
            <TouchableOpacity style={styles.row} onPress={() => {}}>
              <View style={styles.thumb}>
                <Ionicons
                  name={item.status === 'needs_review' ? 'warning-outline' : 'document-text-outline'}
                  size={22}
                  color={item.status === 'needs_review' ? '#BA7517' : '#185FA5'}
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.donor}</Text>
                <Text style={styles.meta}>{item.date} · {item.weight} · {item.categories}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  summary: { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  thumb: { width: 44, height: 44, backgroundColor: '#f5f5f3', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  separator: { height: 0.5, backgroundColor: '#0001' },
});