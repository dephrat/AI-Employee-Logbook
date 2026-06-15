import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import { router } from 'expo-router';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<string[]>([]);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Ionicons name="camera-outline" size={48} color="#888" />
        <Text style={styles.permText}>Logbook needs camera access to photograph donation forms.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow camera access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePicture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (photo) setPhotos(prev => [...prev, photo.uri]);
  }

  return (
    <View style={styles.container}>
      {/* Viewfinder */}
      <CameraView style={styles.viewfinder} ref={cameraRef} facing="back" />

      {/* Thumbnail strip */}
      <ScrollView horizontal style={styles.strip} contentContainerStyle={styles.stripContent}>
        {photos.length === 0
          ? <Text style={styles.stripEmpty}>No photos yet — tap the shutter</Text>
          : photos.map((_, i) => (
              <View key={i} style={styles.thumb}>
                <Text style={styles.thumbNum}>{i + 1}</Text>
              </View>
            ))
        }
      </ScrollView>

      {/* Shutter */}
      <View style={styles.shutterRow}>
        <TouchableOpacity style={styles.shutter} onPress={takePicture}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
      </View>

      {/* Done */}
      <TouchableOpacity
        style={[styles.doneBtn, photos.length === 0 && styles.doneBtnDisabled]}
        disabled={photos.length === 0}
        onPress={() => router.push('/(tabs)/explore')}
      >
        <Text style={styles.doneBtnText}>Review {photos.length} photo{photos.length !== 1 ? 's' : ''}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, gap: 12 },
  viewfinder: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  strip: { height: 80 },
  stripContent: { alignItems: 'center', paddingVertical: 12, gap: 8 },
  stripEmpty: { color: '#aaa', fontSize: 13 },
  thumb: { width: 56, height: 56, backgroundColor: '#e0e0e0', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  thumbNum: { fontSize: 16, fontWeight: '500', color: '#555' },
  shutterRow: { alignItems: 'center', paddingVertical: 8 },
  shutter: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', borderWidth: 3, borderColor: '#185FA5', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#185FA5' },
  doneBtn: { backgroundColor: '#185FA5', borderRadius: 10, padding: 14, alignItems: 'center' },
  doneBtnDisabled: { opacity: 0.4 },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  permContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16, backgroundColor: '#fff' },
  permText: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 },
  permBtn: { backgroundColor: '#185FA5', borderRadius: 10, padding: 14, alignItems: 'center', width: '100%' },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});