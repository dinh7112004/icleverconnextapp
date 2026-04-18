import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { userApi } from '../services/api';

export default function GameListScreen({ navigation }: any) {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await userApi.getProfile();
            setUserData(response.data.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#1e272e', '#2c3e50', '#1e272e']}
            style={styles.container}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Khu vui chơi</Text>
                    <View style={styles.coinBadge}>
                        <FontAwesome5 name="star" size={14} color="#f1c40f" />
                        <Text style={styles.coinText}>{userData?.coins || 0}</Text>
                    </View>
                </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.banner}
                >
                    <View style={styles.bannerIconBg}>
                        <MaterialCommunityIcons name="controller-classic" size={48} color="white" />
                    </View>
                    <Text style={styles.bannerTitle}>Đổi điểm lấy niềm vui</Text>
                    <Text style={styles.bannerSub}>Chơi game giải trí sau những giờ học căng thẳng.</Text>
                </LinearGradient>

                <Text style={styles.sectionTitle}>Danh sách trò chơi</Text>

                <View style={styles.gameList}>
                    {/* Vua Toán Học */}
                    <TouchableOpacity 
                        style={styles.gameCard}
                        onPress={() => navigation.navigate('MathRush')}
                    >
                        <Image 
                            source={{ uri: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400&auto=format&fit=crop' }} 
                            style={styles.gameImage} 
                        />
                        <View style={styles.gameInfo}>
                            <Text style={styles.gameName}>Vua Toán Học</Text>
                            <Text style={styles.gameDesc}>Giải các bài toán nhanh trong 60s để nhận quà.</Text>
                            <View style={styles.costRow}>
                                <FontAwesome5 name="star" size={12} color="#f1c40f" />
                                <Text style={styles.costText}>5 xu / lượt</Text>
                            </View>
                        </View>
                        <TouchableOpacity 
                            style={styles.playBtn}
                            onPress={() => navigation.navigate('MathRush')}
                        >
                            <Ionicons name="play" size={18} color="white" />
                            <Text style={styles.playBtnText}>Chơi</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>

                    {/* Dũng Sĩ Tiếng Anh (Sắp ra mắt) */}
                    <View style={[styles.gameCard, { opacity: 0.8 }]}>
                        <View style={styles.imageOverlayContainer}>
                            <Image 
                                source={{ uri: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400&auto=format&fit=crop' }} 
                                style={styles.gameImage} 
                            />
                            <View style={styles.comingSoonBadge}>
                                <Text style={styles.comingSoonText}>SẮP RA MẮT</Text>
                            </View>
                        </View>
                        <View style={styles.gameInfo}>
                            <Text style={styles.gameName}>Dũng Sĩ Tiếng Anh</Text>
                            <Text style={styles.gameDesc}>Ghép từ vựng để tiêu diệt quái vật.</Text>
                            <View style={styles.costRow}>
                                <FontAwesome5 name="star" size={12} color="#f1c40f" />
                                <Text style={styles.costText}>10 xu / lượt</Text>
                            </View>
                        </View>
                        <View style={[styles.playBtn, { backgroundColor: '#95a5a6' }]}>
                            <Ionicons name="play" size={18} color="white" />
                            <Text style={styles.playBtnText}>Chơi</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingVertical: 15 
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    coinBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.3)', 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 20 
    },
    coinText: { color: '#f1c40f', fontWeight: 'bold', marginLeft: 6, fontSize: 16 },
    scrollContent: { padding: 20 },
    banner: {
        borderRadius: 25,
        padding: 30,
        alignItems: 'center',
        marginBottom: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    bannerIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15
    },
    bannerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 10 },
    bannerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 20 },
    gameList: { gap: 20 },
    gameCard: {
        backgroundColor: '#4834d4',
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        overflow: 'hidden',
    },
    gameImage: { width: 80, height: 80, borderRadius: 12 },
    gameInfo: { flex: 1, marginLeft: 15 },
    gameName: { fontSize: 17, fontWeight: 'bold', color: 'white', marginBottom: 4 },
    gameDesc: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
    costRow: { flexDirection: 'row', alignItems: 'center' },
    costText: { fontSize: 13, color: '#f1c40f', fontWeight: 'bold', marginLeft: 4 },
    playBtn: { 
        backgroundColor: '#ff4757', 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        borderRadius: 12 
    },
    playBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 4, fontSize: 14 },
    imageOverlayContainer: { position: 'relative' },
    comingSoonBadge: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    comingSoonText: { fontSize: 10, fontWeight: 'bold', color: 'white' }
});
