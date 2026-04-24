import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import UserHeader from '../components/UserHeader';
import { newsApi, userApi, studentApi, notificationApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CACHE_KEY_NEWS = 'home_news_cache';
const CACHE_KEY_URGENT = 'home_urgent_cache';

export default function HomeScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();

    const menuItems = [
        { id: 1, name: t('home.lessons'), icon: 'school', color: '#3498db', type: 'Ionicons', roles: ['student', 'parent'] },
        { id: 2, name: t('home.miniGame'), icon: 'gamepad-variant', color: '#e84393', type: 'MaterialCommunityIcons', roles: ['student', 'parent'] },
        { id: 3, name: t('home.timetable'), icon: 'calendar-alt', color: '#9b59b6', type: 'FontAwesome5', roles: ['student', 'parent'] },
        { id: 4, name: t('home.academicResults'), icon: 'book-open', color: '#2ecc71', type: 'FontAwesome5', roles: ['student', 'parent'] },
        { id: 5, name: t('home.homework'), icon: 'clipboard-check', color: '#5f27cd', type: 'FontAwesome5', roles: ['student', 'parent'] },
        { id: 6, name: t('home.attendance'), icon: 'calendar-check', color: '#0984e3', type: 'FontAwesome5', roles: ['student', 'parent'] },
        { id: 7, name: t('home.tuition'), icon: 'credit-card', color: '#e67e22', type: 'FontAwesome5', roles: ['parent'] },
        { id: 8, name: t('home.menu'), icon: 'utensils', color: '#e74c3c', type: 'FontAwesome5', roles: ['student', 'parent'] },
        { id: 9, name: t('home.leaveRequest'), icon: 'file-alt', color: '#cd84f1', type: 'FontAwesome5', roles: ['parent'] },
        { id: 10, name: t('home.healthNote'), icon: 'notes-medical', color: '#ff4d4d', type: 'FontAwesome5', roles: ['student', 'parent'] },
        { id: 11, name: t('home.activities'), icon: 'images', color: '#ff9f43', type: 'FontAwesome5', roles: ['student', 'parent'] },
        { id: 12, name: t('home.medicine'), icon: 'pills', color: '#1abc9c', type: 'FontAwesome5', roles: ['parent'] },
        { id: 13, name: t('home.bus'), icon: 'bus', color: '#f1c40f', type: 'FontAwesome5', roles: ['student', 'parent'] },
        { id: 14, name: t('home.library'), icon: 'book', color: '#e67e22', type: 'FontAwesome5', roles: ['student', 'parent'] },
        { id: 15, name: t('home.chat'), icon: 'chatbubbles', color: '#1abc9c', type: 'Ionicons', roles: ['student', 'parent'] },
        { id: 16, name: t('home.survey'), icon: 'clipboard-list', color: '#27ae60', type: 'FontAwesome5', roles: ['student', 'parent'] },
    ];

    const [news, setNews] = useState<any[]>([]);
    const [urgentNotis, setUrgentNotis] = useState<any[]>([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [loadingUrgent, setLoadingUrgent] = useState(true);
    const [userData, setUserData] = useState<any>(null); 
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [userRole, setUserRole] = useState<string>('parent');
    const [hasLoadedCache, setHasLoadedCache] = useState(false);

    const fetchNews = useCallback(async (currentClassId?: string) => {
        try {
            const classId = currentClassId || studentInfo?.currentClassId;
            const schoolRes = await newsApi.getAll({ type: 'news', limit: 1 });
            let schoolData = schoolRes.data.data || schoolRes.data;
            if (schoolData && schoolData.data) schoolData = schoolData.data;
            const schoolItems = Array.isArray(schoolData) ? schoolData : [];

            let classItems = [];
            if (classId) {
                try {
                    const classRes = await newsApi.getAll({ type: 'activity', classId, limit: 1 });
                    let classData = classRes.data.data || classRes.data;
                    if (classData && classData.data) classData = classData.data;
                    classItems = Array.isArray(classData) ? classData : [];
                } catch (e) {}
            }
            
            const combined = [...schoolItems, ...classItems].sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });

            setNews(combined);
            AsyncStorage.setItem(CACHE_KEY_NEWS, JSON.stringify(combined));
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoadingNews(false);
        }
    }, [studentInfo?.currentClassId]);

    const fetchUrgentNotis = useCallback(async () => {
        try {
            const res = await notificationApi.getAll({ limit: 10 });
            let data = res.data.data || res.data;
            if (data && data.data) data = data.data;
            const all = Array.isArray(data) ? data : [];
            const urgent = all.filter((n: any) => (n.priority === 'urgent' || n.priority === 'high') && n.status === 'unread').slice(0, 2);
            setUrgentNotis(urgent);
            AsyncStorage.setItem(CACHE_KEY_URGENT, JSON.stringify(urgent));
        } catch (e) {
            console.error('Error fetching urgent notis:', e);
        } finally {
            setLoadingUrgent(false);
        }
    }, []);

    const loadInitialData = async () => {
        try {
            const [cachedNews, cachedUrgent, userString, studentString] = await Promise.all([
                AsyncStorage.getItem(CACHE_KEY_NEWS),
                AsyncStorage.getItem(CACHE_KEY_URGENT),
                AsyncStorage.getItem('user'),
                AsyncStorage.getItem('student_profile')
            ]);

            if (cachedNews) {
                setNews(JSON.parse(cachedNews));
                setLoadingNews(false);
            }
            if (cachedUrgent) {
                setUrgentNotis(JSON.parse(cachedUrgent));
                setLoadingUrgent(false);
            }
            if (userString) {
                const user = JSON.parse(userString);
                setUserData(user);
                setUserRole(user.role ? user.role.toLowerCase() : 'parent');
            }
            if (studentString) {
                setStudentInfo(JSON.parse(studentString));
            }
            setHasLoadedCache(true);

            // Sync fresh data in background
            const response = await userApi.getProfile();
            const freshUser = response.data.data || response.data;
            if (freshUser) {
                setUserData(freshUser);
                setUserRole(freshUser.role ? freshUser.role.toLowerCase() : 'parent');
                AsyncStorage.setItem('user', JSON.stringify(freshUser));
            }

            const studentResponse = await studentApi.getProfile();
            const freshStudent = studentResponse.data.data || studentResponse.data;
            if (freshStudent) {
                setStudentInfo(freshStudent);
                AsyncStorage.setItem('student_profile', JSON.stringify(freshStudent));
                fetchNews(freshStudent.currentClassId);
            } else {
                fetchNews();
            }
            fetchUrgentNotis();
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            const reloadFromCache = async () => {
                try {
                    const [userString, studentString] = await Promise.all([
                        AsyncStorage.getItem('user'),
                        AsyncStorage.getItem('student_profile')
                    ]);
                    if (userString) {
                        const user = JSON.parse(userString);
                        setUserData(user);
                        setUserRole(user.role ? user.role.toLowerCase() : 'parent');
                    }
                    if (studentString) {
                        setStudentInfo(JSON.parse(studentString));
                    }
                } catch (e) {}
            };
            
            reloadFromCache();
            
            // Sync fresh data in background
            userApi.getProfile().then(res => {
                const freshUser = res.data.data || res.data;
                if (freshUser) {
                    setUserData(freshUser);
                    setUserRole(freshUser.role ? freshUser.role.toLowerCase() : 'parent');
                    AsyncStorage.setItem('user', JSON.stringify(freshUser));
                }
            }).catch(() => {});

            studentApi.getProfile().then(res => {
                const freshStudent = res.data.data || res.data;
                if (freshStudent) {
                    setStudentInfo(freshStudent);
                    AsyncStorage.setItem('student_profile', JSON.stringify(freshStudent));
                }
            }).catch(() => {});

            fetchUrgentNotis();
        }, [])
    );

    const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

    const renderIcon = (item: any) => {
        if (item.type === 'Ionicons') return <Ionicons name={item.icon as any} size={24} color="white" />;
        if (item.type === 'MaterialCommunityIcons') return <MaterialCommunityIcons name={item.icon as any} size={24} color="white" />;
        return <FontAwesome5 name={item.icon} size={20} color="white" />;
    };

    const getSafeImageUrl = (url: string) => {
        if (!url || url === '') return 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000';
        if (url.startsWith('http')) return url.includes('?') ? `${url}&w=800` : `${url}?w=800`;
        return 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000';
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <UserHeader userData={userData} studentInfo={studentInfo} isReady={hasLoadedCache} />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.menuGrid, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    {filteredMenuItems.map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.menuItem}
                            onPress={() => {
                                // Sử dụng ID thay vì Name để không bị lỗi khi đổi ngôn ngữ
                                switch(item.id) {
                                    case 1: navigation.navigate('AcademicList'); break;
                                    case 2: navigation.navigate('GameList'); break;
                                    case 3: navigation.navigate('Timetable'); break;
                                    case 4: navigation.navigate('Grades'); break;
                                    case 5: navigation.navigate('Homework'); break;
                                    case 6: navigation.navigate('Attendance'); break;
                                    case 7: navigation.navigate('Tuition'); break;
                                    case 8: navigation.navigate('CanteenMenu'); break;
                                    case 9: navigation.navigate('LeaveRequest'); break;
                                    case 10: navigation.navigate('StudentNotes'); break;
                                    case 11: navigation.navigate('Activities'); break;
                                    case 12: navigation.navigate('MedicineInstruction'); break;
                                    case 13: navigation.navigate('SchoolBus'); break;
                                    case 14: navigation.navigate('Library'); break;
                                    case 15: navigation.navigate('ChatList'); break;
                                    case 16: navigation.navigate('Survey'); break;
                                }
                            }}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: item.color }]}>{renderIcon(item)}</View>
                            <Text style={[styles.menuText, { color: theme.text }]}>{item.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {urgentNotis.length > 0 && (
                    <View style={styles.urgentSection}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <Ionicons name="flash" size={20} color="#f39c12" style={{marginRight: 8}} />
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('home.urgent')}</Text>
                            </View>
                        </View>
                        {urgentNotis.map((item) => (
                            <TouchableOpacity 
                                key={item._id || item.id} 
                                style={[styles.urgentCard, { backgroundColor: theme.surface, borderLeftColor: item.type === 'payment_due' ? '#f97316' : '#ef4444' }]}
                                onPress={() => navigation.navigate('MainTabs', { screen: 'MainNews', params: { tab: 1, filter: 'emergency' } })}
                            >
                                <View style={[styles.urgentIconBox, { backgroundColor: isDark ? '#2D3748' : (item.type === 'payment_due' ? '#fff7ed' : '#fef2f2') }]}>
                                    <Ionicons name="notifications-outline" size={22} color={item.type === 'payment_due' ? "#f97316" : "#ef4444"} />
                                </View>
                                <View style={styles.urgentContent}>
                                    <Text style={[styles.urgentTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                                    <Text style={[styles.urgentDesc, { color: theme.textSecondary }]} numberOfLines={1}>{item.message}</Text>
                                </View>
                                <View style={[styles.urgentBadge, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
                                    <Text style={[styles.urgentBadgeText, { color: theme.textSecondary }]}>
                                        {item.data?.badge || (item.type === 'payment_due' ? 'Học phí' : 'Khẩn cấp')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={styles.activitySection}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="newspaper-outline" size={20} color="#3498db" style={{marginRight: 8}} />
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('home.news')}</Text>
                        </View>
                        <TouchableOpacity style={styles.viewAllBtn} onPress={() => (navigation as any).navigate('Activities')}>
                            <Text style={styles.viewMore}>Xem tất cả</Text>
                            <Ionicons name="chevron-forward" size={14} color="#3498db" />
                        </TouchableOpacity>
                    </View>

                    {news.map((item) => (
                            <TouchableOpacity key={item._id || item.id} style={[styles.activityCard, { backgroundColor: theme.surface }]} activeOpacity={0.9} onPress={() => (navigation as any).navigate('Activities')}>
                                <View style={styles.imageWrapper}>
                                    <Image source={{ uri: getSafeImageUrl(item.data?.imageUrl || item.thumbnail) }} style={styles.activityImage} />
                                    <View style={[styles.floatBadge, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)', borderColor: theme.border }]}><Text style={[styles.badgeText, { color: isDark ? '#60A5FA' : '#039be5' }]}>{item.type === 'news' ? 'TRƯỜNG' : 'LỚP'}</Text></View>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                                    <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>{item.message || item.summary}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    }
                    <View style={{ height: 30 }} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10, zIndex: 1 },
    menuItem: { width: '25%', alignItems: 'center', marginVertical: 12 },
    iconCircle: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 3 },
    menuText: { fontSize: 11, textAlign: 'center', fontWeight: '600' },
    activitySection: { paddingHorizontal: 16, marginTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center' },
    viewMore: { color: '#3498db', fontSize: 13, fontWeight: '700', marginRight: 2 },
    activityCard: { borderRadius: 16, marginBottom: 20, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
    imageWrapper: { width: '100%', height: 180, position: 'relative' },
    activityImage: { width: '100%', height: '100%' },
    floatBadge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
    badgeText: { fontSize: 10, fontWeight: '800' },
    cardInfo: { padding: 16 },
    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, lineHeight: 22 },
    cardDesc: { fontSize: 13, lineHeight: 20 },
    urgentSection: { paddingHorizontal: 16, marginTop: 24 },
    urgentCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 12, marginBottom: 12, borderLeftWidth: 4, elevation: 2 },
    urgentIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    urgentContent: { flex: 1, marginLeft: 12, marginRight: 8 },
    urgentTitle: { fontSize: 15, fontWeight: '800' },
    urgentDesc: { fontSize: 13, marginTop: 2 },
    urgentBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    urgentBadgeText: { fontSize: 11, fontWeight: '700', color: '#64748b' }
});