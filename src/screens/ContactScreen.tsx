import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserHeader from '../components/UserHeader';
import { contactApi } from '../services/api';
import { getCurrentUser } from '../services/userHelper';

export default function ContactScreen() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const user = await getCurrentUser();
            const classId = user?.classId || '';
            
            console.log('[Contact] Fetching teachers for class:', classId);
            const response = await contactApi.getAll(classId);
            
            // Handle NestJS response structure with TransformInterceptor and Pagination
            const result = response.data;
            let rawData = [];
            
            if (result && result.success) {
                const payload = result.data;
                if (Array.isArray(payload)) {
                    rawData = payload;
                } else if (payload && Array.isArray(payload.data)) {
                    rawData = payload.data;
                }
            }
            
            // Map real API Teacher entity to component structure
            const mappedData = rawData.map((t: any) => ({
                id: t.id,
                name: t.fullName || t.user?.fullName,
                role: t.specialization || 'Giáo viên',
                avatarUrl: t.user?.avatarUrl || t.avatarUrl,
                isMainTeacher: t.isHomeroomTeacher || false 
            }));
            
            setContacts(mappedData);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* --- HEADER (FIXED) --- */}
            <UserHeader />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* --- CONTACT LIST --- */}
                <View style={styles.contentSection}>
                    <Text style={styles.sectionTitle}>Danh bạ giáo viên</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#3b5998" style={{ marginTop: 20 }} />
                    ) : (
                        contacts.map((item) => (
                            <View key={item._id || item.id} style={styles.contactCard}>
                                <View style={styles.avatarContainer}>
                                    {item.avatarUrl && item.avatarUrl.startsWith('http') ? (
                                        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <Ionicons name="person-outline" size={26} color="#3b82f6" />
                                        </View>
                                    )}
                                </View>

                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactName}>{item.name}</Text>
                                    <Text style={styles.contactRole}>{item.role}</Text>
                                    {item.isMainTeacher && (
                                        <View style={styles.badgeContainer}>
                                            <Text style={styles.badgeText}>CN Lớp</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.contactActions}>
                                    <TouchableOpacity style={[styles.actionBtn, styles.callBtn]}>
                                        <Ionicons name="call" size={18} color="#22c55e" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionBtn, styles.chatBtn]}>
                                        <Ionicons name="chatbubble-ellipses" size={18} color="#3b82f6" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    contentSection: { paddingHorizontal: 16, marginTop: 20 },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 20,
        paddingLeft: 4
    },

    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
    },
    avatarPlaceholder: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    contactName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 2,
    },
    contactRole: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '500',
    },
    badgeContainer: {
        backgroundColor: '#fef9c3',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 6,
    },
    badgeText: {
        fontSize: 11,
        color: '#b45309',
        fontWeight: 'bold',
    },
    contactActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    callBtn: {
        backgroundColor: '#f0fdf4',
    },
    chatBtn: {
        backgroundColor: '#eff6ff',
    },
});