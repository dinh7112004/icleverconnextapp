import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, Text, View, TextInput, FlatList,
    TouchableOpacity, ActivityIndicator,
    KeyboardAvoidingView, Platform, Keyboard, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import moment from 'moment';

export default function ChatDetailScreen({ route, navigation }: any) {
    const { isDark, theme } = useTheme();
    const { t } = useLanguage();
    const insets = useSafeAreaInsets();
    const { otherUser, studentId } = route.params;
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await chatApi.getConversation(otherUser.id, studentId);
            const rawMessages = response.data.data;
            
            const formattedMessages = rawMessages.map((m: any) => ({
                id: m.id,
                text: m.body,
                time: moment(m.created_at).format('HH:mm'),
                senderType: m.senderId === otherUser.id ? 'teacher' : 'parent'
            }));
            
            setMessages(formattedMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const text = inputText.trim();
        setInputText('');

        const tempId = `temp_${Date.now()}`;
        const newMessage = {
            id: tempId,
            text: text,
            time: moment().format('HH:mm'),
            senderType: 'parent'
        };

        setMessages(prev => [...prev, newMessage]);
        
        try {
            await chatApi.sendMessage(otherUser.id, text, studentId);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }

        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isParent = item.senderType === 'parent';
        return (
            <View style={[styles.messageWrapper, isParent ? styles.parentWrapper : styles.teacherWrapper]}>
                <View style={[
                    styles.bubble, 
                    isParent ? [styles.parentBubble, { backgroundColor: isDark ? '#3b82f6' : '#3498db' }] : [styles.teacherBubble, { backgroundColor: theme.surface }]
                ]}>
                    <Text style={[styles.messageText, isParent ? styles.parentText : [styles.teacherText, { color: theme.text }]]}>
                        {item.text}
                    </Text>
                </View>
                <Text style={[styles.messageTime, { color: theme.textSecondary, alignSelf: isParent ? 'flex-end' : 'flex-start' }]}>
                    {item.time}
                </Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color={theme.text} />
                    </TouchableOpacity>
                    <View style={[styles.avatarMini, { backgroundColor: isDark ? '#2D3748' : '#f0f0f0' }]}>
                        {otherUser?.avatarUrl ? (
                            <Image source={{ uri: otherUser.avatarUrl }} style={styles.avatarImgMini} />
                        ) : (
                            <Text style={[styles.avatarEmojiMini, { color: theme.textSecondary }]}>
                                {otherUser?.fullName?.charAt(0) || '💬'}
                            </Text>
                        )}
                        <View style={[styles.onlineDotMini, { borderColor: theme.surface }]} />
                    </View>
                    <View style={styles.contactInfo}>
                        <Text style={[styles.headerName, { color: theme.text }]}>{otherUser?.fullName}</Text>
                        <Text style={styles.headerStatus}>{t('chat.activeNow')}</Text>
                    </View>
                </View>
                <TouchableOpacity style={[styles.callHeaderBtn, { backgroundColor: isDark ? '#064e3b' : '#e8f7ed' }]}>
                    <Ionicons name="call" size={20} color="#2ecc71" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={{ flex: 1 }}>
                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={(item) => item.id}
                            renderItem={renderMessage}
                            contentContainerStyle={[styles.messageList, { paddingBottom: 20 }]}
                            showsVerticalScrollIndicator={false}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                        />
                    )}
                </View>

                {/* Input Area */}
                <View style={{ backgroundColor: theme.surface, paddingBottom: insets.bottom || 12 }}>
                    <View style={[styles.inputArea, { borderTopColor: theme.border }]}>
                        <TouchableOpacity style={styles.attachBtn}>
                            <Ionicons name="add-circle-outline" size={30} color={theme.primary} />
                        </TouchableOpacity>
                        <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#2D3748' : '#f1f3f6' }]}>
                            <TextInput
                                style={[styles.input, { color: theme.text, maxHeight: 120 }]}
                                placeholder={t('chat.inputPlaceholder')}
                                placeholderTextColor={theme.textSecondary}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.sendBtn, { backgroundColor: theme.primary }, !inputText.trim() && { opacity: 0.5 }]}
                            onPress={handleSend}
                            disabled={!inputText.trim()}
                        >
                            <Ionicons name="send" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 64,
        borderBottomWidth: 1,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { marginRight: 8, padding: 4 },
    avatarMini: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
    avatarImgMini: { width: 38, height: 38, borderRadius: 19 },
    avatarEmojiMini: { fontSize: 18, fontWeight: 'bold' },
    onlineDotMini: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#2ecc71', borderWidth: 2 },
    contactInfo: { justifyContent: 'center' },
    headerName: { fontSize: 16, fontWeight: 'bold' },
    headerStatus: { fontSize: 12, color: '#2ecc71', fontWeight: '500' },
    callHeaderBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },

    messageList: { padding: 16 },
    messageWrapper: { marginBottom: 16, maxWidth: '85%' },
    parentWrapper: { alignSelf: 'flex-end' },
    teacherWrapper: { alignSelf: 'flex-start' },
    bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
    parentBubble: { borderBottomRightRadius: 4 },
    teacherBubble: { borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    messageText: { fontSize: 15, lineHeight: 22 },
    parentText: { color: 'white' },
    teacherText: { color: '#2c3e50' },
    messageTime: { fontSize: 10, marginTop: 4 },

    inputArea: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    attachBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    inputWrapper: { 
        flex: 1, 
        borderRadius: 22, 
        paddingHorizontal: 16, 
        paddingVertical: Platform.OS === 'ios' ? 10 : 6, 
        marginHorizontal: 4, 
        justifyContent: 'center'
    },
    input: { fontSize: 15, padding: 0 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
});
