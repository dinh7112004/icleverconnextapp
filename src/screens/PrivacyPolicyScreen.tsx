import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function PrivacyPolicyScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const renderSection = (num: string, title: string, content: string) => (
        <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: theme.text }]}>{num}. {title}</Text>
            <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>{content}</Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Chính sách bảo mật</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: isDark ? '#000' : '#000' }]}>
                    <View style={[styles.shieldContainer, { backgroundColor: isDark ? '#064e3b' : '#eafaf1' }]}>
                        <Ionicons name="shield-checkmark" size={40} color={isDark ? '#10b981' : '#27ae60'} />
                    </View>

                    {renderSection(
                        '1', 
                        'Thu thập thông tin', 
                        'Chúng tôi thu thập thông tin cá nhân mà bạn cung cấp trực tiếp cho chúng tôi khi đăng ký sử dụng dịch vụ, bao gồm tên, địa chỉ email, số điện thoại, và thông tin học sinh.'
                    )}

                    {renderSection(
                        '2', 
                        'Sử dụng thông tin', 
                        'Thông tin được sử dụng để cung cấp dịch vụ sổ liên lạc điện tử, gửi thông báo kết quả học tập, và hỗ trợ liên lạc giữa nhà trường và gia đình. Chúng tôi cam kết không chia sẻ thông tin cho bên thứ ba vì mục đích thương mại.'
                    )}

                    {renderSection(
                        '3', 
                        'Bảo mật dữ liệu', 
                        'Chúng tôi áp dụng các biện pháp kỹ thuật và an ninh để bảo vệ thông tin cá nhân của bạn khỏi truy cập trái phép, mất mát hoặc phá hủy. Dữ liệu được mã hóa theo tiêu chuẩn an toàn thông tin.'
                    )}

                    {renderSection(
                        '4', 
                        'Quyền của người dùng', 
                        'Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa thông tin cá nhân của mình bất cứ lúc nào thông qua cài đặt ứng dụng hoặc liên hệ với bộ phận hỗ trợ.'
                    )}

                    <View style={[styles.footerNote, { backgroundColor: isDark ? '#1E293B' : '#f8f9fa' }]}>
                        <Text style={[styles.footerNoteText, { color: theme.textSecondary }]}>Cập nhật lần cuối: 01/01/2024</Text>
                    </View>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6'
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    scrollContent: { padding: 16 },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    shieldContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#eafaf1',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 30
    },
    section: { marginBottom: 25 },
    sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
    sectionBody: { fontSize: 14, color: '#7f8c8d', lineHeight: 22 },
    footerNote: {
        marginTop: 20,
        backgroundColor: '#f8f9fa',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center'
    },
    footerNoteText: { fontSize: 13, color: '#95a5a6', fontStyle: 'italic' }
});
