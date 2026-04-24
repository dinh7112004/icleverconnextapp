import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function AIScreen() {
    const { isDark, theme } = useTheme();
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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

            <ScrollView style={styles.chatContainer} showsVerticalScrollIndicator={false}>
                {/* --- MESSAGE BUBBLE --- */}
                <View style={styles.messageRow}>
                    <View style={[styles.aiMessageBubble, { backgroundColor: theme.surface, shadowColor: isDark ? '#000' : '#000' }]}>
                        <View style={styles.aiLabelRow}>
                            <Ionicons name="sparkles" size={14} color="#f39c12" />
                            <Text style={[styles.aiLabel, { color: theme.textSecondary }]}>ICLEVER AI</Text>
                        </View>
                        <Text style={[styles.messageText, { color: theme.text }]}>
                            Chào bạn! Tôi là trợ lý ảo iClever AI. Tôi có thể giúp gì cho bạn hôm nay?
                        </Text>
                        <Text style={[styles.timeText, { color: theme.textSecondary }]}>10:07 AM</Text>
                    </View>
                </View>

                {/* Suggestions can stay but moved here or removed as per image */}
                <View style={styles.suggestedActions}>
                    <Text style={[styles.suggestedTitle, { color: theme.textSecondary }]}>Bạn có thể hỏi mình:</Text>
                    <TouchableOpacity style={[styles.suggestedBtn, { backgroundColor: isDark ? '#2D3748' : 'rgba(59, 89, 152, 0.05)', borderColor: isDark ? '#334155' : 'rgba(59, 89, 152, 0.1)' }]}>
                        <Text style={[styles.suggestedBtnText, { color: theme.primary }]}>Giải bài tập Toán lớp 7</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.suggestedBtn, { backgroundColor: isDark ? '#2D3748' : 'rgba(59, 89, 152, 0.05)', borderColor: isDark ? '#334155' : 'rgba(59, 89, 152, 0.1)' }]}>
                        <Text style={[styles.suggestedBtnText, { color: theme.primary }]}>Dịch đoạn văn bản sang tiếng Anh</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* --- INPUT AREA --- */}
            <View style={[styles.inputArea, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <TouchableOpacity style={styles.attachmentBtn}>
                    <Ionicons name="add" size={28} color={theme.textSecondary} />
                </TouchableOpacity>
                <View style={[styles.inputBox, { backgroundColor: isDark ? '#2D3748' : '#f1f2f6' }]}>
                    <Text style={[styles.inputText, { color: theme.textSecondary }]}>Hỏi trợ lý iClever...</Text>
                </View>
                <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.primary }]}>
                    <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f6fa' },
    
    // Header
    aiHeader: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    robotIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#3b5998',
        justifyContent: 'center',
        alignItems: 'center'
    },
    aiTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ecc71', marginRight: 6 },
    statusText: { fontSize: 13, color: '#2ecc71', fontWeight: '500' },
    
    // Chat content
    chatContainer: { flex: 1, padding: 15 },
    messageRow: { marginBottom: 20, alignItems: 'flex-start' },
    aiMessageBubble: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 20,
        borderTopLeftRadius: 5,
        maxWidth: '85%',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    aiLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    aiLabel: { fontSize: 11, fontWeight: 'bold', color: '#7f8c8d', marginLeft: 6, letterSpacing: 0.5 },
    messageText: { fontSize: 15, color: '#2c3e50', lineHeight: 22 },
    timeText: { fontSize: 11, color: '#bdc3c7', textAlign: 'right', marginTop: 8 },
    
    // Suggestions
    suggestedActions: { marginTop: 10, paddingHorizontal: 10 },
    suggestedTitle: { fontSize: 13, color: '#7f8c8d', marginBottom: 12, fontWeight: '500' },
    suggestedBtn: { 
        backgroundColor: 'rgba(59, 89, 152, 0.05)', 
        paddingVertical: 12, 
        paddingHorizontal: 15, 
        borderRadius: 15, 
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(59, 89, 152, 0.1)'
    },
    suggestedBtnText: { fontSize: 14, color: '#3b5998', fontWeight: '500' },

    // Input area
    inputArea: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    attachmentBtn: { marginRight: 10 },
    inputBox: { 
        flex: 1, 
        backgroundColor: '#f1f2f6', 
        height: 44, 
        borderRadius: 22, 
        justifyContent: 'center', 
        paddingHorizontal: 15 
    },
    inputText: { color: '#bdc3c7', fontSize: 14 },
    sendBtn: { 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        backgroundColor: '#3b5998', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginLeft: 10 
    },
});