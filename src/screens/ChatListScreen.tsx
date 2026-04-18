import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput, FlatList,
    TouchableOpacity, SafeAreaView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '../services/api';

export default function ChatListScreen({ navigation }: any) {
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            const response = await chatApi.getChats();
            setChats(response.data.data);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredChats = chats.filter(chat => 
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderChatItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.chatItem}
            onPress={() => navigation.navigate('ChatDetail', { chat: item })}
        >
            <View style={styles.avatarContainer}>
                <Text style={styles.avatarEmoji}>{item.avatar}</Text>
                {item.online && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>{item.name}</Text>
                    <Text style={styles.chatTime}>{item.time}</Text>
                </View>
                <View style={styles.chatFooter}>
                    <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMsg}</Text>
                    {item.unread > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{item.unread}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trò chuyện</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                    <Ionicons name="search" size={20} color="#bdc3c7" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm cuộc trò chuyện..."
                        placeholderTextColor="#bdc3c7"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3498db" />
                </View>
            ) : (
                <FlatList
                    data={filteredChats}
                    keyExtractor={(item) => item.id}
                    renderItem={renderChatItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        height: 60, 
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    backBtn: { width: 44, height: 44, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    
    searchContainer: { padding: 16 },
    searchWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#f1f3f6', 
        borderRadius: 12, 
        paddingHorizontal: 12,
        height: 50
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#2c3e50' },

    listContent: { paddingHorizontal: 16 },
    chatItem: { flexDirection: 'row', paddingVertical: 16, alignItems: 'center' },
    avatarContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    avatarEmoji: { fontSize: 32 },
    onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#2ecc71', borderWidth: 2, borderColor: 'white' },
    chatInfo: { flex: 1 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    chatName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
    chatTime: { fontSize: 12, color: '#bdc3c7' },
    chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    lastMsg: { fontSize: 14, color: '#7f8c8d', flex: 1, marginRight: 10 },
    unreadBadge: { backgroundColor: '#e74c3c', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    unreadText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
    separator: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 72 }
});
