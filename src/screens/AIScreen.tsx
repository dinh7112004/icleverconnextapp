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
  Alert,
  ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import EventSource from 'react-native-sse';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiApi, studentApi, academicApi } from '../services/api';
import apiClient from '../services/api';
import { userCache } from '../services/userCache';

const BOT_AVATAR = require('../../assets/ai/bot_avatar.jpg');

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
    const [systemPrompt, setSystemPrompt] = useState<string>('');
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [smartSuggestions, setSmartSuggestions] = useState<string[]>([
        'Hôm nay có lịch học gì không?',
        'Hướng dẫn giải bài tập Toán',
    ]);
    const flatListRef = useRef<FlatList>(null);
    const sseRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', () => {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });
        
        loadHistory();
        loadStudentContext();
        return () => {
            if (sseRef.current) sseRef.current.close();
            showSub.remove();
        };
    }, []);

    // ─── Build context từ data thật của học sinh ────────────────────
    const loadStudentContext = async () => {
        try {
            const cachedUser = userCache.getUser();
            if (!cachedUser) return;

            const studentId = cachedUser._id || cachedUser.id || '';
            const classId = cachedUser.classId || cachedUser.class?._id || '';
            const fullName = cachedUser.fullName || 'học sinh';
            const className = cachedUser.className || cachedUser.class?.name || '';

            // Lấy điểm số và thời khoá biểu song song
            const [gradesRes, timetableRes] = await Promise.allSettled([
                studentId ? academicApi.getGrades(studentId) : Promise.reject('no id'),
                classId ? academicApi.getTimetable(classId) : Promise.reject('no classId'),
            ]);

            // Xử lý điểm số
            let gradesText = '';
            let weakSubjects: string[] = [];
            if (gradesRes.status === 'fulfilled') {
                const grades = gradesRes.value.data?.data || gradesRes.value.data || [];
                if (Array.isArray(grades) && grades.length > 0) {
                    gradesText = grades
                        .slice(0, 8)
                        .map((g: any) => `  - ${g.subjectName || g.subject}: ${g.averageScore ?? g.score ?? 'chưa có'}`)
                        .join('\n');
                    weakSubjects = grades
                        .filter((g: any) => (g.averageScore ?? g.score ?? 10) < 7)
                        .map((g: any) => g.subjectName || g.subject);
                }
            }

            // Xử lý thời khoá biểu hôm nay
            const today = new Date();
            const dayOfWeek = today.getDay();
            const dayFullNames: Record<number, string> = {
                0: 'Chủ Nhật', 1: 'Thứ Hai', 2: 'Thứ Ba',
                3: 'Thứ Tư', 4: 'Thứ Năm', 5: 'Thứ Sáu', 6: 'Thứ Bảy'
            };
            const todayNameFull = dayFullNames[dayOfWeek];

            let todayScheduleText = '';
            let todaySubjects: string[] = [];

            if (timetableRes.status === 'fulfilled') {
                const timetableData = timetableRes.value.data?.data || timetableRes.value.data || [];
                const dayNames: Record<number, string> = {
                    0: 'Chủ Nhật', 1: 'Thứ 2', 2: 'Thứ 3',
                    3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7'
                };
                const todayName = dayNames[dayOfWeek];

                const todaySlots = Array.isArray(timetableData)
                    ? timetableData.filter((slot: any) =>
                        slot.dayOfWeek === todayName ||
                        slot.day === todayName
                    )
                    : [];

                if (todaySlots.length > 0) {
                    todayScheduleText = todaySlots
                        .map((s: any) => `  - Tiết ${s.period || s.slot || ''}: ${s.subjectName || s.subject} (GV: ${s.teacherName || s.teacher || 'N/A'})`)
                        .join('\n');
                    todaySubjects = todaySlots.map((s: any) => s.subjectName || s.subject);
                } else {
                    todayScheduleText = '  Hôm nay không có lịch học.';
                }
            }

            // Build system prompt
            const now = new Date();
            const dateStr = `${todayNameFull}, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

            const prompt = `NHIỆM VỤ QUAN TRỌNG: Tuyệt đối KHÔNG sử dụng bất kỳ biểu tượng cảm xúc (emoji), icon, hoặc ký tự hình ảnh nào trong câu trả lời. Chỉ sử dụng văn bản thuần túy.
LƯU Ý: Hôm nay là ${todayNameFull} (${dateStr}). Bạn phải trả lời đúng lịch học của ngày này.

Bạn là trợ lý AI thông minh tích hợp trong ứng dụng "iClever Connect", chuyên hỗ trợ học sinh và phụ huynh.
Bạn có kiến thức sâu rộng về toàn bộ tính năng của ứng dụng này.

Cấu trúc và tính năng của ứng dụng iClever:
1. Học tập:
   - Thời khóa biểu (Timetable): Xem lịch học theo ngày và theo tuần.
   - Kết quả học tập (Grades): Theo dõi điểm số chi tiết, điểm trung bình và xếp loại học lực.
   - Bài tập (Homework): Xem danh sách bài tập về nhà và nộp bài trực tiếp.
   - Bài học (Curriculum): Kho học liệu, bài giảng và bài tập trắc nghiệm (Quiz) theo môn học.
2. Tiện ích hàng ngày:
   - Điểm danh (Attendance): Theo dõi trạng thái đi học, đến muộn hoặc vắng mặt.
   - Thực đơn (Canteen Menu): Xem thực đơn bán trú hàng ngày/hàng tuần.
   - Xe đưa đón (School Bus): Thông tin tuyến xe và định vị xe bus.
   - Học phí (Tuition): Theo dõi tình trạng học phí và các khoản phí cần nộp.
3. Liên lạc & Sức khỏe:
   - Xin nghỉ phép (Leave Request): Gửi đơn xin nghỉ phép đến giáo viên.
   - Dặn thuốc & Sức khỏe (Medicine/Health): Gửi ghi chú sức khỏe và hướng dẫn dặn thuốc cho giáo viên.
   - Trò chuyện (Chat): Nhắn tin trực tiếp với giáo viên và nhà trường.
   - Danh bạ (Contact): Thông tin liên hệ của giáo viên chủ nhiệm và giáo viên bộ môn.
4. Hoạt động khác:
   - Tin tức (News): Cập nhật thông báo và các bài viết từ nhà trường.
   - Thư viện (Library): Mượn sách và xem tài liệu tham khảo.
   - Mini Game: Khu vực giải trí có các trò chơi như Math Rush (giải toán nhanh) để tích điểm.
   - Khảo sát (Survey): Tham gia đóng góp ý kiến cho nhà trường.
5. Hệ thống tích điểm (Gamification):
   - Người dùng tích lũy Điểm (Points) và Xu (Coins) thông qua học tập và chơi game để tăng Cấp độ (Level) và đổi thưởng.

Thông tin của học sinh hiện tại:
- Tên: ${fullName}
- Lớp: ${className || 'chưa xác định'}
- Ngày hôm nay: ${dateStr}

Dữ liệu học tập thực tế:
Lịch học hôm nay:
${todayScheduleText || '  Không có dữ liệu lịch học.'}

Điểm số gần nhất:
${gradesText || '  Chưa có dữ liệu điểm số.'}

Quy tắc trả lời:
- Luôn gọi học sinh bằng tên thân mật "${fullName.split(' ').pop()}".
- Nếu người dùng hỏi về cách dùng app, hãy hướng dẫn họ tìm đến mục tương ứng trong menu.
- Nếu được hỏi về lịch học hay điểm số, hãy dựa chính xác vào dữ liệu thực tế ở trên.
- Trả lời bằng tiếng Việt, ngôn ngữ thân thiện, chuyên nghiệp.
- NHẮC LẠI: Tuyệt đối KHÔNG dùng emoji, icon hay bất kỳ ký hiệu hình ảnh nào trong văn bản. Chỉ dùng chữ và số.
- Nếu có thắc mắc ngoài khả năng, hãy khuyên người dùng liên hệ trực tiếp với nhà trường.`;

            setSystemPrompt(prompt);

            // Build smart suggestions dựa trên data thật
            const suggestions: string[] = [];
            if (todaySubjects.length > 0) {
                suggestions.push(`Hôm nay ${fullName.split(' ').pop()} có ${todaySubjects.join(', ')} - giúp ôn bài nhé!`);
                suggestions.push(`Giải thích kiến thức môn ${todaySubjects[0]} cho em`);
            }
            if (weakSubjects.length > 0) {
                suggestions.push(`Giúp em cải thiện môn ${weakSubjects[0]}`);
            }
            suggestions.push('Lịch học hôm nay của em thế nào?');
            suggestions.push('Cho em vài tips học bài hiệu quả');

            setSmartSuggestions(suggestions.slice(0, 4));
        } catch (error) {
            console.log('[AI] Không load được context:', error);
        }
    };

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
                    prompt: `${userMsg.text} (IMPORTANT: Do not use any emojis or icons in your response. Answer in plain text only.)`,
                    image: currentImageBase64,
                    mimeType: 'image/jpeg',
                    systemPrompt: systemPrompt || undefined, // 🔑 inject context học sinh
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
                    <View style={[styles.robotIconBox, { backgroundColor: 'transparent' }]}>
                        <Image source={BOT_AVATAR} style={styles.robotAvatar} />
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
                style={{ flex: 1, backgroundColor: theme.background }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
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
                                    <View style={[styles.emptyRobotWrapper, { shadowColor: theme.primary }]}>
                                        <Image source={BOT_AVATAR} style={styles.emptyRobotAvatar} />
                                    </View>
                                    <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                        Xin chào! Tôi là Trợ lý iClever AI
                                    </Text>
                                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                        Tôi biết lịch học, điểm số của bạn và có thể giúp giải bài tập, tư vấn học tập!
                                    </Text>
                                    
                                    <View style={styles.suggestedActions}>
                                        <Text style={[styles.suggestedTitle, { color: theme.textSecondary }]}>💡 Gợi ý cho bạn:</Text>
                                        <ScrollView showsVerticalScrollIndicator={false}>
                                            {smartSuggestions.map((suggestion, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    onPress={() => handleSend(suggestion)}
                                                    style={[styles.suggestedBtn, {
                                                        backgroundColor: isDark ? '#2D3748' : 'rgba(59, 89, 152, 0.05)',
                                                        borderColor: isDark ? '#334155' : 'rgba(59, 89, 152, 0.15)'
                                                    }]}
                                                >
                                                    <Text style={[styles.suggestedBtnText, { color: theme.primary }]}>{suggestion}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </View>
                            }
                        />
                    )}
                </View>

                {/* --- INPUT AREA --- */}
                <View style={{ backgroundColor: theme.surface, paddingBottom: insets.bottom > 0 ? insets.bottom - 5 : 10 }}>
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
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)'
    },
    robotAvatar: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    aiTitle: { fontSize: 17, fontWeight: 'bold' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ecc71', marginRight: 6 },
    statusText: { fontSize: 12, color: '#2ecc71', fontWeight: '500' },
    
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chatContainer: { padding: 15 },
    messageRow: { marginBottom: 12, alignItems: 'flex-start' },
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
    
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, paddingHorizontal: 20 },
    emptyRobotWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'white',
        marginBottom: 16,
        padding: 4,
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyRobotAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        resizeMode: 'contain'
    },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
    emptyText: { fontSize: 14, textAlign: 'center', marginHorizontal: 10, marginBottom: 20, lineHeight: 20 },
    suggestedActions: { width: '100%', marginTop: 8 },
    suggestedTitle: { fontSize: 13, marginBottom: 12, fontWeight: '600', textAlign: 'center' },
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
        paddingVertical: 8,
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