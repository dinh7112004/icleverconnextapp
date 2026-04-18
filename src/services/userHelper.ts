/**
 * Helper để lấy thông tin user hiện tại từ AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredUser {
    id: string;
    fullName: string;
    email: string;
    className: string;
    schoolName: string;
    level: number;
    levelName: string;
    points: number;
    coins: number;
    role: 'student' | 'parent';
    avatarUrl?: string;
    badges?: string[];
    studentId?: string; // ID học sinh (nếu là parent hoặc student login trực tiếp)
    classId?: string;
    schoolId?: string;
}

/**
 * Lấy thông tin user đang đăng nhập từ AsyncStorage
 */
export const getCurrentUser = async (): Promise<StoredUser | null> => {
    try {
        const raw = await AsyncStorage.getItem('user');
        if (!raw) return null;
        return JSON.parse(raw) as StoredUser;
    } catch {
        return null;
    }
};

/**
 * Lấy studentId của học sinh hiện tại (dùng cho Parent lấy info con, hoặc Student)
 */
export const getCurrentStudentId = async (): Promise<string | null> => {
    const user = await getCurrentUser();
    if (!user) return null;
    // Nếu là student, dùng id của chính mình
    if (user.role === 'student') return user.id;
    // Nếu là parent, dùng studentId được lưu khi login
    return user.studentId || null;
};

/**
 * Lấy classId của học sinh hiện tại
 */
export const getCurrentClassId = async (): Promise<string | null> => {
    const user = await getCurrentUser();
    return user?.classId || null;
};

/**
 * Lấy schoolId của user hiện tại
 */
export const getCurrentSchoolId = async (): Promise<string | null> => {
    const user = await getCurrentUser();
    return user?.schoolId || null;
};

/**
 * Lấy token JWT
 */
export const getToken = async (): Promise<string | null> => {
    return AsyncStorage.getItem('userToken');
};

/**
 * Xóa toàn bộ session (logout)
 */
export const clearSession = async (): Promise<void> => {
    await AsyncStorage.multiRemove(['userToken', 'user']);
};
