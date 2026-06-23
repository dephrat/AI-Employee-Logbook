import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addForm, FormData, getForms, runOcr, updateForm } from '../../storage/forms';

const TABLE_TOP_RATIO = 0.28;
const TABLE_HEIGHT_RATIO = 0.22;
const TABLE_LEFT_RATIO = 0.02;
const TABLE_WIDTH_RATIO = 0.96;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [forms, setForms] = useState<FormData[]>([]);
  const [taking, setTaking] = useState(false);
  const [autoFocus, setAutoFocus] = useState<'on' | 'off'>('on');
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  useFocusEffect(
    useCallback(() => {
      getForms().then(setForms);
    }, [])
  );

  function triggerFocus() {
    setAutoFocus('off');
    setTimeout(() => setAutoFocus('on'), 100);
  }

  function getCropRegions(imageWidth: number, imageHeight: number) {
    const guideTop = 40;
    const guideBottom = screenHeight - 160;
    const guideHeight = guideBottom - guideTop;
    const guideWidth = screenWidth * 0.85;
    const guideLeft = (screenWidth - guideWidth) / 2;

    const scaleX = imageWidth / screenWidth;
    const scaleY = imageHeight / screenHeight;

    const formCrop = {
      originX: Math.round(guideLeft * scaleX),
      originY: Math.round(guideTop * scaleY),
      width: Math.round(guideWidth * scaleX),
      height: Math.round(guideHeight * scaleY),
    };

    const tableCrop = {
      originX: Math.round(formCrop.width * TABLE_LEFT_RATIO),
      originY: Math.round(formCrop.height * TABLE_TOP_RATIO),
      width: Math.round(formCrop.width * TABLE_WIDTH_RATIO),
      height: Math.round(formCrop.height * TABLE_HEIGHT_RATIO),
    };

    return { formCrop, tableCrop };
  }

  async function generatePreview(formId: string, uri: string) {
    try {
      const finalInfo = await ImageManipulator.manipulateAsync(uri, [], { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG });
      const { formCrop, tableCrop } = getCropRegions(finalInfo.width, finalInfo.height);

      const formImg = await ImageManipulator.manipulateAsync(
        uri,
        [{ crop: formCrop }],
        { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG }
      );

      const tableImg = await ImageManipulator.manipulateAsync(
        formImg.uri,
        [{ crop: tableCrop }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Check if OCR already finished
      const allForms = await getForms();
      const current = allForms.find(f => f.id === formId);
      const newStatus = (current?.date || current?.donor) ? 'needs_review' : current?.status;

      await updateForm(formId, {
        tablePreviewUri: tableImg.uri,
        previewReady: true,
        ...(newStatus ? { status: newStatus } : {}),
      });
    } catch (e) {
      console.error('Preview generation failed:', e);
      await updateForm(formId, { previewReady: true });
    }
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
        const exifOrientation = photo.exif?.Orientation;

        if (exifOrientation === 1) {
          const rotated = await ImageManipulator.manipulateAsync(uri, [{ rotate: 90 }], { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG });
          uri = rotated.uri;
        } else if (exifOrientation === 3) {
          const rotated = await ImageManipulator.manipulateAsync(uri, [{ rotate: -90 }], { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG });
          uri = rotated.uri;
        } else if (exifOrientation === 8) {
          const rotated = await ImageManipulator.manipulateAsync(uri, [{ rotate: 180 }], { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG });
          uri = rotated.uri;
        }

        const form = await addForm(uri);
        setForms(prev => [...prev, form]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Fire OCR and preview generation in parallel
        Promise.all([
          runOcr(form),
          generatePreview(form.id, uri),
        ]);
      }
    } finally {
      setTaking(false);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.viewfinder}
        ref={cameraRef}
        facing="back"
        autofocus={autoFocus}
        animateShutter={false}
      />

      <View style={styles.overlay}>
        <View style={styles.formGuide}>
          <View style={styles.formGuideRect}>
            <View style={[styles.tableGuideRect, {
              top: `${TABLE_TOP_RATIO * 100}%`,
              height: `${TABLE_HEIGHT_RATIO * 100}%`,
            }]} />
          </View>
        </View>

        <View style={styles.bottomBar}>
          <View style={styles.thumbWrap}>
            {forms.length > 0
              ? <Image source={{ uri: forms[forms.length - 1].photoUri }} style={styles.lastThumb} />
              : <View style={styles.lastThumbEmpty} />
            }
            {forms.length > 0 && (
              <View style={styles.thumbCount}>
                <Text style={styles.thumbCountText}>{forms.length}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.shutter} onPress={takePicture} disabled={taking}>
            <View style={[styles.shutterInner, taking && { backgroundColor: '#aaa' }]} />
          </TouchableOpacity>

          <View style={styles.rightControls}>
            <TouchableOpacity style={styles.focusBtn} onPress={triggerFocus}>
              <Ionicons name="scan-outline" size={22} color="#fff" />
              <Text style={styles.focusBtnText}>Focus</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reviewBtn, forms.length === 0 && styles.reviewBtnDisabled]}
              disabled={forms.length === 0}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text style={styles.reviewBtnText}>Review photos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  viewfinder: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1, flexDirection: 'column', justifyContent: 'flex-end' },
  formGuide: {
    position: 'absolute',
    top: 40,
    bottom: 160,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGuideRect: {
    width: '85%',
    aspectRatio: 0.77,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 8,
  },
  tableGuideRect: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderWidth: 1.5,
    borderColor: 'rgba(100,180,255,0.7)',
    borderStyle: 'dashed',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  thumbWrap: { width: 64, height: 64, position: 'relative' },
  lastThumb: { width: 64, height: 64, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  lastThumbEmpty: { width: 64, height: 64, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)' },
  thumbCount: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  thumbCountText: { color: '#fff', fontSize: 11, fontWeight: '500' },
  shutter: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  rightControls: { width: 64, alignItems: 'center', gap: 8 },
  focusBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8 },
  reviewBtn: { backgroundColor: '#185FA5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, alignItems: 'center' },
  reviewBtnDisabled: { opacity: 0.4 },
  reviewBtnText: { color: '#fff', fontSize: 12, fontWeight: '500', textAlign: 'center' },
  permContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16, backgroundColor: '#fff' },
  permText: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 },
  permBtn: { backgroundColor: '#185FA5', borderRadius: 10, padding: 14, alignItems: 'center', width: '100%' },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  focusBtnText: { color: '#fff', fontSize: 10, marginTop: 2 },
});