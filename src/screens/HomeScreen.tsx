import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import UserHeader from '../components/UserHeader';
import { newsApi, userApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Dữ liệu Grid Menu (12+ nút chức năng)
const menuItems = [
    { id: 1, name: 'Bài học', icon: 'school', color: '#3498db', type: 'Ionicons', roles: ['student', 'parent'] },
    { id: 2, name: 'Mini Game', icon: 'gamepad-variant', color: '#e84393', type: 'MaterialCommunityIcons', roles: ['student', 'parent'] },
    { id: 3, name: 'Thời khóa biểu', icon: 'calendar-alt', color: '#9b59b6', type: 'FontAwesome5', roles: ['student', 'parent'] },
    { id: 4, name: 'Kết quả học tập', icon: 'book-open', color: '#2ecc71', type: 'FontAwesome5', roles: ['student', 'parent'] },
    { id: 5, name: 'Bài tập', icon: 'clipboard-check', color: '#5f27cd', type: 'FontAwesome5', roles: ['student', 'parent'] },
    { id: 6, name: 'Điểm danh', icon: 'calendar-check', color: '#0984e3', type: 'FontAwesome5', roles: ['student', 'parent'] },
    { id: 7, name: 'Học phí', icon: 'credit-card', color: '#e67e22', type: 'FontAwesome5', roles: ['parent'] },
    { id: 8, name: 'Thực đơn', icon: 'utensils', color: '#e74c3c', type: 'FontAwesome5', roles: ['student', 'parent'] },
    { id: 9, name: 'Xin nghỉ phép', icon: 'file-alt', color: '#cd84f1', type: 'FontAwesome5', roles: ['parent'] },
    { id: 10, name: 'Lưu ý sức khỏe', icon: 'notes-medical', color: '#ff4d4d', type: 'FontAwesome5', roles: ['student', 'parent'] },
    { id: 11, name: 'Hoạt động', icon: 'images', color: '#ff9f43', type: 'FontAwesome5', roles: ['student', 'parent'] },
    { id: 12, name: 'Dặn thuốc', icon: 'pills', color: '#1abc9c', type: 'FontAwesome5', roles: ['parent'] },
    { id: 13, name: 'Xe đưa đón', icon: 'bus', color: '#f1c40f', type: 'FontAwesome5', roles: ['student', 'parent'] },
    { id: 14, name: 'Thư viện', icon: 'book', color: '#e67e22', type: 'FontAwesome5', roles: ['student', 'parent'] },
    { id: 15, name: 'Trò chuyện', icon: 'chatbubbles', color: '#1abc9c', type: 'Ionicons', roles: ['student', 'parent'] },
    { id: 16, name: 'Khảo sát', icon: 'clipboard-list', color: '#27ae60', type: 'FontAwesome5', roles: ['student', 'parent'] },
];

export default function HomeScreen({ navigation, route }: any) {
    const setIsLoggedIn = route?.params?.setIsLoggedIn;
    const [news, setNews] = useState<any[]>([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [userData, setUserData] = useState<any>(null); 
    const [userRole, setUserRole] = useState<string>('parent');

    // Tự động load lại dữ liệu mỗi khi màn hình được quay lại (focus)
    useFocusEffect(
        React.useCallback(() => {
            loadUserData();
            fetchNews();
        }, [])
    );

    const fetchNews = async () => {
        try {
            const response = await newsApi.getAll();
            setNews(response.data.data || []);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoadingNews(false);
        }
    };

    const loadUserData = async () => {
        try {
            // Bước 1: Lấy data User từ AsyncStorage
            const userString = await AsyncStorage.getItem('user');
            if (userString) {
                const user = JSON.parse(userString);
                setUserData(user);
                setUserRole(user.role ? user.role.toLowerCase() : 'parent');
            }

            // Bước 2: Gọi API lấy profile mới nhất để cập nhật Điểm/Xu
            const response = await userApi.getProfile();
            const freshUser = response.data.data || response.data;
            if (freshUser) {
                setUserData(freshUser);
                setUserRole(freshUser.role ? freshUser.role.toLowerCase() : 'parent');
                await AsyncStorage.setItem('user', JSON.stringify(freshUser));
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin user:', error);
        }
    };

    const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

    const renderIcon = (item: any) => {
        if (item.type === 'Ionicons') return <Ionicons name={item.icon as any} size={24} color="white" />;
        if (item.type === 'MaterialCommunityIcons') return <MaterialCommunityIcons name={item.icon as any} size={24} color="white" />;
        return <FontAwesome5 name={item.icon} size={20} color="white" />;
    };

    return (
        <SafeAreaView style={styles.container}>
            <UserHeader setIsLoggedIn={setIsLoggedIn} userData={userData} />

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.menuGrid}>
                    {filteredMenuItems.map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.menuItem}
                            onPress={() => {
                                if (item.name === 'Bài học') (navigation as any).navigate('AcademicList');
                                else if (item.name === 'Mini Game') (navigation as any).navigate('GameList');
                                else if (item.name === 'Thời khóa biểu') (navigation as any).navigate('Timetable');
                                else if (item.name === 'Kết quả học tập') (navigation as any).navigate('Grades');
                                else if (item.name === 'Bài tập') (navigation as any).navigate('Homework');
                                else if (item.name === 'Điểm danh') (navigation as any).navigate('Attendance');
                                else if (item.name === 'Học phí') (navigation as any).navigate('Tuition');
                                else if (item.name === 'Thực đơn') (navigation as any).navigate('CanteenMenu');
                                else if (item.name === 'Xin nghỉ phép') (navigation as any).navigate('LeaveRequest');
                                else if (item.name === 'Lưu ý sức khỏe') (navigation as any).navigate('StudentNotes');
                                else if (item.name === 'Hoạt động') (navigation as any).navigate('Activities');
                                else if (item.name === 'Dặn thuốc') (navigation as any).navigate('MedicineInstruction');
                                else if (item.name === 'Xe đưa đón') (navigation as any).navigate('SchoolBus');
                                else if (item.name === 'Thư viện') (navigation as any).navigate('Library');
                                else if (item.name === 'Trò chuyện') (navigation as any).navigate('ChatList');
                                else if (item.name === 'Khảo sát') (navigation as any).navigate('Survey');
                            }}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                                {renderIcon(item)}
                            </View>
                            <Text style={styles.menuText}>{item.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* News Section */}
                <View style={styles.newsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Tin tức nhà trường</Text>
                        <TouchableOpacity><Text style={styles.viewMore}>Xem thêm</Text></TouchableOpacity>
                    </View>
                    {loadingNews ? (
                        <ActivityIndicator color="#3498db" />
                    ) : (
                        Array.isArray(news) && news.map((item) => (
                            <TouchableOpacity key={item.id} style={styles.newsItem}>
                                <Image source={{ uri: item.thumbnail || 'https://via.placeholder.com/100' }} style={styles.newsThumb} />
                                <View style={styles.newsInfo}>
                                    <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                                    <Text style={styles.newsDate}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    menuGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        padding: 10,
        backgroundColor: 'white',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    menuItem: { 
        width: '25%', 
        alignItems: 'center', 
        marginVertical: 12 
    },
    iconCircle: { 
        width: 50, 
        height: 50, 
        borderRadius: 15, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    menuText: { 
        fontSize: 11, 
        textAlign: 'center', 
        color: '#2d3436', 
        fontWeight: '500' 
    },
    newsSection: { padding: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2d3436' },
    viewMore: { color: '#3498db', fontSize: 14 },
    newsItem: { 
        flexDirection: 'row', 
        backgroundColor: 'white', 
        borderRadius: 15, 
        padding: 10, 
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    newsThumb: { width: 80, height: 80, borderRadius: 10 },
    newsInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    newsTitle: { fontSize: 15, fontWeight: 'bold', color: '#2d3436', marginBottom: 5 },
    newsDate: { fontSize: 12, color: '#b2bec3' },
});