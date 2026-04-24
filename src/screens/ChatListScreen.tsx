import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    StyleSheet, Text, View, TextInput, FlatList,
    TouchableOpacity, SafeAreaView, ActivityIndicator,
    Image, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi, contactApi } from '../services/api';
import moment from 'moment';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function ChatListScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();
    const [threads, setThreads] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [hasLoadedCache, setHasLoadedCache] = useState(false);

    useEffect(() => {
        loadInitialData();
        fetchThreads();
    }, []);

    const loadInitialData = async () => {
        try {
            const studentString = await AsyncStorage.getItem('student_profile');
            if (studentString) setStudentInfo(JSON.parse(studentString));
            setHasLoadedCache(true);
        } catch (e) {
            setHasLoadedCache(true);
        }
    };

    const fetchThreads = async () => {
        try {
            const [threadRes, teacherRes] = await Promise.all([
                chatApi.getThreads(),
                contactApi.getAll()
            ]);
            setThreads(threadRes.data.data || []);
            
            // Extract teachers array correctly from NestJS response
            const teacherData = teacherRes.data.data;
            setTeachers(Array.isArray(teacherData) ? teacherData : (teacherData.data || []));
        } catch (error) {
            console.error('Error fetching chat data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filteredThreads = threads.filter(thread => 
        thread.user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTeachers = teachers.filter(t => 
        (t.fullName || t.user?.fullName)?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderChatItem = ({ item }: { item: any }) => {
        const otherUser = item.user;
        const lastMsg = item.lastMessage;
        const unreadCount = item.unreadCount || 0;
        
        return (
            <TouchableOpacity 
                style={[styles.chatItem, { borderBottomColor: theme.border }]}
                onPress={() => navigation.navigate('ChatDetail', { 
                    otherUser, 
                    studentId: lastMsg?.studentId || studentInfo?.id 
                })}
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                    {otherUser.avatarUrl ? (
                        <Image source={{ uri: otherUser.avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: getAvatarBg(otherUser.fullName || '') }]}>
                            <Text style={styles.avatarEmoji}>{getAvatarEmoji(otherUser.fullName || '')}</Text>
                        </View>
                    )}
                    <View style={[styles.onlineDot, { borderColor: theme.surface }]} />
                </View>
                
                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={[styles.chatName, { color: theme.text }]} numberOfLines={1}>{otherUser.fullName}</Text>
                        <Text style={[styles.chatTime, { color: theme.textSecondary }]}>
                            {lastMsg ? moment(lastMsg.created_at).format('HH:mm') : ''}
                        </Text>
                    </View>
                    <View style={styles.chatFooter}>
                        <Text style={[styles.lastMsg, { color: theme.textSecondary }, unreadCount > 0 && [styles.lastMsgUnread, { color: theme.text }]]} numberOfLines={1}>
                            {lastMsg?.body || 'Bắt đầu trò chuyện...'}
                        </Text>
                        {unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const getAvatarBg = (name: string) => {
        const colors = ['#FFD6E0', '#D6E2FF', '#D6FFE3', '#FFF5D6', '#E2D6FF'];
        const charCode = name?.charCodeAt(0) || 0;
        return colors[charCode % colors.length];
    };

    const getAvatarEmoji = (name: string) => {
        const emojis = ['👨‍🏫', '👩‍🏫', '👩‍🎓', '👨‍🎓', '🧑‍🏫'];
        const charCode = name?.charCodeAt(0) || 0;
        return emojis[charCode % emojis.length];
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDark ? '#2D3748' : '#f8fafc' }]}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{t('chat.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchWrapper, { backgroundColor: isDark ? '#2D3748' : '#f1f5f9' }]}>
                    <Ionicons name="search" size={20} color={theme.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder={t('chat.searchPlaceholder')}
                        placeholderTextColor={theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredThreads}
                    keyExtractor={(item) => item.id}
                    renderItem={renderChatItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => {
                            setRefreshing(true);
                            fetchThreads();
                        }} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={80} color={isDark ? '#2D3748' : '#e2e8f0'} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('chat.empty')}</Text>
                        </View>
                    }
                    ListHeaderComponent={
                        <View>
                            {filteredThreads.length > 0 && <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('chat.recent')}</Text>}
                        </View>
                    }
                    ListFooterComponent={
                        <View style={[styles.footerSection, { borderTopColor: theme.border }]}>
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('chat.teacherList')}</Text>
                            {filteredTeachers.map(teacher => (
                                <TouchableOpacity 
                                    key={teacher.id} 
                                    style={styles.teacherItem}
                                    onPress={() => {
                                        const otherUser = {
                                            id: teacher.userId || teacher.id,
                                            fullName: teacher.fullName || teacher.user?.fullName,
                                            avatarUrl: teacher.avatarUrl || teacher.user?.avatarUrl
                                        };
                                        navigation.navigate('ChatDetail', { 
                                            otherUser,
                                            studentId: studentInfo?.id 
                                        });
                                    }}
                                >
                                    <View style={styles.avatarMini}>
                                        {(teacher.avatarUrl || teacher.user?.avatarUrl) ? (
                                            <Image source={{ uri: teacher.avatarUrl || teacher.user?.avatarUrl }} style={styles.avatarImgSmall} />
                                        ) : (
                                            <View style={[styles.avatarImgSmall, { backgroundColor: getAvatarBg(teacher.fullName || '') }]}>
                                                <Text style={styles.avatarEmojiSmall}>{getAvatarEmoji(teacher.fullName || '')}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.teacherInfo}>
                                        <Text style={[styles.teacherName, { color: theme.text }]}>{teacher.fullName || teacher.user?.fullName}</Text>
                                        <Text style={[styles.teacherRole, { color: theme.textSecondary }]}>{teacher.specialization || 'Giáo viên'}</Text>
                                    </View>
                                    <View style={[styles.chatIconBtn, { borderColor: theme.border }]}>
                                        <Ionicons name="chatbubble-outline" size={20} color={theme.primary} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
        paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    
    searchContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
    searchWrapper: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', 
        borderRadius: 12, paddingHorizontal: 16, height: 44
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1e293b', fontWeight: '500' },

    listContent: { paddingHorizontal: 16, paddingBottom: 40 },
    chatItem: { flexDirection: 'row', paddingVertical: 12, alignItems: 'center' },
    avatarContainer: { width: 56, height: 56, marginRight: 16 },
    avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    avatarEmoji: { fontSize: 28 },
    onlineDot: { 
        position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, 
        borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 3, borderColor: 'white' 
    },
    chatInfo: { flex: 1 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    chatName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    chatTime: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
    chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    lastMsg: { fontSize: 14, color: '#64748b', flex: 1, marginRight: 10 },
    lastMsgUnread: { color: '#1e293b', fontWeight: '800' },
    unreadBadge: { backgroundColor: '#ef4444', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
    unreadText: { color: 'white', fontSize: 11, fontWeight: '900' },
    
    emptyContainer: { alignItems: 'center', marginTop: 20, paddingHorizontal: 40, marginBottom: 20 },
    emptyText: { fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
    
    sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, marginTop: 10 },
    footerSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 24 },
    teacherItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatarMini: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
    avatarImgSmall: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    avatarEmojiSmall: { fontSize: 24 },
    teacherInfo: { flex: 1 },
    teacherName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    teacherRole: { fontSize: 13, color: '#94a3b8', marginTop: 1 },
    chatIconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    
    startChatBtn: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe'
    },
    startChatText: {
        color: '#3b82f6',
        fontWeight: '700',
        fontSize: 15
    }
});
