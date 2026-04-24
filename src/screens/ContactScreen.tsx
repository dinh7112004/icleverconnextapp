import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import UserHeader from '../components/UserHeader';
import { contactApi, userApi, studentApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ContactScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [hasLoadedCache, setHasLoadedCache] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            // 1. Load cache first for instant UI
            const cached = await AsyncStorage.getItem('contacts_cache');
            if (cached) {
                setContacts(JSON.parse(cached));
                setLoading(false); // Hide spinner early if we have cache
            }

            // 2. Load user data from storage
            const userString = await AsyncStorage.getItem('user');
            const studentString = await AsyncStorage.getItem('student_profile');
            if (userString) setUserData(JSON.parse(userString));
            if (studentString) setStudentInfo(JSON.parse(studentString));
            setHasLoadedCache(true);

            // 3. Fetch fresh data in background
            fetchContacts(false);
            
            // Sync profile in background
            userApi.getProfile().then(res => {
                const fresh = res.data.data || res.data;
                if (fresh) {
                    setUserData(fresh);
                    AsyncStorage.setItem('user', JSON.stringify(fresh));
                }
            }).catch(() => {});
        };

        initialize();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchContacts(true);
    };

    const fetchContacts = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            
            // Get classId from latest available source
            const userStr = await AsyncStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : userData;
            const studentStr = await AsyncStorage.getItem('student_profile');
            const student = studentStr ? JSON.parse(studentStr) : studentInfo;
            
            const classId = user?.classId || student?.currentClassId || '';
            
            if (!classId) {
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const response = await contactApi.getAll(classId);
            const result = response.data;
            let rawData = [];
            
            if (result && result.success) {
                const payload = result.data;
                rawData = Array.isArray(payload) ? payload : (payload?.data || []);
            }
            
            const mappedData = rawData.map((t: any) => ({
                id: t.id || t._id,
                userId: t.userId || t.user?.id || t.id,
                name: t.fullName || t.user?.fullName || 'Giáo viên',
                role: t.specialization || 'Giáo viên',
                avatarUrl: t.user?.avatarUrl || t.avatarUrl,
                isMainTeacher: t.isHomeroomTeacher || false 
            }));
            
            setContacts(mappedData);
            await AsyncStorage.setItem('contacts_cache', JSON.stringify(mappedData));
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* --- HEADER (FIXED) --- */}
            <UserHeader userData={userData} studentInfo={studentInfo} isReady={hasLoadedCache} />

            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* --- CONTACT LIST --- */}
                <View style={styles.contentSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('contact.title')}</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
                    ) : (
                        contacts.map((item) => (
                            <View key={item._id || item.id} style={[styles.contactCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: isDark ? '#000' : '#64748b' }]}>
                                <View style={styles.avatarContainer}>
                                    {item.avatarUrl && item.avatarUrl.startsWith('http') ? (
                                        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#1E293B' : '#eff6ff' }]}>
                                            <Ionicons name="person-outline" size={26} color={theme.primary} />
                                        </View>
                                    )}
                                </View>

                                <View style={styles.contactInfo}>
                                    <Text style={[styles.contactName, { color: theme.text }]}>{item.name}</Text>
                                    <Text style={[styles.contactRole, { color: theme.primary }]}>{item.role}</Text>
                                    {item.isMainTeacher && (
                                        <View style={[styles.badgeContainer, { backgroundColor: isDark ? '#334155' : '#fef9c3' }]}>
                                            <Text style={[styles.badgeText, { color: isDark ? '#94a3b8' : '#b45309' }]}>{t('contact.homeroom')}</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.contactActions}>
                                    <TouchableOpacity style={[styles.actionBtn, styles.callBtn, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4' }]}>
                                        <Ionicons name="call" size={18} color="#22c55e" />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, styles.chatBtn, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }]}
                                        onPress={() => {
                                            const otherUser = {
                                                id: item.userId || item.id,
                                                fullName: item.name,
                                                avatarUrl: item.avatarUrl
                                            };
                                            navigation.navigate('ChatDetail', { 
                                                otherUser,
                                                studentId: studentInfo?.id 
                                            });
                                        }}
                                    >
                                        <Ionicons name="chatbubble-ellipses" size={18} color="#3b82f6" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    contentSection: { paddingHorizontal: 16, marginTop: 20 },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 20,
        paddingLeft: 4
    },

    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
    },
    avatarPlaceholder: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    contactName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 2,
    },
    contactRole: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '500',
    },
    badgeContainer: {
        backgroundColor: '#fef9c3',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 6,
    },
    badgeText: {
        fontSize: 11,
        color: '#b45309',
        fontWeight: 'bold',
    },
    contactActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    callBtn: {
        backgroundColor: '#f0fdf4',
    },
    chatBtn: {
        backgroundColor: '#eff6ff',
    },
});