import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Image, FlatList, Dimensions, TextInput, Share, Alert, KeyboardAvoidingView, Platform, RefreshControl
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { newsApi, studentApi, userApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Memoized Activity Item for performance
const ActivityItem = React.memo(({ item, currentUser, theme, isDark, onLike, onComment, onShare, commentText, onCommentTextChange, expanded, onToggleComments, imageError, onImageError, getRoleLabel }: any) => {
    const isLiked = useMemo(() => {
        const currentId = currentUser?.id || currentUser?._id;
        return item.likes && currentId && item.likes.includes(currentId);
    }, [item.likes, currentUser]);

    const likesCount = item.likes?.length || 0;

    return (
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <View style={styles.headerInfo}>
                    <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#2D3748' : '#ebf4ff' }]}>
                        <MaterialCommunityIcons name="school" size={20} color={theme.primary} />
                    </View>
                    <View>
                        <Text style={[styles.sourceName, { color: theme.text }]}>{item.data?.sourceName || 'Trường Tiểu học Ngôi Sao'}</Text>
                        <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>
                            {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </Text>
                    </View>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: isDark ? '#1e3a8a' : '#e1f5fe' }]}>
                    <Text style={[styles.categoryText, { color: isDark ? '#93c5fd' : '#039be5' }]}>{item.type === 'news' ? 'HOẠT ĐỘNG TRƯỜNG' : 'HOẠT ĐỘNG LỚP'}</Text>
                </View>
            </View>

            {/* Content */}
            <View style={styles.contentArea}>
                <Text style={[styles.titleText, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.bodyText, { color: theme.textSecondary }]}>{item.message}</Text>
            </View>

            {/* Image Section */}
            <View style={styles.mediaContainer}>
                {item.data?.imageUrl && !imageError ? (
                    <Image 
                        source={{ uri: item.data.imageUrl }} 
                        style={styles.mainImage}
                        resizeMode="cover"
                        onError={onImageError}
                    />
                ) : (
                    <View style={[styles.mainImage, styles.placeholderImage, { backgroundColor: theme.primary }]}>
                        <View style={styles.placeholderOverlay}>
                            <MaterialCommunityIcons name="school-outline" size={80} color="rgba(255,255,255,0.4)" />
                            <Text style={styles.placeholderText}>iClever Connection</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Interaction Row */}
            <View style={styles.interactionRow}>
                <View style={styles.likesCountRow}>
                    <Ionicons name="heart" size={16} color="#ef4444" />
                    <Text style={[styles.interactionText, { color: theme.textSecondary }]}>{likesCount} yêu thích</Text>
                </View>
                <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => onLike(item._id)}>
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#ff4757" : theme.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginHorizontal: 15 }} onPress={() => onToggleComments(item._id)}>
                        <Ionicons name="chatbubble-outline" size={22} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onShare(item)}>
                        <Ionicons name="share-social-outline" size={22} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Comments Section (Toggleable) */}
            {expanded && (
                <View style={[styles.commentsListArea, { borderTopColor: theme.border }]}>
                    {item.comments && item.comments.length > 0 ? (
                        <View style={styles.commentItems}>
                            {item.comments.map((c: any, index: number) => (
                                <View key={index} style={styles.commentEntry}>
                                    <View style={[styles.commentAvatarMini, { backgroundColor: theme.primary }]}>
                                        <Text style={styles.commentAvatarText}>{c.userName?.[0] || 'U'}</Text>
                                    </View>
                                    <View style={[styles.commentBubble, { backgroundColor: isDark ? '#2D3748' : '#f0f2f5' }]}>
                                        <Text style={[styles.commentName, { color: theme.text }]}>{c.userName}</Text>
                                        <Text style={[styles.commentBody, { color: theme.text }]}>{c.content}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={[styles.noCommentsText, { color: theme.textSecondary }]}>Chưa có bình luận nào.</Text>
                    )}

                    <View style={styles.commentInputRow}>
                        <View style={[styles.commentInputBox, { backgroundColor: isDark ? '#2D3748' : 'white', borderColor: theme.border }]}>
                            <TextInput
                                style={[styles.commentInputField, { color: theme.text }]}
                                placeholder="Viết bình luận..."
                                placeholderTextColor={theme.textSecondary}
                                value={commentText}
                                onChangeText={onCommentTextChange}
                            />
                            <TouchableOpacity onPress={() => onComment(item._id)} disabled={!commentText.trim()}>
                                <Ionicons 
                                    name="paper-plane-outline" 
                                    size={20} 
                                    color={commentText.trim() ? theme.primary : (isDark ? '#475569' : '#bdc3c7')} 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
});

const CACHE_KEY = 'activities_cache_';

export default function ActivitiesScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'class' | 'school'>('school');
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    const loadInitialData = useCallback(async () => {
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
                
                // Background update profile
                userApi.getProfile().then(res => {
                    const freshUser = res.data.data || res.data;
                    if (freshUser) {
                        setCurrentUser(freshUser);
                        AsyncStorage.setItem('user', JSON.stringify(freshUser));
                    }
                }).catch(() => {});

                const studentRes = await studentApi.getProfile();
                setStudentInfo(studentRes.data.data || studentRes.data);
            }
        } catch (error) {}
    }, []);

    const fetchActivities = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            // Load from cache first
            const cacheKey = `${CACHE_KEY}${activeTab}`;
            if (!isRefresh) {
                const cached = await AsyncStorage.getItem(cacheKey);
                if (cached) {
                    setActivities(JSON.parse(cached));
                    setLoading(false);
                }
            }

            const params: any = { type: activeTab === 'school' ? 'news' : 'activity' };
            if (activeTab === 'class' && studentInfo?.currentClassId) params.classId = studentInfo.currentClassId;

            const response = await newsApi.getAll(params);
            let data = response.data;
            while (data.data && !Array.isArray(data)) data = data.data;
            let list = Array.isArray(data) ? data : [];
            
            setActivities(list);
            AsyncStorage.setItem(cacheKey, JSON.stringify(list));
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab, studentInfo?.currentClassId]);

    useFocusEffect(
        useCallback(() => {
            loadInitialData();
            fetchActivities();
        }, [loadInitialData, fetchActivities])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchActivities(true);
    };

    const handleLike = async (id: string) => {
        const item = activities.find(a => a._id === id);
        if (item?.isMock) return;

        const currentId = currentUser?.id || currentUser?._id;
        if (!currentId) return;

        // Optimistic update
        setActivities(prev => prev.map(a => {
            if (a._id === id) {
                const likes = a.likes || [];
                const isLiked = likes.includes(currentId);
                const newLikes = isLiked ? likes.filter((l: string) => l !== currentId) : [...likes, currentId];
                return { ...a, likes: newLikes };
            }
            return a;
        }));

        try {
            const response = await newsApi.like(id);
            const updated = response.data.data || response.data;
            if (updated) {
                setActivities(prev => {
                    const newList = prev.map(a => a._id === id ? { ...a, likes: updated.likes } : a);
                    AsyncStorage.setItem(`${CACHE_KEY}${activeTab}`, JSON.stringify(newList));
                    return newList;
                });
            }
        } catch (error) {
            onRefresh();
        }
    };

    const handleCommentSubmit = async (id: string) => {
        const commentText = commentTexts[id];
        if (!commentText?.trim()) return;

        const userId = currentUser?.id || currentUser?._id;
        if (!userId) return;

        const newComment = {
            userId: userId,
            userName: currentUser.fullName || 'Bạn',
            content: commentText.trim(),
            createdAt: new Date().toISOString(),
        };
        
        setActivities(prev => prev.map(act => act._id === id ? { ...act, comments: [...(act.comments || []), newComment] } : act));
        setCommentTexts(prev => ({ ...prev, [id]: '' }));

        try {
            const response = await newsApi.comment(id, commentText.trim(), currentUser.fullName, currentUser.avatarUrl, currentUser.role);
            const updated = response.data.data || response.data;
            if (updated) {
                setActivities(prev => {
                    const newList = prev.map(a => a._id === id ? { ...a, comments: updated.comments } : a);
                    AsyncStorage.setItem(`${CACHE_KEY}${activeTab}`, JSON.stringify(newList));
                    return newList;
                });
            }
        } catch (error) {
            onRefresh();
        }
    };

    const handleShare = async (item: any) => {
        try {
            await Share.share({ title: item.title, message: `${item.title}\n\n${item.message}` });
        } catch (error) {}
    };

    const getRoleLabel = (role?: string) => {
        if (!role) return 'Người dùng';
        const r = role.toUpperCase();
        if (r.includes('TEACHER')) return 'Giáo viên';
        if (r === 'STUDENT') return 'Học sinh';
        if (r === 'PARENT') return 'Phụ huynh';
        return 'Nhà trường';
    };

    const renderItem = useCallback(({ item }: any) => (
        <ActivityItem 
            item={item}
            currentUser={currentUser}
            theme={theme}
            isDark={isDark}
            onLike={handleLike}
            onComment={handleCommentSubmit}
            onShare={handleShare}
            commentText={commentTexts[item._id] || ''}
            onCommentTextChange={(t: string) => setCommentTexts(prev => ({ ...prev, [item._id]: t }))}
            expanded={expandedComments[item._id]}
            onToggleComments={(id: string) => setExpandedComments(prev => ({ ...prev, [id]: !prev[id] }))}
            imageError={imageErrors[item._id]}
            onImageError={() => setImageErrors(prev => ({ ...prev, [item._id]: true }))}
            getRoleLabel={getRoleLabel}
        />
    ), [currentUser, theme, isDark, handleLike, handleCommentSubmit, handleShare, commentTexts, expandedComments, imageErrors]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.screenHeader, { backgroundColor: theme.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={28} color={theme.text} /></TouchableOpacity>
                <Text style={[styles.screenTitle, { color: theme.text }]}>Hoạt động</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={[styles.tabsRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity style={[styles.tabItem, activeTab === 'class' && [styles.tabItemActive, { borderBottomColor: theme.primary }]]} onPress={() => setActiveTab('class')}>
                    <Ionicons name="people-outline" size={20} color={activeTab === 'class' ? theme.primary : theme.textSecondary} />
                    <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'class' && [styles.tabTextActive, { color: theme.primary }]]}>Hoạt động lớp</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabItem, activeTab === 'school' && [styles.tabItemActive, { borderBottomColor: theme.primary }]]} onPress={() => setActiveTab('school')}>
                    <Ionicons name="business-outline" size={20} color={activeTab === 'school' ? theme.primary : theme.textSecondary} />
                    <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'school' && [styles.tabTextActive, { color: theme.primary }]]}>Hoạt động trường</Text>
                </TouchableOpacity>
            </View>

            {loading && activities.length === 0 ? (
                <View style={styles.loadingCenter}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : (
                <FlatList
                    data={activities}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    removeClippedSubviews={true}
                    initialNumToRender={5}
                    maxToRenderPerBatch={5}
                    windowSize={5}
                    updateCellsBatchingPeriod={30}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="newspaper-variant-outline" size={60} color={isDark ? '#2D3748' : '#dfe6e9'} />
                            <Text style={[styles.emptyLabel, { color: theme.textSecondary }]}>Chưa có hoạt động mới nào.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    screenHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    screenTitle: { fontSize: 18, fontWeight: '700' },
    tabsRow: { flexDirection: 'row', borderBottomWidth: 1 },
    tabItem: { flex: 1, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabItemActive: { borderBottomColor: '#3498db' },
    tabText: { marginLeft: 8, fontSize: 14, fontWeight: '600' },
    tabTextActive: { color: '#3498db' },
    card: { borderRadius: 15, marginBottom: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardHeader: { flexDirection: 'row', padding: 12, alignItems: 'center', justifyContent: 'space-between' },
    headerInfo: { flexDirection: 'row', alignItems: 'center' },
    avatarCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    sourceName: { fontSize: 15, fontWeight: '700' },
    timeLabel: { fontSize: 11, marginTop: 2 },
    categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    categoryText: { fontSize: 9, fontWeight: '800' },
    contentArea: { paddingHorizontal: 12, paddingBottom: 12 },
    titleText: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
    bodyText: { fontSize: 14, lineHeight: 21 },
    mediaContainer: { width: '100%', height: 240, backgroundColor: '#f0f2f5' },
    mainImage: { width: '100%', height: '100%' },
    placeholderImage: { justifyContent: 'center', alignItems: 'center' },
    placeholderOverlay: { alignItems: 'center' },
    placeholderText: { color: 'white', fontWeight: '900', fontSize: 24, marginTop: 10, letterSpacing: 2 },
    interactionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
    likesCountRow: { flexDirection: 'row', alignItems: 'center' },
    interactionText: { fontSize: 13, marginLeft: 6 },
    actionButtons: { flexDirection: 'row', alignItems: 'center' },
    commentsListArea: { padding: 12, borderTopWidth: 1 },
    commentItems: { marginBottom: 12 },
    commentEntry: { flexDirection: 'row', marginBottom: 10 },
    commentAvatarMini: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    commentAvatarText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    commentBubble: { flex: 1, padding: 10, borderRadius: 12 },
    commentName: { fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
    commentBody: { fontSize: 13 },
    noCommentsText: { textAlign: 'center', fontSize: 13, marginVertical: 10 },
    commentInputRow: { marginTop: 8 },
    commentInputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, height: 40 },
    commentInputField: { flex: 1, fontSize: 14 },
    emptyBox: { alignItems: 'center', marginTop: 100 },
    emptyLabel: { marginTop: 12, fontSize: 15 }
});
