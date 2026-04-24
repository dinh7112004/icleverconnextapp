import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, SafeAreaView,
    TouchableOpacity, FlatList, ActivityIndicator, TextInput, Animated, RefreshControl
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import UserHeader from '../components/UserHeader';
import { notificationApi, userApi, studentApi } from '../services/api';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Dữ liệu mẫu cho Hòm thư (Tab 2)
const mailItems = [
    { id: '1', title: 'Thư ngỏ về việc tổ chức Hội trại Xuân 2024 - "Xuân Gắn Kết"', sender: 'Ban Giám Hiệu', date: '15/09/2023', code: '101/TB-NS', isNew: true },
    { id: '2', title: 'Quyết định về việc điều chỉnh mức thu học phí năm học 2023-2024', sender: 'Hội đồng quản trị', date: '10/09/2023', code: '05/QĐ-HĐQT', isNew: false },
];



export default function NewsScreen({ route }: any) {
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState(route?.params?.tab || 1);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedNotiId, setExpandedNotiId] = useState<string | null>(null);
    const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
    const [feedbackVisibleIds, setFeedbackVisibleIds] = useState<string[]>([]);
    const [feedbackTexts, setFeedbackTexts] = useState<{[key: string]: string}>({});
    const [userData, setUserData] = useState<any>(null);
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [hasLoadedCache, setHasLoadedCache] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            // 1. Load cache first for instant UI
            const cachedNoti = await AsyncStorage.getItem('notifications_cache');
            if (cachedNoti) {
                const mapped = JSON.parse(cachedNoti);
                setNotifications(mapped);
                setLoading(false); // Hide spinner early if we have cache
            }

            // 2. Load user data from storage
            const userString = await AsyncStorage.getItem('user');
            const studentString = await AsyncStorage.getItem('student_profile');
            if (userString) setUserData(JSON.parse(userString));
            if (studentString) setStudentInfo(JSON.parse(studentString));
            setHasLoadedCache(true);

            // 3. Fetch fresh data in background
            fetchNotifications(false);
            
            // Sync profiles in background
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

    useEffect(() => {
        if (route?.params?.tab) {
            setActiveTab(route.params.tab);
        }
    }, [route?.params?.tab]);

    const fetchNotifications = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            
            const response = await notificationApi.getAll();
            let data = response.data.data || response.data;
            if (data && data.data) data = data.data;
            
            const rawList = Array.isArray(data) ? data : [];
            
            const mapped = rawList.map((n: any) => ({
                id: n._id || n.id,
                type: n.type,
                title: n.title,
                content: n.message,
                sender: n.data?.sourceName || 'Hệ thống',
                time: n.data?.time || moment(n.createdAt).format('HH:mm'),
                date: n.data?.date || moment(n.createdAt).format('DD/MM/YYYY'),
                unread: n.status === 'unread',
                priority: n.priority,
                data: n.data,
                rawType: n.type
            }));

            setNotifications(mapped);
            await AsyncStorage.setItem('notifications_cache', JSON.stringify(mapped));
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const toggleExpand = (id: string) => {
        setExpandedNotiId(expandedNotiId === id ? null : id);
    };

    const toggleConfirm = (id: string) => {
        if (!confirmedIds.includes(id)) {
            setConfirmedIds([...confirmedIds, id]);
        }
    };

    const toggleFeedbackInput = (id: string) => {
        if (feedbackVisibleIds.includes(id)) {
            setFeedbackVisibleIds(feedbackVisibleIds.filter(fId => fId !== id));
        } else {
            setFeedbackVisibleIds([...feedbackVisibleIds, id]);
        }
    };

    const handleSendFeedback = (id: string) => {
        setFeedbackVisibleIds(feedbackVisibleIds.filter(fId => fId !== id));
        setFeedbackTexts({...feedbackTexts, [id]: ''});
    };

    const filteredNotifications = notifications.filter(n => {
        // Filter out official documents for the first tab
        if (n.data?.isOfficial) return false;

        if (selectedFilter === 'all') return true;
        
        // If 'emergency' is selected, show URGENT/HIGH priority OR specific types
        if (selectedFilter === 'emergency') {
            return n.priority === 'urgent' || n.priority === 'high' || n.type === 'announcement' || n.type === 'system_alert';
        }

        const typeMap: {[key: string]: string[]} = {
            payment: ['payment_due', 'payment_received'],
            attendance: ['attendance_marked'],
            general: ['activity', 'news']
        };

        return typeMap[selectedFilter]?.includes(n.type);
    });

    const officialDocuments = notifications.filter(n => n.data?.isOfficial);

    const renderNotificationItem = ({ item }: { item: any }) => {
        const isExpanded = expandedNotiId === item.id || expandedNotiId === item._id;
        const currentId = item._id || item.id;
        const isConfirmed = confirmedIds.includes(currentId);
        const isFeedbackVisible = feedbackVisibleIds.includes(currentId);

        const getIconInfo = (type: string) => {
            switch(type) {
                case 'attendance_marked': return { name: 'time-outline', color: '#e17055', bg: isDark ? '#431407' : '#fff4f1' };
                case 'payment_due': return { name: 'card-outline', color: '#3498db', bg: isDark ? '#1e3a8a' : '#f0f7ff' };
                case 'announcement': return { name: 'warning-outline', color: '#e74c3c', bg: isDark ? '#450a0a' : '#fef1f0' };
                default: return { name: 'notifications-outline', color: theme.textSecondary, bg: isDark ? '#1E293B' : '#f8f9fa' };
            }
        };

        const iconInfo = getIconInfo(item.type);

        return (
            <View style={styles.notiCardOuter}>
                <TouchableOpacity 
                    style={[styles.notiCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: isDark ? '#000' : '#000' }]} 
                    activeOpacity={0.7}
                    onPress={() => toggleExpand(currentId)}
                >
                    <View style={styles.notiHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: iconInfo.bg }]}>
                            <Ionicons 
                                name={iconInfo.name as any} 
                                size={22} 
                                color={iconInfo.color} 
                            />
                        </View>
                        <View style={styles.notiMainInfo}>
                            <View style={styles.notiTopRow}>
                                <Text style={[styles.senderBold, { color: theme.text }]}>{item.sender || 'Hệ thống'}</Text>
                                <View style={styles.notiTimeRow}>
                                    <Ionicons name="time-outline" size={14} color={theme.textSecondary} style={{marginRight: 4}}/>
                                    <Text style={[styles.timeText, { color: theme.textSecondary }]}>{item.time || '08:30'} {item.date || '15/09/2023'}</Text>
                                    {item.unread && <View style={styles.unreadDot} />}
                                </View>
                            </View>
                            <Text style={[
                                styles.notiTitleText, 
                                { color: theme.primary },
                                item.type === 'attendance' && { color: '#e74c3c' }
                            ]}>
                                {item.title}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.notiDescText, { color: theme.textSecondary }]} numberOfLines={isExpanded ? undefined : 2}>
                        {item.content}
                    </Text>

                    <View style={styles.chevronBox}>
                        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#bdc3c7" />
                    </View>

                    {isExpanded && (
                        <View style={[styles.actionContainer, { borderTopColor: theme.border }]}>
                            <View style={styles.btnRow}>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, isConfirmed ? styles.confirmedBtn : styles.confirmBtn]}
                                    onPress={() => toggleConfirm(currentId)}
                                    disabled={isConfirmed}
                                >
                                    <Ionicons 
                                        name={isConfirmed ? "checkmark-circle-outline" : "checkmark-done-outline"} 
                                        size={18} 
                                        color={isConfirmed ? "#27ae60" : "white"} 
                                    />
                                    <Text style={[styles.btnLabel, isConfirmed ? styles.confirmedText : styles.confirmText]}>
                                        {isConfirmed ? t('news.confirmed') : t('news.confirmRead')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.actionBtn, styles.feedbackBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                    onPress={() => toggleFeedbackInput(currentId)}
                                >
                                    <Ionicons 
                                        name={isFeedbackVisible ? "close-outline" : "chatbubble-ellipses-outline"} 
                                        size={18} 
                                        color={theme.text} 
                                    />
                                    <Text style={[styles.btnLabel, styles.feedbackText, { color: theme.text }]}>
                                        {isFeedbackVisible ? t('news.closeFeedback') : t('news.feedback')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {isFeedbackVisible && (
                                <View style={[styles.feedbackInputWrapper, { backgroundColor: isDark ? '#1E293B' : '#f8f9fa', borderColor: theme.border }]}>
                                    <TextInput 
                                        style={[styles.feedbackInput, { color: theme.text }]}
                                        placeholder={t('news.feedbackPlaceholder')}
                                        placeholderTextColor={theme.textSecondary}
                                        value={feedbackTexts[currentId] || ''}
                                        onChangeText={(v) => setFeedbackTexts({...feedbackTexts, [currentId]: v})}
                                        multiline
                                    />
                                    <TouchableOpacity 
                                        style={[styles.sendIconBox, { backgroundColor: theme.primary }]}
                                        onPress={() => handleSendFeedback(currentId)}
                                    >
                                        <Ionicons name="send" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <UserHeader userData={userData} studentInfo={studentInfo} isReady={hasLoadedCache} />

            {/* --- TIÊU ĐỀ & TAB CHUYỂN ĐỔI --- */}
            <View style={[styles.headerRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <Text style={[styles.screenTitleCompact, { color: theme.text }]}>{t('news.title')}</Text>
                <View style={[styles.tabSwitcherCompact, { backgroundColor: isDark ? '#1E293B' : '#f1f3f6' }]}>
                    <TouchableOpacity
                        style={[styles.miniTabButton, activeTab === 1 && [styles.activeMiniTab, { backgroundColor: theme.surface }]]}
                        onPress={() => setActiveTab(1)}
                    >
                        <Text style={[styles.miniTabText, { color: theme.textSecondary }, activeTab === 1 && [styles.activeMiniTabText, { color: theme.primary }]]}>{t('news.announcement')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.miniTabButton, activeTab === 2 && [styles.activeMiniTab, { backgroundColor: theme.surface }]]}
                        onPress={() => setActiveTab(2)}
                    >
                        <Text style={[styles.miniTabText, { color: theme.textSecondary }, activeTab === 2 && [styles.activeMiniTabText, { color: theme.primary }]]}>{t('news.mailbox')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* --- NỘI DUNG --- */}
            <View style={{ flex: 1 }}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : activeTab === 1 ? (
                    <FlatList
                        data={filteredNotifications}
                        keyExtractor={(item) => item._id || item.id}
                        renderItem={renderNotificationItem}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListHeaderComponent={
                            <View style={[styles.filterSection, { backgroundColor: theme.surface }]}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
                                    {[
                                        { label: t('news.all'), icon: null, key: 'all' },
                                        { label: t('news.urgent'), icon: 'warning-outline', type: 'Ionicons', key: 'emergency' },
                                        { label: t('news.fee'), icon: 'card-outline', type: 'Ionicons', key: 'payment' },
                                        { label: t('news.attendance'), icon: 'time-outline', type: 'Ionicons', key: 'attendance' },
                                        { label: t('news.activity'), icon: 'images-outline', type: 'Ionicons', key: 'general' },
                                    ].map((f, index) => {
                                        const isActive = selectedFilter === f.key;
                                        return (
                                            <TouchableOpacity 
                                                key={index} 
                                                style={[styles.filterChip, { backgroundColor: theme.surface, borderColor: theme.border }, isActive && [styles.activeChip, { backgroundColor: theme.primary, borderColor: theme.primary }]]}
                                                onPress={() => setSelectedFilter(f.key)}
                                            >
                                                {f.icon && <Ionicons name={f.icon as any} size={14} color={isActive ? "white" : theme.textSecondary} style={{marginRight: 6}}/>}
                                                <Text style={[styles.filterText, { color: theme.textSecondary }, isActive && styles.activeFilterText]}>{f.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        }
                        contentContainerStyle={{ paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
                        <View style={[styles.infoBanner, { backgroundColor: isDark ? '#1E293B' : '#eef2f9' }]}>
                            <Ionicons name="mail-outline" size={20} color={theme.primary} />
                            <Text style={[styles.infoBannerText, { color: theme.textSecondary }]}>Nơi lưu trữ các văn bản, thông báo, thư mời chính thức từ nhà trường.</Text>
                        </View>

                        {officialDocuments.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <MaterialCommunityIcons name="email-outline" size={60} color={isDark ? '#2D3748' : '#e2e8f0'} />
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('news.officialEmpty')}</Text>
                            </View>
                        ) : officialDocuments.map(item => (
                            <View key={item.id} style={[styles.mailCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.mailIconBox, { backgroundColor: isDark ? '#1E293B' : '#f8f9fa' }]}><Ionicons name="document-text" size={24} color={theme.textSecondary} /></View>
                                <View style={{ flex: 1, marginLeft: 15 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {item.unread && <View style={styles.newBadge}><Text style={styles.newText}>{t('news.newBadge')}</Text></View>}
                                        <Text style={[styles.mailDate, { color: theme.textSecondary }]}>{item.date}</Text>
                                    </View>
                                    <Text style={[styles.mailTitle, { color: theme.text }]}>{item.title}</Text>
                                    <Text style={[styles.mailFooter, { color: theme.primary }]}>{item.sender}  •  Số: {item.data?.code || 'N/A'}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                            </View>
                        ))}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingVertical: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f6'
    },
    screenTitleCompact: { fontSize: 17, fontWeight: 'bold', color: '#2d3436', flex: 1 },
    tabSwitcherCompact: { 
        flexDirection: 'row', 
        backgroundColor: '#f1f3f6', 
        borderRadius: 10, 
        padding: 3,
        width: 170
    },
    miniTabButton: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8 },
    activeMiniTab: { backgroundColor: 'white', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
    miniTabText: { color: '#7f8c8d', fontWeight: '600', fontSize: 12 },
    activeMiniTabText: { color: '#3b5998', fontWeight: 'bold' },
    
    filterSection: { backgroundColor: 'white', paddingBottom: 10 },
    filterBar: { paddingLeft: 16, marginVertical: 10 },
    filterChip: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 7, 
        borderRadius: 10, 
        backgroundColor: 'white', 
        marginRight: 8, 
        borderWidth: 1, 
        borderColor: '#eee' 
    },
    activeChip: { backgroundColor: '#3498db', borderColor: '#3498db' },
    filterText: { fontSize: 12, color: '#636e72', fontWeight: '600' },
    activeFilterText: { color: 'white', fontWeight: 'bold' },

    notiCardOuter: { marginHorizontal: 16, marginBottom: 12, marginTop: 4 },
    notiCard: { 
        backgroundColor: 'white', 
        padding: 16, 
        borderRadius: 16, 
        borderWidth: 1,
        borderColor: '#f1f3f6',
        shadowColor: '#000', 
        shadowOpacity: 0.03, 
        shadowRadius: 5, 
        elevation: 1 
    },
    notiHeader: { flexDirection: 'row', marginBottom: 10 },
    iconCircle: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    notiMainInfo: { flex: 1 },
    notiTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    senderBold: { fontSize: 13, fontWeight: '700', color: '#2d3436' },
    notiTimeRow: { flexDirection: 'row', alignItems: 'center' },
    timeText: { fontSize: 11, color: '#bdc3c7' },
    unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e74c3c', marginLeft: 6 },
    notiTitleText: { fontSize: 14, fontWeight: '700', color: '#3498db', marginTop: 2 },
    notiDescText: { fontSize: 13, color: '#636e72', lineHeight: 20 },
    chevronBox: { alignItems: 'center', marginTop: 8 },

    actionContainer: { borderTopWidth: 1, borderTopColor: '#f1f3f6', marginTop: 12, paddingTop: 12 },
    btnRow: { flexDirection: 'row', justifyContent: 'space-between' },
    actionBtn: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 10, 
        borderRadius: 10,
        marginHorizontal: 4
    },
    confirmBtn: { backgroundColor: '#3498db' },
    confirmedBtn: { backgroundColor: '#f1fcf4', borderWidth: 1, borderColor: '#e8f5e9' },
    feedbackBtn: { backgroundColor: 'white', borderWidth: 1, borderColor: '#f1f3f6' },
    btnLabel: { fontSize: 12, fontWeight: '700', marginLeft: 6 },
    confirmText: { color: 'white' },
    confirmedText: { color: '#27ae60' },
    feedbackText: { color: '#2c3e50' },

    feedbackInputWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#f8f9fa', 
        borderRadius: 12, 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#eee'
    },
    feedbackInput: { flex: 1, fontSize: 13, color: '#2c3e50', maxHeight: 60 },
    sendIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#3498db', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },

    infoBanner: { flexDirection: 'row', backgroundColor: '#eef2f9', padding: 12, borderRadius: 12, marginBottom: 15, alignItems: 'center' },
    infoBannerText: { flex: 1, marginLeft: 10, fontSize: 12, color: '#3b5998', lineHeight: 18 },
    mailCard: { flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#f1f3f6' },
    mailIconBox: { width: 44, height: 44, backgroundColor: '#f8f9fa', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    mailTitle: { fontSize: 14, fontWeight: '700', color: '#2d3436', marginVertical: 4 },
    mailDate: { fontSize: 11, color: '#bdc3c7' },
    mailFooter: { fontSize: 11, color: '#3498db', fontWeight: '600' },
    newBadge: { backgroundColor: '#ffeaa7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 6 },
    newText: { fontSize: 9, fontWeight: 'bold', color: '#d63031' },
    emptyBox: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 15, color: '#94a3b8', marginTop: 12 }
});