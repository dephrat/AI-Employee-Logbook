import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { getForms, FormData } from '../../storage/forms';

const BADGE: Record<string, { label: string; bg: string; color: string }> = {
  staged:       { label: 'Staged',       bg: '#E6F1FB', color: '#0C447C' },
  reviewed:     { label: 'Reviewed',     bg: '#EAF3DE', color: '#27500A' },
  needs_review: { label: 'Needs review', bg: '#FAEEDA', color: '#633806' },
  scanned:      { label: 'Scanned',      bg: '#F1EFE8', color: '#5F5E5A' },
};

export default function ReviewScreen() {
  const [forms, setForms] = useState<FormData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    const updated = await getForms();
    setForms(updated);
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      getForms().then(setForms);
    }, [])
  );

  const needsReview = forms.filter(f => f.status === 'needs_review' || f.status === 'scanned').length;

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>{forms.length} total · {needsReview} need review</Text>
      <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
        <Ionicons name="refresh-outline" size={18} color="#185FA5" />
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
      <FlatList
        data={forms}
        keyExtractor={item => item.id}
        refreshing={refreshing}
        onRefresh={refresh}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>No photos yet — go to Camera to start.</Text>}
        renderItem={({ item }) => {
          const badge = BADGE[item.status] || BADGE.scanned;
          return (
            <TouchableOpacity style={styles.row} onPress={() => router.push({ pathname: '/form-detail', params: { id: item.id } })}>
              <View style={styles.thumb}>
                <Ionicons
                  name={item.status === 'needs_review' ? 'warning-outline' : 'document-text-outline'}
                  size={22}
                  color={item.status === 'needs_review' ? '#BA7517' : '#185FA5'}
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.donor || 'Unnamed form'}</Text>
                <Text style={styles.meta}>{item.date || '—'} · {item.weight || '—'} lbs · {item.status}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(tabs)/')}>
        <Ionicons name="camera-outline" size={18} color="#185FA5" />
        <Text style={styles.addBtnText}>Add more photos</Text>
      </TouchableOpacity>
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
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 0.5, borderColor: '#185FA5', borderRadius: 10, padding: 13, marginTop: 8 },
  addBtnText: { color: '#185FA5', fontSize: 15 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  refreshText: { color: '#185FA5', fontSize: 14 },
});