import AsyncStorage from '@react-native-async-storage/async-storage';

export type FormStatus = 'scanned' | 'needs_review' | 'reviewed' | 'staged';

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
    status: 'scanned',
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