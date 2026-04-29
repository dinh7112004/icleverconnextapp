import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Image, SafeAreaView, Keyboard
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { newsApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi', {
    relativeTime: {
        future: '%s tới',
        past: '%s trước',
        s: 'vài giây',
        ss: '%d giây',
        m: '1 phút',
        mm: '%d phút',
        h: '1 giờ',
        hh: '%d giờ',
        d: '1 ngày',
        dd: '%d ngày',
        w: '1 tuần',
        ww: '%d tuần',
        M: '1 tháng',
        MM: '%d tháng',
        y: '1 năm',
        yy: '%d năm'
    }
});

export default function CommentScreen({ route, navigation }: any) {
    const { activityId, initialComments } = route.params;
    const { isDark, theme } = useTheme();
    const [comments, setComments] = useState<any[]>(initialComments || []);
    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadUser();
        fetchFreshComments();
    }, []);

    const loadUser = async () => {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));
    };

    const fetchFreshComments = async () => {
        try {
            setLoading(true);
            const response = await newsApi.getOne(activityId); 
            let data = response.data.data || response.data;
            if (data && data.comments) {
                setComments(data.comments);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!commentText.trim() || !currentUser) return;

        const text = commentText.trim();
        setCommentText('');
        Keyboard.dismiss();

        // Optimistic update
        const tempComment = {
            id: Date.now().toString(),
            userName: currentUser.fullName || 'Bạn',
            content: text,
            createdAt: new Date().toISOString(),
            isTemp: true
        };
        setComments(prev => [...prev, tempComment]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const response = await newsApi.comment(
                activityId, 
                text, 
                currentUser.fullName, 
                currentUser.avatarUrl, 
                currentUser.role
            );
            const updated = response.data.data || response.data;
            if (updated && updated.comments) {
                setComments(updated.comments);
            }
        } catch (error) {
            alert('Không thể gửi bình luận. Vui lòng thử lại.');
            setComments(prev => prev.filter(c => !c.isTemp));
        }
    };

    const renderCommentItem = ({ item }: any) => (
        <View style={styles.commentRow}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
                ) : (
                    <Text style={styles.avatarText}>{item.userName?.[0]?.toUpperCase() || 'U'}</Text>
                )}
            </View>
            <View style={styles.commentContentBox}>
                <View style={[styles.commentBubble, { backgroundColor: isDark ? '#2D3748' : '#f0f2f5' }]}>
                    <Text style={[styles.commentName, { color: theme.text }]}>{item.userName}</Text>
                    <Text style={[styles.commentText, { color: theme.text }]}>{item.content}</Text>
                </View>
                <Text style={[styles.commentTime, { color: theme.textSecondary }]}>
                    {moment(item.createdAt).fromNow()}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Bình luận</Text>
                <View style={{ width: 44 }} />
            </View>

            {loading && comments.length === 0 ? (
                <View style={styles.center}><ActivityIndicator color={theme.primary} /></View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={comments}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    renderItem={renderCommentItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="comment-outline" size={60} color={theme.border} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Hãy là người đầu tiên bình luận</Text>
                        </View>
                    }
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={[styles.inputArea, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                    <View style={[styles.inputContainer, { backgroundColor: isDark ? '#2D3748' : '#f0f2f5' }]}>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Viết bình luận..."
                            placeholderTextColor={theme.textSecondary}
                            value={commentText}
                            onChangeText={setCommentText}
                            multiline
                        />
                        <TouchableOpacity 
                            onPress={handleSubmit} 
                            disabled={!commentText.trim()}
                            style={[styles.sendBtn, { opacity: commentText.trim() ? 1 : 0.5 }]}
                        >
                            <Ionicons name="send" size={20} color={theme.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, paddingHorizontal: 8 },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 17, fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 30 },
    commentRow: { flexDirection: 'row', marginBottom: 16 },
    avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10, overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    avatarText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    commentContentBox: { flex: 1 },
    commentBubble: { padding: 10, borderRadius: 15, alignSelf: 'flex-start', maxWidth: '100%' },
    commentName: { fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
    commentText: { fontSize: 14, lineHeight: 18 },
    commentTime: { fontSize: 11, marginTop: 4, marginLeft: 4 },
    inputArea: { padding: 10, borderTopWidth: 1 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, maxHeight: 100 },
    input: { flex: 1, fontSize: 15, paddingVertical: 4 },
    sendBtn: { marginLeft: 10, padding: 4 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 12, fontSize: 15 }
});
