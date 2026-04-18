import React, { useState } from 'react';
import {
    StyleSheet, Text, View, ScrollView, SafeAreaView,
    TouchableOpacity, LayoutAnimation, Platform, UIManager
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
    {
        id: 1,
        question: 'Làm sao để xin nghỉ phép cho con?',
        answer: "Phụ huynh vào mục 'Xin nghỉ phép' từ màn hình chính, nhấn nút (+) để tạo đơn mới, điền thông tin ngày nghỉ và lý do, sau đó nhấn 'Gửi đơn'."
    },
    {
        id: 2,
        question: 'Tôi có thể xem lại lịch sử đóng học phí ở đâu?',
        answer: "Vui lòng truy cập mục 'Học phí'. Tại đây hệ thống sẽ hiển thị danh sách các khoản đã đóng và chưa đóng, cùng tổng số tiền cần thanh toán."
    },
    {
        id: 3,
        question: 'Quên mật khẩu đăng nhập thì làm thế nào?',
        answer: "Tại màn hình đăng nhập, quý phụ huynh chọn 'Quên mật khẩu'. Hệ thống sẽ gửi mã xác thực về số điện thoại đã đăng ký để đặt lại mật khẩu."
    },
    {
        id: 4,
        question: 'Làm sao để liên hệ trực tiếp với GVCN?',
        answer: "Quý phụ huynh vào mục 'Trò chuyện' hoặc 'Danh bạ', tìm tên giáo viên chủ nhiệm và chọn biểu tượng gọi điện hoặc nhắn tin."
    }
];

export default function HelpSupportScreen({ navigation }: any) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleAccordion = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trợ giúp & Hỗ trợ</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* --- QUICK CONTACT --- */}
                <View style={styles.contactRow}>
                    <TouchableOpacity style={styles.contactCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#f0f4ff' }]}>
                            <Feather name="phone" size={20} color="#2b58de" />
                        </View>
                        <Text style={styles.contactText}>Hotline 1900 xxxx</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#fff5f0' }]}>
                            <Feather name="mail" size={20} color="#e67e22" />
                        </View>
                        <Text style={styles.contactText}>Gửi Email hỗ trợ</Text>
                    </TouchableOpacity>
                </View>

                {/* --- FAQ SECTION --- */}
                <View style={styles.sectionHeader}>
                    <Ionicons name="help-circle-outline" size={22} color="#2b58de" />
                    <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
                </View>

                {FAQ_DATA.map((item, index) => {
                    const isExpanded = expandedIndex === index;
                    return (
                        <View key={item.id} style={[styles.faqItem, isExpanded && styles.faqItemExpanded]}>
                            <TouchableOpacity 
                                style={styles.faqHeader} 
                                onPress={() => toggleAccordion(index)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.faqQuestion, isExpanded && styles.faqQuestionActive]}>{item.question}</Text>
                                <Ionicons 
                                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                                    size={18} 
                                    color={isExpanded ? "#2b58de" : "#bdc3c7"} 
                                />
                            </TouchableOpacity>
                            {isExpanded && (
                                <View style={styles.faqBody}>
                                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                                </View>
                            )}
                        </View>
                    );
                })}

                {/* --- LIVE CHAT CARD --- */}
                <TouchableOpacity 
                    style={styles.chatCard}
                    onPress={() => navigation.navigate('MainTabs', { screen: 'Trợ lý AI' })}
                >
                    <View style={styles.chatInfo}>
                        <Text style={styles.chatTitle}>Cần hỗ trợ ngay?</Text>
                        <Text style={styles.chatSubtitle}>Chat trực tiếp với nhân viên hỗ trợ kỹ thuật</Text>
                    </View>
                    <View style={styles.chatIconBox}>
                        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
                    </View>
                </TouchableOpacity>

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
    contactRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    contactCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 5,
        elevation: 2
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    contactText: { fontSize: 13, fontWeight: 'bold', color: '#2c3e50' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingLeft: 5 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginLeft: 10 },
    faqItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 1
    },
    faqItemExpanded: {
        borderWidth: 1,
        borderColor: '#2b58de'
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16
    },
    faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: '#2c3e50', marginRight: 10 },
    faqQuestionActive: { color: '#2b58de' },
    faqBody: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#f1f2f6', paddingTop: 16 },
    faqAnswer: { fontSize: 13, color: '#7f8c8d', lineHeight: 20 },
    chatCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4834d4',
        borderRadius: 15,
        padding: 20,
        marginTop: 15,
        elevation: 4
    },
    chatInfo: { flex: 1 },
    chatTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 5 },
    chatSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    chatIconBox: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    }
});
