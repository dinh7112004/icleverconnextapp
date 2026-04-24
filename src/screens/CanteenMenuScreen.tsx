import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Image, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { menuApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function CanteenMenuScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const [menuData, setMenuData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date()); 

    const loadInitialData = async () => {
        const cacheKey = 'canteen_menu_cache';
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                setMenuData(JSON.parse(cached));
                setLoading(false);
            }

            const res = await menuApi.getWeek();
            const data = res.data?.data || [];
            setMenuData(data);
            AsyncStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (error) {
            console.error('[Menu] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const formatDate = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    const formatDateForSearch = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    const goToPrev = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const isFuture = () => {
        const futureLimit = new Date();
        // Limit to current day only, no future dates
        const current = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const limitDate = new Date(futureLimit.getFullYear(), futureLimit.getMonth(), futureLimit.getDate());
        return current.getTime() >= limitDate.getTime();
    };

    const goToNext = () => {
        if (isFuture()) return;

        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const getDayName = (date: Date) => {
        const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return dayNames[date.getDay()];
    };


    const dateStr = formatDate(selectedDate);
    const dayData = menuData.find(item => item.date === dateStr);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Thực đơn</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                {/* Date Navigator */}
                <View style={[styles.dateNavCard, { backgroundColor: theme.surface, shadowColor: isDark ? '#000' : '#000' }]}>
                    <TouchableOpacity style={styles.arrowBtn} onPress={goToPrev}>
                        <Ionicons name="chevron-back" size={20} color={theme.primary} />
                    </TouchableOpacity>

                    <View style={styles.dateCenter}>
                        <Text style={[styles.dayName, { color: theme.textSecondary }]}>{getDayName(selectedDate)}</Text>
                        <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                            <Text style={[styles.dateText, { color: theme.text }]}>{dateStr}</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.arrowBtn, isFuture() && styles.arrowBtnDisabled]} 
                        onPress={goToNext}
                        disabled={isFuture()}
                    >
                        <Ionicons name="chevron-forward" size={20} color={isFuture() ? (isDark ? '#4A5568' : '#ccc') : theme.primary} />
                    </TouchableOpacity>
                </View>

                {/* Food Image */}
                <View style={styles.imageContainer} key={dateStr}>
                    <Image
                        source={{ uri: (dayData?.imageUrl && dayData.imageUrl.length > 10) ? dayData.imageUrl : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000' }}
                        style={styles.foodImage}
                        resizeMode="cover"
                    />
                    <View style={styles.imageDot} />
                </View>

                {/* Meal List */}
                <View style={styles.mealList}>
                    <MealRow
                        bgColor={isDark ? '#4338ca' : '#FFF3E0'}
                        iconColor={isDark ? '#c7d2fe' : '#E67E22'}
                        iconName="cafe-outline"
                        title="Bữa sáng"
                        description={(dayData?.breakfast || 'Chưa có thông tin').replace(/\(Ngày \d+\)/, '').trim()}
                        theme={theme}
                        isDark={isDark}
                    />
                    <MealRow
                        bgColor={isDark ? '#065f46' : '#E8F5E9'}
                        iconColor={isDark ? '#a7f3d0' : '#27AE60'}
                        iconName="restaurant-outline"
                        title="Bữa trưa"
                        description={(dayData?.lunch || 'Chưa có thông tin').replace(/\(Ngày \d+\)/, '').trim()}
                        theme={theme}
                        isDark={isDark}
                    />
                    <MealRow
                        bgColor={isDark ? '#5b21b6' : '#F3E5F5'}
                        iconColor={isDark ? '#ddd6fe' : '#9B59B6'}
                        iconName="nutrition-outline"
                        title="Bữa chiều"
                        description={(dayData?.snack || 'Chưa có thông tin').replace(/\(Ngày \d+\)/, '').trim()}
                        theme={theme}
                        isDark={isDark}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function MealRow({ bgColor, iconColor, iconName, title, description, theme, isDark }: any) {
    return (
        <View style={[styles.mealCard, { backgroundColor: theme.surface, shadowColor: isDark ? '#000' : '#000' }]}>
            <View style={[styles.mealIcon, { backgroundColor: bgColor }]}>
                <Ionicons name={iconName} size={22} color={iconColor} />
            </View>
            <View style={styles.mealInfo}>
                <Text style={[styles.mealTitle, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.mealDesc, { color: theme.textSecondary }]}>{description}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, height: 60, backgroundColor: 'white',
        borderBottomWidth: 1, borderBottomColor: '#eee'
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },

    // Date Navigator
    dateNavCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'white', marginHorizontal: 16, marginTop: 16, marginBottom: 14,
        borderRadius: 18, paddingVertical: 14, paddingHorizontal: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 3
    },
    arrowBtn: { padding: 8 },
    arrowBtnDisabled: { opacity: 0.4 },
    dateCenter: { flex: 1, alignItems: 'center' },
    dayName: { fontSize: 12, fontWeight: '700', color: '#95a5a6', letterSpacing: 1, marginBottom: 4 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },

    // Image
    imageContainer: {
        marginHorizontal: 16, marginBottom: 14, borderRadius: 18, overflow: 'hidden',
        height: 200, position: 'relative',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
    },
    foodImage: { width: '100%', height: '100%' },
    imageDot: {
        position: 'absolute', top: 12, left: 12,
        width: 10, height: 10, borderRadius: 5, backgroundColor: '#7158e2'
    },

    // Meal List
    mealList: { marginHorizontal: 16, gap: 10 },
    mealCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'white', borderRadius: 16, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
    },
    mealIcon: {
        width: 50, height: 50, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', marginRight: 14
    },
    mealInfo: { flex: 1 },
    mealTitle: { fontSize: 15, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
    mealDesc: { fontSize: 13, color: '#7f8c8d', lineHeight: 18 },
});
