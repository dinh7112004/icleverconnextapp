import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Keyboard,
  Image,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import EventSource from 'react-native-sse';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiApi } from '../services/api';
import apiClient from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  image?: string; // Base64
}

export default function AIScreen() {
    const { isDark, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<{ uri: string, base64: string | undefined } | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const sseRef = useRef<EventSource | null>(null);

    useEffect(() => {
        loadHistory();
        return () => {
            if (sseRef.current) sseRef.current.close();
        };
    }, []);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Quyền truy cập', 'Bạn cần cho phép truy cập thư viện ảnh để sử dụng tính năng này.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setSelectedImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 || undefined });
        }
    };

    const loadHistory = async () => {
        try {
            const res = await aiApi.getHistory(20);
            const history = Array.isArray(res.data.data) ? [...res.data.data].reverse() : 
                            Array.isArray(res.data) ? [...res.data].reverse() : [];

            const formattedMessages: Message[] = [];
            history.forEach((chat: any) => {
                formattedMessages.push({ id: `user-${chat.id}`, role: 'user', text: chat.prompt });
                formattedMessages.push({ id: `ai-${chat.id}`, role: 'ai', text: chat.answer });
            });
            setMessages(formattedMessages);
        } catch (error) {
            console.log('[AI] Lỗi tải lịch sử:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleSend = async (textToSend?: string) => {
        const text = textToSend || inputText;
        if ((!text.trim() && !selectedImage) || isTyping) return;

        const userMsg: Message = { 
            id: Date.now().toString(), 
            role: 'user', 
            text: text,
            image: selectedImage?.uri 
        };
        setMessages((prev) => [...prev, userMsg]);
        
        const currentImageBase64 = selectedImage?.base64;
        setSelectedImage(null);
        setInputText('');
        setIsTyping(true);
        Keyboard.dismiss();

        const aiMessageId = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { id: aiMessageId, role: 'ai', text: '' }]);

        try {
            const token = await AsyncStorage.getItem('userToken');
            const baseUrl = apiClient.defaults.baseURL || 'http://localhost:3000/api/v1';
            const url = `${baseUrl}/ai/ask`;

            sseRef.current = new EventSource(url, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                method: 'POST',
                body: JSON.stringify({ 
                    prompt: userMsg.text,
                    image: currentImageBase64,
                    mimeType: 'image/jpeg'
                }),
                pollingInterval: 0,
            });

            sseRef.current.addEventListener('message', (event: any) => {
                if (event.data === '[DONE]') {
                    setIsTyping(false);
                    if (sseRef.current) sseRef.current.close();
                    return;
                }
                if (event.data) {
                    try {
                        const parsed = JSON.parse(event.data);
                        if (parsed.text) {
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === aiMessageId ? { ...msg, text: msg.text + parsed.text } : msg
                                )
                            );
                        } else if (parsed.error) {
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === aiMessageId ? { ...msg, text: "Xin lỗi, đã xảy ra lỗi (có thể chưa cấu hình API Key)." } : msg
                                )
                            );
                            setIsTyping(false);
                            if (sseRef.current) sseRef.current.close();
                        }
                    } catch (e) {}
                }
            });

            sseRef.current.addEventListener('done' as any, () => {
                setIsTyping(false);
                if (sseRef.current) sseRef.current.close();
            });

            sseRef.current.addEventListener('error', (event) => {
                console.log('[AI] SSE Error:', event);
                setIsTyping(false);
                if (sseRef.current) sseRef.current.close();
            });

        } catch (error) {
            setIsTyping(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';
        if (isUser) {
            return (
                <View style={[styles.messageRow, styles.messageRowUser]}>
                    <View style={[styles.userMessageBubble, { backgroundColor: theme.primary }]}>
                        {item.image && (
                            <Image source={{ uri: item.image }} style={styles.messageImage} />
                        )}
                        <Text style={[styles.messageText, { color: '#FFF' }]}>{item.text}</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.messageRow}>
                <View style={[styles.aiMessageBubble, { backgroundColor: theme.surface }]}>
                    <View style={styles.aiLabelRow}>
                        <Ionicons name="sparkles" size={14} color="#f39c12" />
                        <Text style={[styles.aiLabel, { color: theme.textSecondary }]}>ICLEVER AI</Text>
                    </View>
                    <Text style={[styles.messageText, { color: theme.text }]}>
                        {item.text || 'Đang suy nghĩ...'}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            {/* --- AI HEADER --- */}
            <View style={[styles.aiHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <View style={styles.headerLeft}>
                    <View style={[styles.robotIconBox, { backgroundColor: theme.primary }]}>
                        <MaterialCommunityIcons name="robot-happy" size={24} color="white" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                        <Text style={[styles.aiTitle, { color: theme.text }]}>Trợ lý iClever AI</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.activeDot} />
                            <Text style={styles.statusText}>Đang hoạt động</Text>
                        </View>
                    </View>
                </View>
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={{ flex: 1 }}>
                    {isLoadingHistory ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={(item) => item.id}
                            renderItem={renderMessage}
                            contentContainerStyle={[styles.chatContainer, { paddingBottom: 20 }]}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons name="robot-outline" size={60} color={theme.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
                                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                        Chào bạn! Tôi là trợ lý ảo iClever AI. Tôi có thể giúp gì cho bạn hôm nay?
                                    </Text>
                                    
                                    <View style={styles.suggestedActions}>
                                        <Text style={[styles.suggestedTitle, { color: theme.textSecondary }]}>Gợi ý:</Text>
                                        <TouchableOpacity onPress={() => handleSend("Hôm nay có lịch học gì không?")} style={[styles.suggestedBtn, { backgroundColor: isDark ? '#2D3748' : 'rgba(59, 89, 152, 0.05)', borderColor: isDark ? '#334155' : 'rgba(59, 89, 152, 0.1)' }]}>
                                            <Text style={[styles.suggestedBtnText, { color: theme.primary }]}>Hôm nay có lịch học gì không?</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleSend("Hướng dẫn giải bài tập Toán")} style={[styles.suggestedBtn, { backgroundColor: isDark ? '#2D3748' : 'rgba(59, 89, 152, 0.05)', borderColor: isDark ? '#334155' : 'rgba(59, 89, 152, 0.1)' }]}>
                                            <Text style={[styles.suggestedBtnText, { color: theme.primary }]}>Hướng dẫn giải bài tập Toán</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            }
                        />
                    )}
                </View>

                {/* --- INPUT AREA --- */}
                <View style={{ backgroundColor: theme.surface, paddingBottom: insets.bottom || 10 }}>
                    {selectedImage && (
                        <View style={[styles.imagePreviewContainer, { borderTopColor: theme.border }]}>
                            <View style={styles.imageWrapper}>
                                <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                                <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
                                    <Ionicons name="close-circle" size={24} color="#e74c3c" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    <View style={[styles.inputArea, { borderTopColor: theme.border }]}>
                        <TouchableOpacity style={styles.attachBtn} onPress={pickImage} disabled={isTyping}>
                            <Ionicons name="image-outline" size={28} color={theme.primary} />
                        </TouchableOpacity>
                        <View style={[styles.inputBox, { backgroundColor: isDark ? '#2D3748' : '#f1f2f6' }]}>
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="Hỏi trợ lý iClever..."
                                placeholderTextColor={theme.textSecondary}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                maxLength={500}
                                editable={!isTyping}
                            />
                        </View>
                        <TouchableOpacity 
                            style={[styles.sendBtn, { backgroundColor: theme.primary }, (!inputText.trim() && !selectedImage) || isTyping ? { opacity: 0.5 } : {}]}
                            onPress={() => handleSend()}
                            disabled={(!inputText.trim() && !selectedImage) || isTyping}
                        >
                            <Ionicons name="send" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    aiHeader: {
        height: 64,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    robotIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    aiTitle: { fontSize: 17, fontWeight: 'bold' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ecc71', marginRight: 6 },
    statusText: { fontSize: 12, color: '#2ecc71', fontWeight: '500' },
    
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chatContainer: { padding: 15 },
    messageRow: { marginBottom: 16, alignItems: 'flex-start' },
    messageRowUser: { alignItems: 'flex-end' },
    
    aiMessageBubble: {
        padding: 15,
        borderRadius: 18,
        borderTopLeftRadius: 4,
        maxWidth: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    userMessageBubble: {
        padding: 15,
        borderRadius: 18,
        borderTopRightRadius: 4,
        maxWidth: '85%',
    },
    aiLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    aiLabel: { fontSize: 10, fontWeight: 'bold', marginLeft: 4, letterSpacing: 0.5 },
    messageText: { fontSize: 15, lineHeight: 22 },
    messageImage: {
        width: 220,
        height: 160,
        borderRadius: 12,
        marginBottom: 8,
        resizeMode: 'cover',
    },
    
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 15, textAlign: 'center', marginHorizontal: 30, marginBottom: 30 },
    suggestedActions: { width: '100%', marginTop: 20 },
    suggestedTitle: { fontSize: 13, marginBottom: 12, fontWeight: '500', textAlign: 'center' },
    suggestedBtn: { 
        paddingVertical: 12, 
        paddingHorizontal: 20, 
        borderRadius: 20, 
        marginBottom: 10,
        borderWidth: 1,
    },
    suggestedBtnText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },

    imagePreviewContainer: {
        paddingHorizontal: 15,
        paddingTop: 10,
        borderTopWidth: 1,
    },
    imageWrapper: {
        width: 70,
        height: 70,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    removeImageBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    inputBox: { 
        flex: 1, 
        borderRadius: 24, 
        minHeight: 44,
        maxHeight: 120,
        justifyContent: 'center', 
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 10 : 6
    },
    input: { fontSize: 15, flex: 1 },
    attachBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    sendBtn: { 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginLeft: 8
    },
});