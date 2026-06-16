import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { getForms, FormData } from '../../storage/forms';

const BADGE: Record<string, { label: string; bg: string; color: string }> = {
  approved:     { label: 'Approved',     bg: '#EAF3DE', color: '#27500A' },
  needs_review: { label: 'Needs review', bg: '#FAEEDA', color: '#633806' },
  unscanned:    { label: 'Analyzing',    bg: '#F1EFE8', color: '#5F5E5A' },
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

  const unscanned = forms.filter(f => f.status === 'unscanned').length;
  const needsReview = forms.filter(f => f.status === 'needs_review').length;
  const allOcrDone = unscanned === 0;

  function handleActionBtn() {
    if (allOcrDone) {
      const next = forms.find(f => f.status === 'needs_review');
      if (next) router.push({ pathname: '/form-detail', params: { id: next.id } });
    } else {
      refresh();
    }
  }

  const showActionBtn = needsReview > 0 || unscanned > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>{forms.length} total · {needsReview} need review</Text>

      {showActionBtn && (
        <TouchableOpacity style={styles.actionBtn} onPress={handleActionBtn}>
          <Ionicons
            name={allOcrDone ? 'arrow-forward-circle-outline' : 'refresh-outline'}
            size={18}
            color="#fff"
          />
          <Text style={styles.actionBtnText}>
            {allOcrDone
              ? `Review next (${needsReview} remaining)`
              : `Refresh — ${forms.length - unscanned} of ${forms.length} analyzed`}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={forms}
        keyExtractor={item => item.id}
        refreshing={refreshing}
        onRefresh={refresh}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.empty}>No photos yet — go to Camera to start.</Text>}
        renderItem={({ item }) => {
          const badge = BADGE[item.status] || BADGE.unscanned;
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
                <Text style={styles.meta}>{item.date || '—'} · {item.weight || '—'} lbs</Text>
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
  summary: { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#185FA5', borderRadius: 10, padding: 12, marginBottom: 8 },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  thumb: { width: 44, height: 44, backgroundColor: '#f5f5f3', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  separator: { height: 0.5, backgroundColor: '#0001' },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 40 },
});