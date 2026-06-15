import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen() {
  return (
    <View style={styles.container}>
      {/* Viewfinder */}
      <View style={styles.viewfinder}>
        <Ionicons name="camera-outline" size={48} color="#555" />
        <Text style={styles.viewfinderText}>Camera coming soon</Text>
      </View>

      {/* Thumbnail strip */}
      <ScrollView horizontal style={styles.strip} contentContainerStyle={styles.stripContent}>
        <Text style={styles.stripEmpty}>No photos yet — tap the shutter</Text>
      </ScrollView>

      {/* Shutter button */}
      <View style={styles.shutterRow}>
        <TouchableOpacity style={styles.shutter} onPress={() => {}}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
      </View>

      {/* Done button */}
      <TouchableOpacity style={[styles.doneBtn, styles.doneBtnDisabled]} disabled>
        <Text style={styles.doneBtnText}>Done — review 0 photos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, gap: 12 },
  viewfinder: {
    flex: 1, backgroundColor: '#111', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  viewfinderText: { color: '#888', fontSize: 13 },
  strip: { height: 80 },
  stripContent: { alignItems: 'center', paddingVertical: 12 },
  stripEmpty: { color: '#aaa', fontSize: 13 },
  shutterRow: { alignItems: 'center', paddingVertical: 8 },
  shutter: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fff', borderWidth: 3, borderColor: '#185FA5',
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#185FA5' },
  doneBtn: { backgroundColor: '#185FA5', borderRadius: 10, padding: 14, alignItems: 'center' },
  doneBtnDisabled: { opacity: 0.4 },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});