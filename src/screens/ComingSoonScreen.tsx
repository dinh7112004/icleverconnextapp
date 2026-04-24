import React from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity,
    SafeAreaView, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function ComingSoonScreen({ navigation, route }: any) {
    const { isDark, theme } = useTheme();
    const title = route.params?.title || 'Tính năng';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <LinearGradient
                    colors={isDark ? ['#1E293B', '#0F172A'] : ['#fdfbfb', '#ebedee']}
                    style={styles.illustrationContainer}
                >
                    <View style={[styles.iconCircle, { backgroundColor: isDark ? '#334155' : 'white' }]}>
                        <Ionicons name="construct-outline" size={60} color={isDark ? '#60A5FA' : '#3b5998'} />
                    </View>
                </LinearGradient>

                <Text style={[styles.mainTitle, { color: theme.text }]}>Sắp ra mắt!</Text>
                <Text style={[styles.description, { color: theme.textSecondary }]}>
                    Tính năng <Text style={[styles.highlight, { color: theme.primary }]}>{title}</Text> đang trong quá trình phát triển và sẽ sớm được cập nhật dành cho bạn.
                </Text>

                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.goBack()}
                >
                    <LinearGradient
                        colors={isDark ? ['#3B82F6', '#2563EB'] : ['#3b5998', '#4c669f']}
                        style={styles.gradientBtn}
                    >
                        <Text style={styles.btnText}>Quay lại trang chủ</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingBottom: 80,
    },
    illustrationContainer: {
        width: 180,
        height: 180,
        borderRadius: 90,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3b5998',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    highlight: {
        color: '#3b5998',
        fontWeight: 'bold',
    },
    actionButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientBtn: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
