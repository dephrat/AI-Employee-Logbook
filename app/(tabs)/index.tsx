import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addForm, FormData, getForms, runOcr } from '../../storage/forms';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [forms, setForms] = useState<FormData[]>([]);
  const [taking, setTaking] = useState(false);
  const [autoFocus, setAutoFocus] = useState<'on' | 'off'>('on');
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      getForms().then(setForms);
    }, [])
  );

  function triggerFocus() {
    setAutoFocus('off');
    setTimeout(() => setAutoFocus('on'), 100);
  }

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
    if (!cameraRef.current || taking) return;
    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, exif: true });
      if (photo) {
        let uri = photo.uri;
        if (photo.width > photo.height) {
          const exifOrientation = photo.exif?.Orientation;
          const rotateDeg = exifOrientation === 3 ? -90 : 90;
          const rotated = await ImageManipulator.manipulateAsync(
            uri,
            [{ rotate: rotateDeg }],
            { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG }
          );
          uri = rotated.uri;
        }
        const form = await addForm(uri);
        setForms(prev => [...prev, form]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        runOcr(form);
      }
    } finally {
      setTaking(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Camera fills entire screen */}
      <CameraView
        style={styles.viewfinder}
        ref={cameraRef}
        facing="back"
        autofocus={autoFocus}
        animateShutter={false}
      />

      {/* Controls overlaid on top */}
      <View style={styles.overlay}>
        {/* Top bar with thumbnail strip and focus button */}
        <View style={styles.topBar}>
          <ScrollView horizontal contentContainerStyle={styles.stripContent}>
            {forms.length === 0
              ? <Text style={styles.stripEmpty}>No photos yet</Text>
              : forms.slice().reverse().map((form) => (
                  <Image key={form.id} source={{ uri: form.photoUri }} style={styles.thumb} />
                ))
            }
          </ScrollView>
          <TouchableOpacity style={styles.focusBtn} onPress={triggerFocus}>
            <Ionicons name="scan-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.doneBtn, forms.length === 0 && styles.doneBtnDisabled]}
            disabled={forms.length === 0}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.doneBtnText}>Review {forms.length} photo{forms.length !== 1 ? 's' : ''}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shutter} onPress={takePicture} disabled={taking}>
            <View style={[styles.shutterInner, taking && { backgroundColor: '#aaa' }]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  viewfinder: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1, flexDirection: 'column' },
  topBar: {
    paddingTop: 48,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    height: 110,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  stripContent: { alignItems: 'center', gap: 8 },
  stripEmpty: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  thumb: { width: 56, height: 56, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  focusBtn: { marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8 },
  bottomBar: {
    paddingBottom: 32,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    gap: 20,
    paddingTop: 16,
  },
  shutter: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  doneBtn: { backgroundColor: '#185FA5', borderRadius: 10, padding: 12, paddingHorizontal: 24, alignItems: 'center', width: '100%' },
  doneBtnDisabled: { opacity: 0.4 },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  permContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16, backgroundColor: '#fff' },
  permText: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 },
  permBtn: { backgroundColor: '#185FA5', borderRadius: 10, padding: 14, alignItems: 'center', width: '100%' },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});