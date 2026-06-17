import AsyncStorage from '@react-native-async-storage/async-storage';

export type FormStatus = 'unscanned' | 'needs_review' | 'approved';

export type FormData = {
  id: string;
  photoUri: string;
  status: FormStatus;
  createdAt: string;
  // Donation info
  date: string;
  donor: string;
  weight: string;
  // Category weights
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
  // Contact (optional)
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

export async function updateForm(id: string, updates: Partial<FormData>): Promise<void> {
  const forms = await getForms();
  const updated = forms.map(f => f.id === id ? { ...f, ...updates } : f);
  await saveForms(updated);
}

export async function clearForms(): Promise<void> {
  await AsyncStorage.removeItem(FORMS_KEY);
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

export async function deleteForm(id: string): Promise<void> {
  const forms = await getForms();
  await saveForms(forms.filter(f => f.id !== id));
}