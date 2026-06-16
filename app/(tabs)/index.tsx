import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { addForm, getForms, updateForm, getServerUrl, FormData } from '../../storage/forms';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [forms, setForms] = useState<FormData[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      getForms().then(setForms);
    }, [])
  );

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
    if (photo) {
      const form = await addForm(photo.uri);
      setForms(prev => [...prev, form]);
      runOcr(form, photo.uri); // fire and forget
    }
  }

  async function runOcr(form: FormData, uri: string) {
    try {
      const serverUrl = await getServerUrl();
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const ocrResponse = await fetch(`${serverUrl}/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await ocrResponse.json();
      if (data.ok && data.fields) {
        await updateForm(form.id, { ...data.fields, status: 'needs_review' });
        setForms(prev => prev.map(f =>
          f.id === form.id ? { ...f, ...data.fields, status: 'needs_review' } : f
        ));
      }
    } catch (e) {
      console.error('OCR failed:', e);
    }
  }

  return (
    <View style={styles.container}>
      {/* Camera fills entire screen */}
      <CameraView 
        style={styles.viewfinder} 
        ref={cameraRef} 
        facing="back" 
        autofocus="on"
        onTap={({ nativeEvent }) => {
          cameraRef.current?.focus({ x: nativeEvent.touchX, y: nativeEvent.touchY });
        }}
      />

      {/* Controls overlaid on top */}
      <View style={styles.overlay}>
        {/* Thumbnail strip — top */}
        <View style={styles.topBar}>
          <ScrollView horizontal contentContainerStyle={styles.stripContent}>
            {forms.length === 0
              ? <Text style={styles.stripEmpty}>No photos yet</Text>
              : forms.map((form) => (
                  <Image key={form.id} source={{ uri: form.photoUri }} style={styles.thumb} />
                ))
            }
          </ScrollView>
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

          <TouchableOpacity style={styles.shutter} onPress={takePicture}>
            <View style={styles.shutterInner} />
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
  },
  stripContent: { alignItems: 'center', gap: 8 },
  stripEmpty: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  thumb: { width: 56, height: 56, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
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