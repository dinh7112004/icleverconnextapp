import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, Text, View, TextInput, FlatList,
    TouchableOpacity, SafeAreaView, ActivityIndicator,
    KeyboardAvoidingView, Platform, Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '../services/api';

export default function ChatDetailScreen({ route, navigation }: any) {
    const { chat } = route.params;
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await chatApi.getMessages(chat.id);
            setMessages(response.data.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMessage = {
            id: `new_${Date.now()}`,
            text: inputText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderType: 'parent'
        };

        setMessages([...messages, newMessage]);
        setInputText('');
        Keyboard.dismiss();
        
        // Scroll to bottom
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isParent = item.senderType === 'parent';
        return (
            <View style={[styles.messageWrapper, isParent ? styles.parentWrapper : styles.teacherWrapper]}>
                <View style={[styles.bubble, isParent ? styles.parentBubble : styles.teacherBubble]}>
                    <Text style={[styles.messageText, isParent ? styles.parentText : styles.teacherText]}>
                        {item.text}
                    </Text>
                </View>
                <Text style={styles.messageTime}>{item.time}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                    </TouchableOpacity>
                    <View style={styles.avatarMini}>
                        <Text style={styles.avatarEmojiMini}>{chat.avatar}</Text>
                        {chat.online && <View style={styles.onlineDotMini} />}
                    </View>
                    <View style={styles.contactInfo}>
                        <Text style={styles.headerName}>{chat.name}</Text>
                        <Text style={styles.headerStatus}>Đang hoạt động</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.callHeaderBtn}>
                    <Ionicons name="call" size={20} color="#2ecc71" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#3498db" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.messageList}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    />
                )}

                {/* Input Area */}
                <View style={styles.inputArea}>
                    <TouchableOpacity style={styles.attachBtn}>
                        <Ionicons name="add" size={28} color="#3498db" />
                    </TouchableOpacity>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập tin nhắn..."
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                    </View>
                    <TouchableOpacity 
                        style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
                        onPress={handleSend}
                    >
                        <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        height: 70, 
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { width: 36, height: 44, justifyContent: 'center' },
    avatarMini: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarEmojiMini: { fontSize: 24 },
    onlineDotMini: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#2ecc71', borderWidth: 1.5, borderColor: 'white' },
    contactInfo: { justifyContent: 'center' },
    headerName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
    headerStatus: { fontSize: 12, color: '#2ecc71', fontWeight: '500' },
    callHeaderBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e8f7ed', justifyContent: 'center', alignItems: 'center' },

    messageList: { padding: 16, paddingBottom: 30 },
    messageWrapper: { marginBottom: 20, maxWidth: '80%' },
    parentWrapper: { alignSelf: 'flex-end' },
    teacherWrapper: { alignSelf: 'flex-start' },
    bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
    parentBubble: { backgroundColor: '#3498db', borderBottomRightRadius: 4 },
    teacherBubble: { backgroundColor: 'white', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    messageText: { fontSize: 15, lineHeight: 22 },
    parentText: { color: 'white' },
    teacherText: { color: '#2c3e50' },
    messageTime: { fontSize: 11, color: '#bdc3c7', marginTop: 4, alignSelf: 'flex-start' },

    inputArea: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 12, 
        paddingVertical: 10, 
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
    },
    attachBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    inputWrapper: { flex: 1, backgroundColor: '#f1f3f6', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 8, maxHeight: 100 },
    input: { fontSize: 15, color: '#2c3e50' },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3498db', justifyContent: 'center', alignItems: 'center' },
    sendBtnDisabled: { backgroundColor: '#bdc3c7' }
});
