import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';

import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { academicApi, studentApi } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentUser } from '../services/userHelper';

export default function AcademicListScreen({ navigation }: any) {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [studentProfile, setStudentProfile] = useState<any>(null);

    const loadData = async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        else setRefreshing(true);

        try {
            // 1. Lấy user cơ bản từ session
            const u = await getCurrentUser();
            setUser(u);

            // 2. Lấy profile chi tiết (đã cập nhật kèm Grade ở backend)
            const profileRes = await studentApi.getProfile();
            const profile = profileRes.data?.data || profileRes.data;
            setStudentProfile(profile);
            
            // 3. Lấy danh sách môn học theo khối lớp
            const gradeLevel = profile?.currentClass?.grade?.gradeLevel;
            await fetchSubjects(gradeLevel);
        } catch (error) {
            console.error('Error loading academic data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const fetchSubjects = async (gradeLevel?: number) => {
        try {
            const response = await academicApi.getSubjects(gradeLevel);
            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.data || [];
            
            // Nếu API chưa filter (fallback), tự filter ở frontend
            if (gradeLevel && data.every((s: any) => !s.gradeLevel)) {
                // Mock filtering if DB not updated yet
                setSubjects(data); 
            } else {
                setSubjects(data);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const onRefresh = () => {
        loadData(true);
    };




    const renderIcon = (name: string) => {
        if (name === 'calculator') return <MaterialCommunityIcons name="calculator" size={32} color="white" />;
        if (name === 'bolt') return <Ionicons name="flash" size={32} color="white" />;
        if (name === 'hourglass-half') return <FontAwesome5 name="hourglass-half" size={28} color="white" />;
        if (name === 'robot') return <MaterialCommunityIcons name="robot" size={32} color="white" />;
        return <Ionicons name="book" size={32} color="white" />;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Góc học tập</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >

                <LinearGradient
                    colors={['#4facfe', '#00f2fe']}
                    style={styles.banner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>Học tập & Giải trí</Text>
                        <Text style={styles.bannerSub}>Hoàn thành bài học để mở khóa kiến thức mới và nhận xu đổi quà!</Text>
                    </View>
                    <MaterialCommunityIcons name="robot" size={80} color="rgba(255,255,255,0.2)" style={styles.bannerIcon} />
                </LinearGradient>

                <View style={styles.sectionHeader}>
                    <Ionicons name="book-outline" size={20} color="#3498db" />
                    <Text style={styles.sectionTitle}>
                        Môn học (Khối {studentProfile?.currentClass?.grade?.gradeLevel || user?.level || studentProfile?.level || (studentProfile?.currentClass?.name || user?.className)?.charAt(0) || '6'})
                    </Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />
                ) : (
                    <View style={styles.grid}>
                        {subjects.map((item) => (
                            <TouchableOpacity 
                                key={item.id || item._id} 
                                style={styles.cardWrapper}
                                onPress={() => navigation.navigate('Curriculum', { 
                                    subjectId: item.id || item._id,
                                    subjectName: item.name 
                                })}
                            >
                                <LinearGradient
                                    colors={[item.color || '#3498db', (item.color || '#3498db') + 'CC']}
                                    style={styles.card}
                                >
                                    <View style={styles.iconContainer}>
                                        {renderIcon(item.icon)}
                                    </View>
                                    <Text style={styles.cardTitle}>{item.name}</Text>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>
                                            {item.isExtra ? 'Lớp Mở rộng' : (studentProfile?.currentClass?.name || user?.className || `Khối ${studentProfile?.currentClass?.grade?.gradeLevel || user?.level || '...'}`)}
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingVertical: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    scrollContent: { padding: 20 },
    banner: {
        borderRadius: 20,
        padding: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    bannerContent: { flex: 1, marginRight: 10 },
    bannerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 8 },
    bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 18 },
    bannerIcon: { position: 'absolute', right: -10, bottom: -10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginLeft: 8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    cardWrapper: { width: '48%', marginBottom: 15 },
    card: {
        borderRadius: 18,
        padding: 20,
        height: 160,
        justifyContent: 'space-between',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginTop: 10 },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        alignSelf: 'flex-start'
    },
    badgeText: { fontSize: 11, color: 'white', fontWeight: 'bold' }
});
