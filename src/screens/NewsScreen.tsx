import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, SafeAreaView,
    TouchableOpacity, FlatList, ActivityIndicator, TextInput, Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import UserHeader from '../components/UserHeader';
import { notificationApi } from '../services/api';

// Dữ liệu mẫu cho Hòm thư (Tab 2)
const mailItems = [
    { id: '1', title: 'Thư ngỏ về việc tổ chức Hội trại Xuân 2024 - "Xuân Gắn Kết"', sender: 'Ban Giám Hiệu', date: '2023-09-20', code: '101/TB-NS', isNew: true },
    { id: '2', title: 'Quyết định về việc điều chỉnh mức thu học phí năm học 2023-2024', sender: 'Hội đồng quản trị', date: '2023-08-15', code: '05/QĐ-HĐQT', isNew: false },
];

const FILTERS = [
    { label: 'Tất cả', icon: null, key: 'all' },
    { label: 'Khẩn cấp', icon: 'warning-outline', type: 'Ionicons', key: 'emergency' },
    { label: 'Học phí', icon: 'card-outline', type: 'Ionicons', key: 'payment' },
    { label: 'Điểm danh', icon: 'time-outline', type: 'Ionicons', key: 'attendance' },
    { label: 'Hoạt động', icon: 'images-outline', type: 'Ionicons', key: 'general' },
];

export default function NewsScreen({ route }: any) {
    const [activeTab, setActiveTab] = useState(route?.params?.tab || 1);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedNotiId, setExpandedNotiId] = useState<string | null>(null);
    const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
    const [feedbackVisibleIds, setFeedbackVisibleIds] = useState<string[]>([]);
    const [feedbackTexts, setFeedbackTexts] = useState<{[key: string]: string}>({});

    useEffect(() => {
        if (route?.params?.tab) {
            setActiveTab(route.params.tab);
        }
        fetchNotifications();
    }, [route?.params?.tab]);

    const fetchNotifications = async () => {
        try {
            const response = await notificationApi.getAll();
            setNotifications(response.data.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedNotiId(expandedNotiId === id ? null : id);
    };

    const toggleConfirm = (id: string) => {
        if (!confirmedIds.includes(id)) {
            setConfirmedIds([...confirmedIds, id]);
        }
    };

    const toggleFeedbackInput = (id: string) => {
        if (feedbackVisibleIds.includes(id)) {
            setFeedbackVisibleIds(feedbackVisibleIds.filter(fId => fId !== id));
        } else {
            setFeedbackVisibleIds([...feedbackVisibleIds, id]);
        }
    };

    const handleSendFeedback = (id: string) => {
        // Logic gửi phản hồi (giả lập)
        setFeedbackVisibleIds(feedbackVisibleIds.filter(fId => fId !== id));
        setFeedbackTexts({...feedbackTexts, [id]: ''});
    };

    const filteredNotifications = selectedFilter === 'all' 
        ? notifications 
        : notifications.filter(n => n.type === selectedFilter);

    const renderNotificationItem = ({ item }: { item: any }) => {
        const isExpanded = expandedNotiId === item.id || expandedNotiId === item._id;
        const currentId = item._id || item.id;
        const isConfirmed = confirmedIds.includes(currentId);
        const isFeedbackVisible = feedbackVisibleIds.includes(currentId);

        return (
            <View style={styles.notiCardOuter}>
                <TouchableOpacity 
                    style={styles.notiCard} 
                    activeOpacity={0.7}
                    onPress={() => toggleExpand(currentId)}
                >
                    <View style={styles.notiHeader}>
                        <View style={styles.iconCircle}>
                            <Ionicons 
                                name={item.type === 'attendance' ? 'alert-circle-outline' : 'chatbubble-outline'} 
                                size={22} 
                                color={item.type === 'attendance' ? '#e17055' : '#7f8c8d'} 
                            />
                        </View>
                        <View style={styles.notiMainInfo}>
                            <View style={styles.notiTopRow}>
                                <Text style={styles.senderBold}>{item.sender || 'Hệ thống'}</Text>
                                <View style={styles.notiTimeRow}>
                                    <Ionicons name="time-outline" size={14} color="#bdc3c7" style={{marginRight: 4}}/>
                                    <Text style={styles.timeText}>{item.time} {item.date}</Text>
                                    {item.unread && <View style={styles.unreadDot} />}
                                </View>
                            </View>
                            <Text style={[
                                styles.notiTitleText, 
                                item.type === 'attendance' && { color: '#e74c3c' }
                            ]}>
                                {item.type === 'attendance' && '⚠️ '}
                                {item.title}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.notiDescText} numberOfLines={isExpanded ? undefined : 2}>
                        {item.content}
                    </Text>

                    <View style={styles.chevronBox}>
                        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#bdc3c7" />
                    </View>

                    {isExpanded && (
                        <View style={styles.actionContainer}>
                            <View style={styles.btnRow}>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, isConfirmed ? styles.confirmedBtn : styles.confirmBtn]}
                                    onPress={() => toggleConfirm(currentId)}
                                    disabled={isConfirmed}
                                >
                                    <Ionicons 
                                        name={isConfirmed ? "checkmark-circle-outline" : "checkmark-done-outline"} 
                                        size={18} 
                                        color={isConfirmed ? "#27ae60" : "white"} 
                                    />
                                    <Text style={[styles.btnLabel, isConfirmed ? styles.confirmedText : styles.confirmText]}>
                                        {isConfirmed ? "Đã xác nhận" : "Xác nhận đã đọc"}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.actionBtn, styles.feedbackBtn]}
                                    onPress={() => toggleFeedbackInput(currentId)}
                                >
                                    <Ionicons 
                                        name={isFeedbackVisible ? "close-outline" : "chatbubble-ellipses-outline"} 
                                        size={18} 
                                        color="#2c3e50" 
                                    />
                                    <Text style={[styles.btnLabel, styles.feedbackText]}>
                                        {isFeedbackVisible ? "Đóng phản hồi" : "Gửi phản hồi"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {isFeedbackVisible && (
                                <View style={styles.feedbackInputWrapper}>
                                    <TextInput 
                                        style={styles.feedbackInput}
                                        placeholder="Nhập nội dung phản hồi..."
                                        placeholderTextColor="#bdc3c7"
                                        value={feedbackTexts[currentId] || ''}
                                        onChangeText={(v) => setFeedbackTexts({...feedbackTexts, [currentId]: v})}
                                        multiline
                                    />
                                    <TouchableOpacity 
                                        style={styles.sendIconBox}
                                        onPress={() => handleSendFeedback(currentId)}
                                    >
                                        <Ionicons name="send" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <UserHeader />

            {/* --- PHẦN 2: TIÊU ĐỀ & TAB CHUYỂN ĐỔI (Ngang hàng) --- */}
            <View style={styles.headerRow}>
                <Text style={styles.screenTitleCompact}>Hộp thư & Thông báo</Text>
                <View style={styles.tabSwitcherCompact}>
                    <TouchableOpacity
                        style={[styles.miniTabButton, activeTab === 1 && styles.activeMiniTab]}
                        onPress={() => setActiveTab(1)}
                    >
                        <Text style={[styles.miniTabText, activeTab === 1 && styles.activeMiniTabText]}>Thông báo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.miniTabButton, activeTab === 2 && styles.activeMiniTab]}
                        onPress={() => setActiveTab(2)}
                    >
                        <Text style={[styles.miniTabText, activeTab === 2 && styles.activeMiniTabText]}>Hòm thư</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* --- PHẦN 3: NỘI DUNG --- */}
            <View style={{ flex: 1 }}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#3b5998" />
                    </View>
                ) : activeTab === 1 ? (
                    <FlatList
                        data={filteredNotifications}
                        keyExtractor={(item) => item._id || item.id}
                        renderItem={renderNotificationItem}
                        ListHeaderComponent={
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
                                {FILTERS.map((f, index) => {
                                    const isActive = selectedFilter === f.key;
                                    return (
                                        <TouchableOpacity 
                                            key={index} 
                                            style={[styles.filterChip, isActive && styles.activeChip]}
                                            onPress={() => setSelectedFilter(f.key)}
                                        >
                                            {f.icon && <Ionicons name={f.icon as any} size={14} color={isActive ? "white" : "#7f8c8d"} style={{marginRight: 6}}/>}
                                            <Text style={[styles.filterText, isActive && styles.activeFilterText]}>{f.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        }
                        contentContainerStyle={{ paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
                        <View style={styles.infoBanner}>
                            <Ionicons name="mail-outline" size={20} color="#3b5998" />
                            <Text style={styles.infoBannerText}>Nơi lưu trữ các văn bản, thông báo, thư mời chính thức từ nhà trường.</Text>
                        </View>

                        {mailItems.map(item => (
                            <View key={item.id} style={styles.mailCard}>
                                <View style={styles.mailIconBox}><Ionicons name="document-text" size={24} color="#bdc3c7" /></View>
                                <View style={{ flex: 1, marginLeft: 15 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {item.isNew && <View style={styles.newBadge}><Text style={styles.newText}>MỚI</Text></View>}
                                        <Text style={styles.mailDate}>{item.date}</Text>
                                    </View>
                                    <Text style={styles.mailTitle}>{item.title}</Text>
                                    <Text style={styles.mailFooter}>{item.sender}  •  Số: {item.code}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#bdc3c7" />
                            </View>
                        ))}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        marginTop: 15, 
        marginBottom: 10 
    },
    screenTitleCompact: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', flex: 1 },
    tabSwitcherCompact: { 
        flexDirection: 'row', 
        backgroundColor: '#f1f3f6', 
        borderRadius: 12, 
        padding: 4,
        width: 190
    },
    miniTabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    activeMiniTab: { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    miniTabText: { color: '#7f8c8d', fontWeight: '600', fontSize: 13 },
    activeMiniTabText: { color: '#3b5998', fontWeight: 'bold' },
    
    filterBar: { paddingLeft: 16, marginVertical: 12 },
    filterChip: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        borderRadius: 12, 
        backgroundColor: 'white', 
        marginRight: 10, 
        borderWidth: 1, 
        borderColor: '#f1f3f6' 
    },
    activeChip: { backgroundColor: '#3b5998', borderColor: '#3b5998' },
    filterText: { fontSize: 13, color: '#7f8c8d', fontWeight: '500' },
    activeFilterText: { color: 'white', fontWeight: 'bold' },

    notiCardOuter: { marginHorizontal: 16, marginBottom: 12 },
    notiCard: { 
        backgroundColor: 'white', 
        padding: 16, 
        borderRadius: 20, 
        shadowColor: '#000', 
        shadowOpacity: 0.05, 
        shadowRadius: 10, 
        elevation: 2 
    },
    notiHeader: { flexDirection: 'row', marginBottom: 12 },
    iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    notiMainInfo: { flex: 1 },
    notiTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    senderBold: { fontSize: 14, fontWeight: 'bold', color: '#2c3e50' },
    notiTimeRow: { flexDirection: 'row', alignItems: 'center' },
    timeText: { fontSize: 11, color: '#bdc3c7' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e74c3c', marginLeft: 8 },
    notiTitleText: { fontSize: 15, fontWeight: 'bold', color: '#3498db', marginTop: 4 },
    notiDescText: { fontSize: 14, color: '#636e72', lineHeight: 22 },
    chevronBox: { alignItems: 'center', marginTop: 10 },

    actionContainer: { borderTopWidth: 1, borderTopColor: '#f1f3f6', marginTop: 15, paddingTop: 15 },
    btnRow: { flexDirection: 'row', justifyContent: 'space-between' },
    actionBtn: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 12, 
        borderRadius: 12,
        marginHorizontal: 4
    },
    confirmBtn: { backgroundColor: '#3498db' },
    confirmedBtn: { backgroundColor: '#f1fcf4', borderWidth: 1, borderColor: '#e8f5e9' },
    feedbackBtn: { backgroundColor: 'white', borderWidth: 1, borderColor: '#f1f3f6' },
    btnLabel: { fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
    confirmText: { color: 'white' },
    confirmedText: { color: '#27ae60' },
    feedbackText: { color: '#2c3e50' },

    feedbackInputWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#f8f9fa', 
        borderRadius: 14, 
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#f1f3f6'
    },
    feedbackInput: { flex: 1, fontSize: 14, color: '#2c3e50', maxHeight: 80 },
    sendIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3498db', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },

    infoBanner: { flexDirection: 'row', backgroundColor: '#eef2f9', padding: 15, borderRadius: 15, marginBottom: 15, alignItems: 'center' },
    infoBannerText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#3b5998', lineHeight: 18 },
    mailCard: { flexDirection: 'row', backgroundColor: 'white', padding: 18, borderRadius: 20, marginBottom: 12, alignItems: 'center', elevation: 1 },
    mailIconBox: { width: 48, height: 48, backgroundColor: '#f8f9fa', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    mailTitle: { fontSize: 15, fontWeight: 'bold', color: '#2c3e50', marginVertical: 6 },
    mailDate: { fontSize: 12, color: '#bdc3c7' },
    mailFooter: { fontSize: 12, color: '#3498db', fontWeight: '500' },
    newBadge: { backgroundColor: '#ffeaa7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
    newText: { fontSize: 10, fontWeight: 'bold', color: '#d63031' }
});