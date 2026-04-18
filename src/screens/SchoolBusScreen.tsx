import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Image, Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { busApi } from '../services/api';
import { getCurrentStudentId } from '../services/userHelper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SchoolBusScreen({ navigation }: any) {
    const [busInfo, setBusInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBusInfo();
    }, []);

    const fetchBusInfo = async () => {
        try {
            const studentId = await getCurrentStudentId();
            if (!studentId) { setLoading(false); return; }
            const response = await busApi.getInfo(studentId);
            setBusInfo(response.data.data);
        } catch (error) {
            console.error('Error fetching bus info:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3b5998" />
                </View>
            </SafeAreaView>
        );
    }

    const renderDriverRow = (person: any, isFirst: boolean) => (
        <View style={[styles.personRow, !isFirst && styles.personBorder]}>
            <View style={[styles.avatar, { backgroundColor: person.initials === 'TX' ? '#fff9db' : '#fff0f6' }]}>
                <Text style={[styles.avatarText, { color: person.initials === 'TX' ? '#f59f00' : '#d6336c' }]}>
                    {person.initials}
                </Text>
            </View>
            <View style={styles.personInfo}>
                <Text style={styles.personName}>{person.name}</Text>
                <Text style={styles.personDetail}>{person.plate || person.role}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn}>
                <Ionicons name="call" size={20} color="white" />
            </TouchableOpacity>
        </View>
    );

    const renderTimelineStep = (step: any, index: number, isLast: boolean) => {
        const isDone = step.status === 'done';
        const isActive = step.status === 'active';
        const isPending = step.status === 'pending';

        let iconName: any = 'location';
        let iconColor = '#ced4da';
        let textColor = '#2c3e50';
        let timeColor = '#7f8c8d';

        if (isDone) {
            iconColor = '#27ae60';
        } else if (isActive) {
            iconName = 'navigate';
            iconColor = '#3498db';
        } else {
            textColor = '#bdc3c7';
            timeColor = '#ddd';
        }

        return (
            <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                    <View style={[styles.iconBox, { backgroundColor: isDone ? '#eafaf1' : isActive ? '#ebf5fb' : '#f8f9fa' }]}>
                        <Ionicons name={iconName} size={20} color={iconColor} />
                    </View>
                    {!isLast && <View style={[styles.line, isDone && styles.lineDone]} />}
                </View>
                <View style={styles.timelineRight}>
                    <Text style={[styles.stepTitle, { color: textColor }]}>{step.title}</Text>
                    <Text style={[styles.stepTime, { color: timeColor }]}>{step.time}</Text>
                </View>
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
                <Text style={styles.headerTitle}>Xe đưa đón</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Driver Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>THÔNG TIN TÀI XẾ</Text>
                    <View style={styles.infoCard}>
                        {renderDriverRow(busInfo?.driver, true)}
                        {renderDriverRow(busInfo?.monitor, false)}
                    </View>
                </View>

                {/* Timeline Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>LỘ TRÌNH SÁNG NAY</Text>
                    <View style={styles.timelineCard}>
                        {busInfo?.schedule.map((step: any, index: number) => 
                            renderTimelineStep(step, index, index === busInfo.schedule.length - 1)
                        )}
                    </View>
                </View>
            </ScrollView>
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
    
    scrollContent: { padding: 20, paddingBottom: 40 },
    section: { marginBottom: 25 },
    sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 12, letterSpacing: 0.5 },
    
    infoCard: { 
        backgroundColor: 'white', 
        borderRadius: 16, 
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3
    },
    personRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
    personBorder: { borderTopWidth: 1, borderTopColor: '#f1f3f6' },
    avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontSize: 16, fontWeight: 'bold' },
    personInfo: { flex: 1 },
    personName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
    personDetail: { fontSize: 13, color: '#95a5a6', marginTop: 2 },
    callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2ecc71', justifyContent: 'center', alignItems: 'center' },

    timelineCard: { 
        backgroundColor: 'white', 
        borderRadius: 16, 
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3
    },
    timelineItem: { flexDirection: 'row', minHeight: 80 },
    timelineLeft: { alignItems: 'center', marginRight: 20 },
    iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    line: { width: 2, flex: 1, backgroundColor: '#f1f3f6', marginVertical: -5 },
    lineDone: { backgroundColor: '#27ae60' },
    timelineRight: { flex: 1, paddingTop: 8 },
    stepTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    stepTime: { fontSize: 13 }
});
