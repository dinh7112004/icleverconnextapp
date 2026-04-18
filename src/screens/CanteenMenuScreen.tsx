import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Image, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { menuApi } from '../services/api';

const { width } = Dimensions.get('window');

export default function CanteenMenuScreen({ navigation }: any) {
    const [menuData, setMenuData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(4); // default: Thứ Sáu (last item)

    useEffect(() => {
        menuApi.getWeek().then(res => {
            setMenuData(res.data.data);
            setLoading(false);
        });
    }, []);

    const goToPrev = () => {
        if (selectedIndex > 0) setSelectedIndex(i => i - 1);
    };

    const goToNext = () => {
        if (selectedIndex < menuData.length - 1) setSelectedIndex(i => i + 1);
    };

    if (loading || menuData.length === 0) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#3b5998" /></View>;
    }

    const day = menuData[selectedIndex];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thực đơn</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                {/* Date Navigator */}
                <View style={styles.dateNavCard}>
                    <TouchableOpacity
                        style={[styles.arrowBtn, selectedIndex === 0 && styles.arrowBtnDisabled]}
                        onPress={goToPrev}
                        disabled={selectedIndex === 0}
                    >
                        <Ionicons name="chevron-back" size={20} color={selectedIndex === 0 ? '#ccc' : '#3b5998'} />
                    </TouchableOpacity>

                    <View style={styles.dateCenter}>
                        <Text style={styles.dayName}>{day.dayName}</Text>
                        <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={16} color="#3b5998" />
                            <Text style={styles.dateText}>{day.date}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.arrowBtn, selectedIndex === menuData.length - 1 && styles.arrowBtnDisabled]}
                        onPress={goToNext}
                        disabled={selectedIndex === menuData.length - 1}
                    >
                        <Ionicons name="chevron-forward" size={20} color={selectedIndex === menuData.length - 1 ? '#ccc' : '#3b5998'} />
                    </TouchableOpacity>
                </View>

                {/* Food Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: day.imageUrl }}
                        style={styles.foodImage}
                        resizeMode="cover"
                    />
                    <View style={styles.imageDot} />
                </View>

                {/* Meal List */}
                <View style={styles.mealList}>
                    <MealRow
                        bgColor="#fff3e0"
                        iconColor="#e97e37"
                        iconName="cafe-outline"
                        title="Bữa sáng"
                        description={day.breakfast}
                    />
                    <MealRow
                        bgColor="#e8f5e9"
                        iconColor="#27ae60"
                        iconName="restaurant-outline"
                        title="Bữa trưa"
                        description={day.lunch}
                    />
                    <MealRow
                        bgColor="#f3e5f5"
                        iconColor="#9b59b6"
                        iconName="nutrition-outline"
                        title="Bữa chiều"
                        description={day.snack}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function MealRow({ bgColor, iconColor, iconName, title, description }: any) {
    return (
        <View style={styles.mealCard}>
            <View style={[styles.mealIcon, { backgroundColor: bgColor }]}>
                <Ionicons name={iconName} size={22} color={iconColor} />
            </View>
            <View style={styles.mealInfo}>
                <Text style={styles.mealTitle}>{title}</Text>
                <Text style={styles.mealDesc}>{description}</Text>
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
