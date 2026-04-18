import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView,
    TouchableOpacity, SafeAreaView, ActivityIndicator
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { surveyApi } from '../services/api';

export default function SurveyScreen({ navigation }: any) {
    const [surveys, setSurveys] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSurveys();
    }, []);

    const fetchSurveys = async () => {
        try {
            const response = await surveyApi.getSurveys();
            setSurveys(response.data.data);
        } catch (error) {
            console.error('Error fetching surveys:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderOngoingCard = (item: any) => (
        <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
                {item.isNew && (
                    <View style={styles.newBadge}>
                        <Ionicons name="time-outline" size={12} color="#27ae60" style={{ marginRight: 4 }} />
                        <Text style={styles.newText}>Mới</Text>
                    </View>
                )}
                <View style={styles.expiryBox}>
                    <Ionicons name="time-outline" size={14} color="#bdc3c7" />
                    <Text style={styles.expiryText}>Hạn: {item.expiryDate}</Text>
                </View>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.cardFooter}>
                <Text style={styles.questionCount}>{item.questions} câu hỏi</Text>
                <TouchableOpacity style={styles.actionLink}>
                    <Text style={styles.actionText}>Làm khảo sát</Text>
                    <Ionicons name="chevron-forward" size={14} color="#27ae60" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderHistoryItem = (item: any) => {
        const isCompleted = item.status === 'completed';
        return (
            <TouchableOpacity key={item.id} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                    <Text style={styles.historyTitle}>{item.title}</Text>
                    <View style={styles.statusRow}>
                        <Ionicons 
                            name={isCompleted ? "checkmark-circle" : "time"} 
                            size={16} 
                            color={isCompleted ? "#27ae60" : "#bdc3c7"} 
                        />
                        <Text style={[styles.statusText, { color: isCompleted ? "#27ae60" : "#bdc3c7" }]}>
                            {isCompleted ? "Đã hoàn thành" : "Đã hết hạn"}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#ddd" />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Khảo sát & Ý kiến</Text>
                <View style={{ width: 44 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#27ae60" />
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    {/* Section: ĐANG DIỄN RA */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>ĐANG DIỄN RA</Text>
                        {surveys?.ongoing?.map(renderOngoingCard)}
                    </View>

                    {/* Section: LỊCH SỬ */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>LỊCH SỬ</Text>
                        <View style={styles.historyBox}>
                            {surveys?.history?.map(renderHistoryItem)}
                        </View>
                    </View>
                </ScrollView>
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
    
    content: { padding: 16 },
    section: { marginBottom: 24 },
    sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 16, textTransform: 'uppercase' },

    // Card Styles
    card: { 
        backgroundColor: 'white', 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e1f5fe', // Subtle hint of color from image
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    newBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#e8f5e9', 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 12 
    },
    newText: { color: '#27ae60', fontSize: 11, fontWeight: 'bold' },
    expiryBox: { flexDirection: 'row', alignItems: 'center' },
    expiryText: { color: '#bdc3c7', fontSize: 12, marginLeft: 4 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 16, lineHeight: 22 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f3f6', paddingTop: 12 },
    questionCount: { fontSize: 13, color: '#95a5a6' },
    actionLink: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#f1fcf4', 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e8f5e9'
    },
    actionText: { color: '#27ae60', fontSize: 13, fontWeight: 'bold', marginRight: 4 },

    // History Styles
    historyBox: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden' },
    historyItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#f1f3f6' 
    },
    historyInfo: { flex: 1 },
    historyTitle: { fontSize: 15, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 4 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusText: { fontSize: 12, marginLeft: 6, fontWeight: '500' }
});
