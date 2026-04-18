import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Image, FlatList, Dimensions, TextInput
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { newsApi } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'school' | 'class';

export default function ActivitiesScreen({ navigation, route }: any) {
    const [activeTab, setActiveTab] = useState<TabType>('class');
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (route?.params?.tab) {
            setActiveTab(route.params.tab);
        }
    }, [route?.params?.tab]);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const response = await newsApi.getAll();
            setActivities(response.data.data);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleComments = (id: string) => {
        setExpandedComments(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const filteredData = activities.filter(item => {
        if (activeTab === 'school') return item.badge === 'HOẠT ĐỘNG TRƯỜNG';
        if (activeTab === 'class') return item.badge === 'HOẠT ĐỘNG LỚP';
        return true;
    });

    const renderActivityItem = ({ item }: { item: any }) => {
        const isExpanded = expandedComments[item._id] || false;

        return (
            <View style={styles.card}>
                {/* 1. Header: Avatar + Name + Time */}
                <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                        <MaterialCommunityIcons name={item.sourceIcon || 'school'} size={24} color="#3b5998" />
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.sourceName}>{item.sourceName || 'Trường THCS iClever'}</Text>
                        <Text style={styles.timestamp}>08:00 {new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
                    </View>
                </View>

                {/* 2. Title & Description */}
                <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc}>{item.content}</Text>
                </View>

                {/* 3. Image */}
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />

                {/* 4. Interaction Summary: Likes */}
                <View style={styles.interactionSummary}>
                    <Ionicons name="heart" size={18} color="#e74c3c" />
                    <Text style={styles.likesCountText}>{item.likesCount || 0} yêu thích</Text>
                </View>

                {/* 5. Action Buttons: Like, Comment, Share */}
                <View style={styles.actionRow}>
                    <View style={styles.actionButtonsLeft}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Ionicons name="heart-outline" size={24} color="#7f8c8d" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleComments(item._id)}>
                            <Ionicons name={isExpanded ? "chatbubble" : "chatbubble-outline"} size={22} color={isExpanded ? "#3b5998" : "#7f8c8d"} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Ionicons name="share-social-outline" size={22} color="#7f8c8d" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 6. Comments Section (Conditionally Rendered) */}
                {isExpanded && (
                    <View style={styles.commentSection}>
                        <Text style={styles.noCommentText}>Chưa có bình luận nào.</Text>
                        
                        <View style={styles.commentInputWrapper}>
                            <TextInput 
                                style={styles.commentInput}
                                placeholder="Viết bình luận..."
                                placeholderTextColor="#bdc3c7"
                            />
                            <TouchableOpacity style={styles.sendBtn}>
                                <Ionicons name="paper-plane-outline" size={20} color="#3b5998" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hoạt động</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabWrapper}>
                <View style={styles.tabContainer}>
                    {[
                        { key: 'class', label: 'Hoạt động lớp' },
                        { key: 'school', label: 'Hoạt động trường' }
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tabButton, activeTab === tab.key && styles.activeTabBtn]}
                            onPress={() => setActiveTab(tab.key as TabType)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3b5998" />
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item._id}
                    renderItem={renderActivityItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Ionicons name="images-outline" size={60} color="#ddd" />
                            <Text style={styles.emptyText}>Chưa có hoạt động nào</Text>
                        </View>
                    }
                />
            )}
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
        height: 60, 
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    backBtn: { width: 44, height: 44, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    
    tabWrapper: { backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 20 },
    tabContainer: { 
        flexDirection: 'row', 
        backgroundColor: '#f1f3f6', 
        borderRadius: 12, 
        padding: 4 
    },
    tabButton: { 
        flex: 1, 
        paddingVertical: 10, 
        alignItems: 'center', 
        borderRadius: 10 
    },
    activeTabBtn: { 
        backgroundColor: 'white', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4, 
        elevation: 2 
    },
    tabText: { fontSize: 14, color: '#7f8c8d', fontWeight: '600' },
    activeTabText: { color: '#3b5998', fontWeight: 'bold' },

    listContent: { padding: 12, paddingBottom: 40 },
    card: { 
        backgroundColor: 'white', 
        borderRadius: 16, 
        marginBottom: 16, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden'
    },
    cardHeader: { flexDirection: 'row', padding: 16, alignItems: 'center' },
    avatarContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0f3f9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerInfo: { flex: 1 },
    sourceName: { fontSize: 15, fontWeight: 'bold', color: '#2c3e50' },
    timestamp: { fontSize: 12, color: '#95a5a6', marginTop: 2 },
    
    textContainer: { paddingHorizontal: 16, paddingBottom: 16 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 6 },
    cardDesc: { fontSize: 14, color: '#34495e', lineHeight: 22 },
    
    cardImage: { width: '100%', height: 220 },
    
    interactionSummary: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f3f6' },
    likesCountText: { fontSize: 13, color: '#7f8c8d', marginLeft: 6 },
    
    actionRow: { flexDirection: 'row', padding: 4, justifyContent: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#f1f3f6' },
    actionButtonsLeft: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { padding: 8, marginHorizontal: 4 },
    
    commentSection: { padding: 16, backgroundColor: '#fafbfc' },
    noCommentText: { textAlign: 'center', color: '#bdc3c7', fontSize: 13, marginBottom: 16 },
    commentInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 25, paddingHorizontal: 16, borderWidth: 1, borderColor: '#eee' },
    commentInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#2c3e50' },
    sendBtn: { marginLeft: 8 },

    emptyBox: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#bdc3c7', fontSize: 15, marginTop: 15 }
});
