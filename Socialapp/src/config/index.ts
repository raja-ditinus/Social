import { Platform } from 'react-native';

// Physical device: use your machine's LAN IP
// Emulator: Android uses 10.0.2.2, iOS uses localhost
const PHYSICAL_DEVICE_IP = '192.168.18.88';
const USE_PHYSICAL_DEVICE = true;

const ANDROID_LOCALHOST = '10.0.2.2';
const IOS_LOCALHOST = 'localhost';

const localhost = USE_PHYSICAL_DEVICE
  ? PHYSICAL_DEVICE_IP
  : Platform.OS === 'android'
  ? ANDROID_LOCALHOST
  : IOS_LOCALHOST;

export const API_BASE_URL = `http://${localhost}:5000`;

export const FEED_PAGE_SIZE = 3;
export const COMMENTS_PAGE_SIZE = 20;
