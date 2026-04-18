import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuScreen from '../screens/MenuScreen';
import { userApi, studentApi } from '../services/api';

// Hệ thống cấp độ dựa trên điểm
const LEVELS = [
    { level: 1, name: 'Tân binh học đường', minPoints: 0 },
    { level: 2, name: 'Học sinh chăm chỉ', minPoints: 100 },
    { level: 3, name: 'Học sinh giỏi', minPoints: 250 },
    { level: 4, name: 'Học sinh xuất sắc', minPoints: 450 },
    { level: 5, name: 'Chiến binh học đường', minPoints: 700 },
    { level: 6, name: 'Học bá', minPoints: 1000 },
    { level: 7, name: 'Thần đồng', minPoints: 1400 },
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

interface UserHeaderProps {
    setIsLoggedIn?: (val: boolean) => void;
    userData?: any;
}

export default function UserHeader({ setIsLoggedIn, userData: propUserData }: UserHeaderProps) {
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [internalUser, setInternalUser] = useState<any>(null);
    
    // Ưu tiên dùng userData từ Props (HomeScreen truyền xuống), nếu không có thì dùng state nội bộ
    const userData = propUserData || internalUser;
    const [studentData, setStudentData] = useState<any>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        setStudentData(null); // Clear stale child data when user changes
        setLoadingProfile(true); 
        fetchProfile();
    }, [propUserData]); // Chạy lại nếu HomeScreen cập nhật propUserData

    const fetchProfile = async () => {
        try {
            setLoadingProfile(true);
            let user = propUserData;
            if (!user) {
                const response = await userApi.getProfile();
                user = response.data.data || response.data;
                setInternalUser(user);
            }

            // Nếu là học sinh hoặc phụ huynh, gọi /students/me để lấy thông tin học sinh
            const roleLower = user?.role?.toLowerCase();
            if (roleLower === 'student' || roleLower === 'parent') {
                try {
                    const sRes = await studentApi.getProfile(); // backend đã xử lý trả về đúng con của phụ huynh này
                    const sData = sRes.data.data || sRes.data;
                    setStudentData(sData);
                } catch (e) {
                    console.log('Không lấy được student profile từ /students/me:', e);
                    
                    // Fallback
                    const storedUser = await AsyncStorage.getItem('user');
                    if (storedUser) {
                        const parsed = JSON.parse(storedUser);
                        if (parsed.studentId) {
                            const sResById = await studentApi.getProfile(parsed.studentId);
                            setStudentData(sResById.data.data || sResById.data);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoadingProfile(false);
        }
    };


    if (loadingProfile) {
        return (
            <View style={[styles.headerBackground, { height: 250, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color="white" size="large" />
            </View>
        );
    }

    // Tính toán thông tin hiển thị
    const fullName = userData?.fullName || 'Người dùng';
    const avatarUrl = userData?.avatarUrl || null;
    const role = (userData?.role || '').toLowerCase();

    // Thông tin lớp/trường từ dữ liệu học sinh (nếu có)
    const className = studentData?.currentClass?.name || studentData?.className || '';
    const schoolName = studentData?.school?.name || studentData?.schoolName || 'iClever Connect';

    // Hệ thống điểm (Tích hợp API thật)
    const points = userData?.points || 0;
    const coins = userData?.coins || 0;
    const { level, levelName, pointsToNext, progress } = getLevelInfo(points);

    return (
        <View style={styles.headerBackground}>
            <MenuScreen 
                isVisible={isMenuVisible} 
                onClose={() => setMenuVisible(false)} 
                setIsLoggedIn={setIsLoggedIn}
                avatarUrl={avatarUrl}
            />
            
            <View style={styles.topNav}>
                <TouchableOpacity onPress={() => setMenuVisible(true)}>
                    <Ionicons name="menu" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.appName}>iClever Connect</Text>
                <TouchableOpacity 
                    style={styles.notificationBtn}
                    onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Tin tức' })}
                >
                    <Ionicons name="notifications" size={26} color="white" />
                    <View style={styles.notificationBadge} />
                </TouchableOpacity>
            </View>

            <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarPlaceholder}>
                        {avatarUrl ? (
                            <Image 
                                source={{ uri: avatarUrl }} 
                                style={{ width: 60, height: 60, borderRadius: 30 }} 
                            />
                        ) : (
                            <Text style={{ fontSize: 32 }}>{role === 'student' ? '🧑‍🎓' : '👨🏽‍🦲'}</Text>
                        )}
                    </View>
                </View>
                <View style={styles.userTextContent}>
                    <Text style={styles.userName}>
                        {loadingProfile ? 'Đang tải...' : (studentData?.fullName || (role === 'student' ? fullName : 'Chưa chọn học sinh'))}
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

            <View style={styles.statsCard}>
                <View style={styles.statsTopRow}>
                    <View style={styles.levelLeft}>
                        <View style={styles.medalBox}>
                            <FontAwesome5 name="medal" size={18} color="#d35400" />
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
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
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
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        borderRadius: 40,
        padding: 2,
        marginRight: 15
    },
    avatarPlaceholder: { 
        width: 60, 
        height: 60, 
        backgroundColor: '#e1e8ef', 
        borderRadius: 30, 
        justifyContent: 'center', 
        alignItems: 'center',
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
