import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

export interface BiometricCredentials {
  username?: string;
  password?: string;
  token?: string;
}

/**
 * Kiểm tra xem thiết bị có hỗ trợ sinh trắc học không
 */
export const checkBiometricSupport = async (): Promise<boolean> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch (error) {
    console.error('[Biometric] Error checking support:', error);
    return false;
  }
};

/**
 * Thực hiện xác thực sinh trắc học
 */
export const authenticateWithBiometrics = async (promptMessage = 'Xác thực để đăng nhập'): Promise<boolean> => {
  try {
    const isSupported = await checkBiometricSupport();
    if (!isSupported) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Sử dụng mật khẩu',
      disableDeviceFallback: false,
    });

    return result.success;
  } catch (error) {
    console.error('[Biometric] Error during authentication:', error);
    return false;
  }
};

/**
 * Lưu thông tin đăng nhập an toàn bằng SecureStore
 */
export const saveCredentials = async (credentials: BiometricCredentials): Promise<void> => {
  try {
    await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('[Biometric] Error saving credentials:', error);
  }
};

/**
 * Lấy thông tin đăng nhập đã lưu
 */
export const getCredentials = async (): Promise<BiometricCredentials | null> => {
  try {
    const credentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    if (credentials) {
      return JSON.parse(credentials);
    }
    return null;
  } catch (error) {
    console.error('[Biometric] Error getting credentials:', error);
    return null;
  }
};

/**
 * Xóa thông tin đăng nhập đã lưu
 */
export const clearCredentials = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
  } catch (error) {
    console.error('[Biometric] Error clearing credentials:', error);
  }
};
