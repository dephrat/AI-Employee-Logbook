import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export type FormStatus = 'unscanned' | 'ocr_failed' | 'needs_review' | 'approved';

export type FormData = {
  id: string;
  photoUri: string;
  tablePreviewUri?: string;
  previewReady?: boolean;
  status: FormStatus;
  createdAt: string;
  date: string;
  donor: string;
  weight: string;
  nonPerishable: string;
  produce: string;
  dairy: string;
  meat: string;
  bakedGoods: string;
  petFood: string;
  toys: string;
  hygiene: string;
  schoolSupplies: string;
  other: string;
  contactName: string;
  contactAddress: string;
  contactEmail: string;
  contactPhone: string;
  newDonor: 'yes' | 'no' | null;
};

const FORMS_KEY = 'logbook_forms';

export async function getForms(): Promise<FormData[]> {
  try {
    const raw = await AsyncStorage.getItem(FORMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveForms(forms: FormData[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FORMS_KEY, JSON.stringify(forms));
  } catch (e) {
    console.error('Failed to save forms:', e);
  }
}

export async function addForm(photoUri: string): Promise<FormData> {
  const forms = await getForms();
  const newForm: FormData = {
    id: Date.now().toString(),
    photoUri,
    status: 'unscanned',
    createdAt: new Date().toISOString(),
    date: '', donor: '', weight: '',
    nonPerishable: '', produce: '', dairy: '', meat: '',
    bakedGoods: '', petFood: '', toys: '', hygiene: '', schoolSupplies: '',
    other: '',
    contactName: '', contactAddress: '', contactEmail: '', contactPhone: '',
    newDonor: null,
  };
  await saveForms([...forms, newForm]);
  return newForm;
}

let writeQueue = Promise.resolve();

export async function updateForm(id: string, updates: Partial<FormData>): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    const forms = await getForms();
    const updated = forms.map(f => f.id === id ? { ...f, ...updates } : f);
    await saveForms(updated);
  });
  await writeQueue;
}

export async function clearForms(): Promise<void> {
  await AsyncStorage.removeItem(FORMS_KEY);
}

export async function deleteForm(id: string): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    const forms = await getForms();
    await saveForms(forms.filter(f => f.id !== id));
  });
  await writeQueue;
}

const SERVER_URL_KEY = 'logbook_server_url';

export async function getServerUrl(): Promise<string> {
  try {
    const result = await AsyncStorage.getItem(SERVER_URL_KEY);
    return result || 'http://192.168.1.100:5000';
  } catch {
    return 'http://192.168.1.100:5000';
  }
}

export async function saveServerUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SERVER_URL_KEY, url);
  } catch (e) {
    console.error('Failed to save server URL:', e);
  }
}

export async function runOcr(form: FormData): Promise<void> {
  try {
    const serverUrl = await getServerUrl();
    const base64 = await FileSystem.readAsStringAsync(form.photoUri, {
      encoding: 'base64',
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${serverUrl}/ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json();
    if (data.ok && data.fields) {
      await updateForm(form.id, { ...data.fields, status: 'needs_review' });
    } else {
      await updateForm(form.id, { status: 'ocr_failed' });
    }
  } catch (e) {
    console.error('OCR failed:', e);
    await updateForm(form.id, { status: 'ocr_failed' });
  }
}

const SAVED_FORMS_KEY = 'logbook_saved_forms';

export async function setSavedFormsSummary(forms: FormData[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVED_FORMS_KEY, JSON.stringify(forms));
  } catch (e) {
    console.error('Failed to save summary:', e);
  }
}

export async function getSavedFormsSummary(): Promise<FormData[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_FORMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearSavedFormsSummary(): Promise<void> {
  await AsyncStorage.removeItem(SAVED_FORMS_KEY);
}