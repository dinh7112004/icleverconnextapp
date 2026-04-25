import React, { useState, useEffect, memo, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Image, DeviceEventEmitter } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuScreen from '../screens/MenuScreen';
import { userApi, studentApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';

// Hệ thống cấp độ dựa trên điểm
// Hệ thống 20 cấp độ vinh danh iClever
const LEVELS = [
    { level: 1, name: 'Tân binh học đường', minPoints: 0 },
    { level: 2, name: 'Mầm non học thuật', minPoints: 100 },
    { level: 3, name: 'Học sinh chuyên cần', minPoints: 250 },
    { level: 4, name: 'Người tìm tòi', minPoints: 450 },
    { level: 5, name: 'Người khám phá', minPoints: 700 },
    { level: 6, name: 'Người chinh phục', minPoints: 1000 },
    { level: 7, name: 'Học sinh tích cực', minPoints: 1350 },
    { level: 8, name: 'Học sinh vững vàng', minPoints: 1750 },
    { level: 9, name: 'Học sinh ưu tú', minPoints: 2200 },
    { level: 10, name: 'Học sinh xuất sắc', minPoints: 2700 },
    { level: 11, name: 'Kỹ năng điêu luyện', minPoints: 3300 },
    { level: 12, name: 'Tư duy nhạy bén', minPoints: 4000 },
    { level: 13, name: 'Trí tuệ thông thái', minPoints: 4800 },
    { level: 14, name: 'Học bá iClever', minPoints: 5700 },
    { level: 15, name: 'Bậc thầy tri thức', minPoints: 6700 },
    { level: 16, name: 'Cao thủ học đường', minPoints: 7800 },
    { level: 17, name: 'Đại sư học thuật', minPoints: 9000 },
    { level: 18, name: 'Thiên tài xuất chúng', minPoints: 10500 },
    { level: 19, name: 'Vô song kỳ tài', minPoints: 12500 },
    { level: 20, name: 'Huyền thoại iClever', minPoints: 15000 },
];

function getLevelInfo(points: number) {
    let current = LEVELS[0];
    let next = LEVELS[1];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (points >= LEVELS[i].minPoints) {
            current = LEVELS[i];
            next = LEVELS[i + 1] || LEVELS[i];
            break;
        }
    }
    const pointsToNext = next.minPoints - points;
    const range = next.minPoints - current.minPoints;
    const progress = range > 0 ? ((points - current.minPoints) / range) : 1;
    return { level: current.level, levelName: current.name, pointsToNext, progress };
}

import { userCache } from '../services/userCache';

function UserHeader({ userData: propUserData, studentInfo: propStudentData, isReady }: UserHeaderProps) {
    const { isDark, theme } = useTheme();
    const [isMenuVisible, setMenuVisible] = useState(false);
    
    // KHỞI TẠO ĐỒNG BỘ - Lấy từ Cache RAM ra dùng ngay lập tức
    const [internalUser, setInternalUser] = useState<any>(propUserData || userCache.getUser());
    const [studentData, setStudentData] = useState<any>(propStudentData || userCache.getStudentProfile());
    
    const userData = propUserData || internalUser;
    const [loadingProfile, setLoadingProfile] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        const init = async () => {
            // Nếu có dữ liệu mới từ Props thì cập nhật vào Cache
            if (propStudentData) {
                setStudentData(propStudentData);
                userCache.setStudentProfile(propStudentData);
            }
            if (propUserData) {
                setInternalUser(propUserData);
                userCache.setUser(propUserData);
            }
            
            // Nếu vẫn rỗng thì mới đi fetch
            if (!userData || !studentData) {
                fetchProfile();
            }
        };

        init();

        // Tự động cập nhật lại ảnh/thông tin mỗi khi màn hình được hiển thị lại
        const unsubscribeFocus = navigation.addListener('focus', () => {
            fetchProfile();
        });

        // Nghe tín hiệu thay đổi tức thì từ các màn hình khác
        const eventSub = DeviceEventEmitter.addListener('refresh_user_profile', () => {
            fetchProfile();
        });

        return () => {
            unsubscribeFocus();
            eventSub.remove();
        };
    }, [propUserData?.id, propStudentData?.id, navigation]);

    const fetchProfile = async () => {
        if (loadingProfile) return;
        try {
            setLoadingProfile(true);
            
            // Luôn ưu tiên đọc từ bộ nhớ máy trước để lấy ảnh mới nhất vừa đổi
            const [cachedUser, cachedStudent] = await Promise.all([
                AsyncStorage.getItem('user'),
                AsyncStorage.getItem('student_profile')
            ]);

            if (cachedUser) {
                const user = JSON.parse(cachedUser);
                setInternalUser(user);
                userCache.setUser(user);
            }
            
            if (cachedStudent) {
                const student = JSON.parse(cachedStudent);
                setStudentData(student);
                userCache.setStudentProfile(student);
            }

            // Nếu chưa có dữ liệu gì mới gọi API
            if (!cachedUser || !cachedStudent) {
                const response = await userApi.getProfile();
                const user = response.data.data || response.data;
                setInternalUser(user);
                userCache.setUser(user);

                const sRes = await studentApi.getProfile(); 
                const sData = sRes.data.data || sRes.data;
                setStudentData(sData);
                userCache.setStudentProfile(sData);
            }

        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoadingProfile(false);
        }
    };



    // Tính toán thông tin hiển thị
    const fullName = userData?.fullName || 'Người dùng';
    const avatarUrl = studentData?.avatarUrl || userData?.avatarUrl || null;
    const role = (userData?.role || '').toLowerCase();

    // Thông tin lớp/trường từ dữ liệu học sinh (nếu có)
    const className = studentData?.currentClass?.name || studentData?.className || '';
    const schoolName = studentData?.school?.name || studentData?.schoolName || 'iClever Connect';

    // Hệ thống điểm (Tích hợp API thật)
    const points = userData?.points || 0;
    const coins = userData?.coins || 0;
    const { level, levelName, pointsToNext, progress } = getLevelInfo(points);

    return (
        <View style={[styles.headerBackground, { backgroundColor: isDark ? '#0f172a' : '#2b58de' }]}>
            <MenuScreen 
                isVisible={isMenuVisible} 
                onClose={() => setMenuVisible(false)} 
                avatarUrl={avatarUrl}
            />
            
            <View style={styles.topNav}>
                <TouchableOpacity 
                    onPress={() => setMenuVisible(true)}
                    style={{ padding: 10, marginLeft: -10 }}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <Ionicons name="menu" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.appName}>iClever Connect</Text>
                <TouchableOpacity 
                    style={[styles.notificationBtn, { padding: 10, marginRight: -10 }]}
                    onPress={() => (navigation as any).navigate('MainTabs', { screen: 'MainNews' })}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <Ionicons name="notifications" size={26} color="white" />
                    <View style={[styles.notificationBadge, { borderColor: isDark ? '#0f172a' : '#2b58de', top: 8, right: 8 }]} />
                </TouchableOpacity>
            </View>

            <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)' }]}>
                        {avatarUrl ? (
                            <Image 
                                source={{ uri: avatarUrl }} 
                                style={styles.avatar}
                                fadeDuration={0}
                            />
                        ) : (
                            <Ionicons name="person" size={30} color="rgba(255,255,255,0.4)" />
                        )}
                    </View>
                </View>
                <View style={styles.userTextContent}>
                    <Text style={styles.userName}>
                        {!isReady ? '...' : (studentData?.fullName || (role === 'student' ? fullName : 'Chưa chọn học sinh'))}
                    </Text>
                    <View style={styles.userSubRow}>
                        {className ? (
                            <View style={styles.classBadge}>
                                <Text style={styles.classText}>{className}</Text>
                            </View>
                        ) : null}
                        <Text style={styles.schoolName}>{schoolName}</Text>
                    </View>
                </View>
            </View>

            <View style={[styles.statsCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.12)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)' }]}>
                <View style={styles.statsTopRow}>
                    <View style={styles.levelLeft}>
                        <View style={[styles.medalBox, { backgroundColor: isDark ? '#92400e' : '#f1c40f' }]}>
                            <FontAwesome5 name="medal" size={18} color={isDark ? '#fbbf24' : '#d35400'} />
                        </View>
                        <View style={{ marginLeft: 10, flex: 1 }}>
                            <Text style={styles.levelLabel}>CẤP ĐỘ {level}</Text>
                            <Text style={styles.levelName} numberOfLines={1} ellipsizeMode="tail">{levelName}</Text>
                        </View>
                    </View>

                     <View style={styles.levelRight}>
                        <View style={styles.statGroup}>
                            <Text style={styles.statLabel}>ĐIỂM</Text>
                            <Text style={styles.statValue}>{points}</Text>
                        </View>

                        <View style={styles.dividerVertical} />

                        <View style={styles.statGroup}>
                            <Text style={styles.statLabel}>XU</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[styles.statValue, { color: '#f1c40f' }]}>{coins}</Text>
                                <FontAwesome5 name="star" size={12} color="#f1c40f" style={{ marginLeft: 4 }} />
                            </View>
                        </View>

                        {/* Nút mũi tên chuyển sang Khu vui chơi */}
                        <TouchableOpacity 
                            style={styles.gameArrowBtn}
                            onPress={() => (navigation as any).navigate('GameList')}
                        >
                            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.progressSection}>
                    <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.15)' }]}>
                        <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: isDark ? '#d97706' : '#f39c12' }]} />
                    </View>
                    <Text style={styles.progressText}>Còn {pointsToNext} điểm để lên cấp</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerBackground: { 
        backgroundColor: '#2b58de', 
        paddingBottom: 25, 
        borderBottomLeftRadius: 30, 
        borderBottomRightRadius: 30 
    },
    topNav: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingTop: 10 
    },
    appName: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    notificationBtn: { position: 'relative' },
    notificationBadge: { 
        position: 'absolute', 
        top: 2, 
        right: 2, 
        width: 10, 
        height: 10, 
        backgroundColor: '#ff4d4d', 
        borderRadius: 5, 
        borderWidth: 1.5, 
        borderColor: '#2b58de' 
    },
    userInfo: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 25, 
        marginTop: 25 
    },
    avatarContainer: {
        borderRadius: 40,
        marginRight: 15,
        overflow: 'hidden'
    },
    avatarPlaceholder: { 
        width: 60, 
        height: 60, 
        borderRadius: 30, 
        justifyContent: 'center', 
        alignItems: 'center',
        overflow: 'hidden'
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'transparent'
    },
    userTextContent: { flex: 1 },
    userName: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
    userSubRow: { flexDirection: 'row', alignItems: 'center' },
    classBadge: { 
        backgroundColor: 'rgba(255,255,255,0.2)', 
        paddingHorizontal: 10, 
        paddingVertical: 2, 
        borderRadius: 8,
        marginRight: 8
    },
    classText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    schoolName: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    
    statsCard: { 
        backgroundColor: 'rgba(255, 255, 255, 0.12)', 
        marginHorizontal: 15, 
        marginTop: 20, 
        padding: 15, 
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)'
    },
    statsTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    levelLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
    medalBox: { 
        width: 36, 
        height: 36, 
        backgroundColor: '#f1c40f', 
        borderRadius: 8, 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    levelLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold', marginBottom: 1 },
    levelName: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    levelRight: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
    statGroup: { alignItems: 'center', paddingHorizontal: 6 },
    dividerVertical: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.2)' },
    statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginBottom: 2, textAlign: 'center' },
    statValue: { color: 'white', fontSize: 17, fontWeight: 'bold' },
    progressSection: { marginTop: 18 },
    progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: 6, backgroundColor: '#f39c12', borderRadius: 3 },
    progressText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, textAlign: 'right', marginTop: 6 },
    gameArrowBtn: {
        position: 'absolute',
        top: -15,
        right: -10,
        padding: 10,
    },
});

export default memo(UserHeader);
