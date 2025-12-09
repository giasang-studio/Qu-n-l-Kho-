
import { InventoryItem, User } from "../types";

const CLOUD_STORAGE_KEY = 'ai_warehouse_cloud_mock_db';
const GOOGLE_SESSION_KEY = 'ai_warehouse_google_session';

interface CloudData {
  users: Record<string, User & { password: string }>;
  inventory: InventoryItem[];
  lastSynced: string;
  version: string;
}

export interface GoogleProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

// Simulate network delay (1-2 seconds)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- MOCK GOOGLE AUTH SERVICE ---

/**
 * Checks if a Google session exists in local storage.
 */
export const checkGoogleSession = (): GoogleProfile | null => {
  try {
    const savedSession = localStorage.getItem(GOOGLE_SESSION_KEY);
    return savedSession ? JSON.parse(savedSession) : null;
  } catch (e) {
    return null;
  }
};

export const mockGoogleLogin = async (): Promise<GoogleProfile> => {
  await delay(1200); // Fake popup time
  
  // Create a mock profile
  const profile: GoogleProfile = {
    id: 'google-uid-' + Date.now(),
    name: 'Nguyễn Văn Quản Lý',
    email: 'quanlykho.admin@gmail.com',
    avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+Quan+Ly&background=0D8ABC&color=fff&size=128'
  };

  // Persist session
  localStorage.setItem(GOOGLE_SESSION_KEY, JSON.stringify(profile));
  
  return profile;
};

export const mockGoogleLogout = async (): Promise<void> => {
  await delay(500);
  localStorage.removeItem(GOOGLE_SESSION_KEY);
  return;
};

// --- MOCK DRIVE STORAGE SERVICE ---

export const uploadToCloud = async (
  users: Record<string, User & { password: string }>,
  inventory: InventoryItem[]
): Promise<{ success: boolean; timestamp: string }> => {
  await delay(2000); // Fake uploading time to Drive

  try {
    const payload: CloudData = {
      users,
      inventory,
      lastSynced: new Date().toISOString(),
      version: '1.0'
    };
    // In a real app, this would be a fetch POST to Google Drive API
    localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(payload));
    return { success: true, timestamp: payload.lastSynced };
  } catch (error) {
    console.error("Cloud Upload Error", error);
    return { success: false, timestamp: '' };
  }
};

export const fetchFromCloud = async (): Promise<{ success: boolean; data?: CloudData }> => {
  await delay(2000); // Fake downloading time from Drive

  try {
    // In a real app, this would be a fetch GET from Google Drive API
    const rawData = localStorage.getItem(CLOUD_STORAGE_KEY);
    if (!rawData) {
      return { success: false };
    }
    const data = JSON.parse(rawData) as CloudData;
    return { success: true, data };
  } catch (error) {
    console.error("Cloud Download Error", error);
    return { success: false };
  }
};

export const getCloudMetadata = (): { hasData: boolean; lastSynced: string | null } => {
  const rawData = localStorage.getItem(CLOUD_STORAGE_KEY);
  if (rawData) {
    const data = JSON.parse(rawData);
    return { hasData: true, lastSynced: data.lastSynced };
  }
  return { hasData: false, lastSynced: null };
};
