
import AsyncStorage from '@react-native-async-storage/async-storage';

// Kho lưu trữ siêu tốc nằm trong bộ nhớ RAM
class UserCache {
    private static instance: UserCache;
    private user: any = null;
    private studentProfile: any = null;

    private constructor() {}

    public static getInstance(): UserCache {
        if (!UserCache.instance) {
            UserCache.instance = new UserCache();
        }
        return UserCache.instance;
    }

    // Nạp dữ liệu từ máy vào RAM (Chỉ chạy 1 lần khi mở App)
    public async initialize() {
        try {
            const [userData, studentData] = await Promise.all([
                AsyncStorage.getItem('user'),
                AsyncStorage.getItem('student_profile')
            ]);
            
            if (userData) this.user = JSON.parse(userData);
            if (studentData) this.studentProfile = JSON.parse(studentData);
            
            console.log('🚀 [UserCache] Initialized from storage');
        } catch (e) {
            console.error('❌ [UserCache] Init error:', e);
        }
    }


    public getUser() { return this.user; }
    public getStudentProfile() { return this.studentProfile; }

    public setUser(newUser: any, forceAvatar: boolean = false) { 
        if (this.user && newUser && !forceAvatar) {
            const currentAvt = this.user.avatarUrl || '';
            if (currentAvt.startsWith('file://') || currentAvt.startsWith('content://')) {
                newUser.avatarUrl = currentAvt;
            }
        }
        this.user = newUser; 
        AsyncStorage.setItem('user', JSON.stringify(newUser));
    }
    
    public setStudentProfile(newProfile: any, forceAvatar: boolean = false) { 
        if (this.studentProfile && newProfile && !forceAvatar) {
            const currentAvt = this.studentProfile.avatarUrl || '';
            if (currentAvt.startsWith('file://') || currentAvt.startsWith('content://')) {
                newProfile.avatarUrl = currentAvt;
            }
        }
        this.studentProfile = newProfile; 
        AsyncStorage.setItem('student_profile', JSON.stringify(newProfile));
    }

    // XÓA SẠCH DỮ LIỆU (Dùng khi Đăng xuất)
    public async clear() {
        this.user = null;
        this.studentProfile = null;
        try {
            await AsyncStorage.multiRemove([
                'userToken', 
                'refreshToken', 
                'user', 
                'student_profile'
            ]);
            console.log('🧹 [UserCache] Cleared all data');
        } catch (e) {
            console.error('❌ [UserCache] Clear error:', e);
        }
    }
}

export const userCache = UserCache.getInstance();
