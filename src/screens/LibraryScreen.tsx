import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput, ScrollView,
    TouchableOpacity, SafeAreaView, ActivityIndicator,
    Image, FlatList, Dimensions, Modal, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { libraryApi } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - 60) / 2;

const CATEGORIES = ['Tất cả', 'Sách giáo khoa', 'Truyện tranh', 'Khoa học'];

export default function LibraryScreen({ navigation }: any) {
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Tất cả');
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async (category?: string) => {
        try {
            const response = await libraryApi.getBooks(category !== 'Tất cả' ? category : undefined);
            setBooks(response.data.data || []);
        } catch (error) {
            console.error('Error fetching books:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectBook = (book: any) => {
        setSelectedBook(book);
        setModalVisible(true);
    };

    const handleBorrow = () => {
        const returnDate = "30/10/2023";
        Alert.alert(
            "Xác nhận mượn sách",
            `Đã gửi yêu cầu mượn sách "${selectedBook.title}". Vui lòng đến thư viện để nhận sách.`,
            [{ 
                text: "OK", 
                onPress: () => {
                    // Cập nhật trạng thái sách trong danh sách local
                    const updatedBooks = books.map(b => {
                        if (b.id === selectedBook.id) {
                            const updatedBook = { 
                                ...b, 
                                availability: 'Đã hết', 
                                status: 'Đang mượn',
                                returnDate: returnDate
                            };
                            setSelectedBook(updatedBook); // Cập nhật cả modal đang mở
                            return updatedBook;
                        }
                        return b;
                    });
                    setBooks(updatedBooks);
                } 
            }]
        );
    };

    const filteredBooks = books.filter(book => {
        const matchesCategory = activeCategory === 'Tất cả' || book.category === activeCategory;
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             book.author.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const renderBookItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.bookCard} 
            activeOpacity={0.8}
            onPress={() => handleSelectBook(item)}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.imageUrl }} style={styles.bookCover} />
                {item.status === 'Đang mượn' && (
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                )}
            </View>
            <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
                <View style={[
                    styles.availBadge, 
                    { backgroundColor: item.availability === 'Có sẵn' ? '#e8f5e9' : '#ffebee' }
                ]}>
                    <Text style={[
                        styles.availText, 
                        { color: item.availability === 'Có sẵn' ? '#2e7d32' : '#e53935' }
                    ]}>
                        {item.availability}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Detail Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <TouchableOpacity 
                            style={styles.closeBtn} 
                            onPress={() => setModalVisible(false)}
                        >
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalHeader}>
                                <Image source={{ uri: selectedBook?.imageUrl }} style={styles.modalImage} />
                            </View>

                            <View style={styles.modalContent}>
                                <View style={styles.modalTitleRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalTitle}>{selectedBook?.title}</Text>
                                        <Text style={styles.modalAuthor}>{selectedBook?.author}</Text>
                                    </View>
                                    <View style={[
                                        styles.modalStatusBadge, 
                                        { backgroundColor: selectedBook?.availability === 'Có sẵn' ? '#e8f5e9' : '#ffebee' }
                                    ]}>
                                        <Text style={[
                                            styles.modalStatusText, 
                                            { color: selectedBook?.availability === 'Có sẵn' ? '#2e7d32' : '#e53935' }
                                        ]}>
                                            {selectedBook?.status}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Ionicons name="book-outline" size={20} color="#f39c12" />
                                        <Text style={styles.statLabel}>Trang</Text>
                                        <Text style={styles.statValue}>{selectedBook?.pages}</Text>
                                    </View>
                                    <View style={[styles.statItem, styles.statBorder]}>
                                        <Ionicons name="star" size={20} color="#f39c12" />
                                        <Text style={styles.statLabel}>Đánh giá</Text>
                                        <Text style={styles.statValue}>{selectedBook?.rating}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Ionicons name="calendar-outline" size={20} color="#f39c12" />
                                        <Text style={styles.statLabel}>Năm XB</Text>
                                        <Text style={styles.statValue}>{selectedBook?.year}</Text>
                                    </View>
                                </View>

                                <View style={styles.descSection}>
                                    <Text style={styles.descLabel}>Giới thiệu nội dung</Text>
                                    <Text style={styles.descText}>{selectedBook?.description}</Text>
                                </View>

                                {selectedBook?.availability === 'Có sẵn' ? (
                                    <TouchableOpacity style={styles.borrowBtn} onPress={handleBorrow}>
                                        <Text style={styles.borrowBtnText}>Đăng ký mượn ngay</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={[styles.borrowBtn, styles.disabledBtn]} disabled>
                                        <Text style={styles.disabledBtnText}>
                                            Dự kiến trả: {selectedBook?.returnDate || 'Sớm nhất'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thư viện số</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                    <Ionicons name="search" size={20} color="#bdc3c7" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm sách..."
                        placeholderTextColor="#bdc3c7"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Category Filter */}
            <View style={styles.categoryContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryChip, activeCategory === cat && styles.activeChip]}
                            onPress={() => setActiveCategory(cat)}
                        >
                            <Text style={[styles.categoryText, activeCategory === cat && styles.activeCategoryText]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#f39c12" />
                </View>
            ) : (
                <FlatList
                    data={filteredBooks}
                    keyExtractor={(item) => item.id || item._id}
                    renderItem={renderBookItem}
                    numColumns={2}
                    contentContainerStyle={styles.gridContainer}
                    columnWrapperStyle={styles.gridRow}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Ionicons name="book-outline" size={60} color="#ddd" />
                            <Text style={styles.emptyText}>Không tìm thấy sách phù hợp</Text>
                        </View>
                    }
                />
            )}
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
    
    searchContainer: { backgroundColor: 'white', padding: 16 },
    searchWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#f1f3f6', 
        borderRadius: 12, 
        paddingHorizontal: 12,
        height: 50
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#2c3e50' },

    categoryContainer: { backgroundColor: 'white', paddingBottom: 16 },
    categoryScroll: { paddingHorizontal: 16 },
    categoryChip: { 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 20, 
        backgroundColor: 'white', 
        borderWidth: 1, 
        borderColor: '#eee',
        marginRight: 10
    },
    activeChip: { backgroundColor: '#f39c12', borderColor: '#f39c12' },
    categoryText: { fontSize: 14, color: '#2c3e50', fontWeight: '500' },
    activeCategoryText: { color: 'white', fontWeight: 'bold' },

    gridContainer: { padding: 20 },
    gridRow: { justifyContent: 'space-between' },
    bookCard: { 
        width: COLUMN_WIDTH, 
        backgroundColor: 'white', 
        borderRadius: 16, 
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden'
    },
    imageContainer: { width: '100%', height: COLUMN_WIDTH * 1.4, backgroundColor: '#f0f0f0' },
    bookCover: { width: '100%', height: '100%' },
    statusBadge: { 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 6 
    },
    statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    
    bookInfo: { padding: 12 },
    bookTitle: { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', height: 40 },
    bookAuthor: { fontSize: 12, color: '#95a5a6', marginTop: 4, marginBottom: 8 },
    availBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    availText: { fontSize: 11, fontWeight: 'bold' },

    emptyBox: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#bdc3c7', fontSize: 15, marginTop: 15 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: SCREEN_HEIGHT * 0.85, overflow: 'hidden' },
    closeBtn: { position: 'absolute', top: 20, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.3)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    modalHeader: { width: '100%', height: SCREEN_HEIGHT * 0.35, backgroundColor: '#f0f0f0' },
    modalImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    modalContent: { padding: 24 },
    modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginBottom: 6 },
    modalAuthor: { fontSize: 16, color: '#f39c12', fontWeight: '500' },
    modalStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    modalStatusText: { fontSize: 12, fontWeight: 'bold' },

    statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 25, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f3f6' },
    statItem: { flex: 1, alignItems: 'center' },
    statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f1f3f6' },
    statLabel: { fontSize: 12, color: '#95a5a6', marginVertical: 4 },
    statValue: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },

    descSection: { marginBottom: 30 },
    descLabel: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
    descText: { fontSize: 15, color: '#7f8c8d', lineHeight: 24 },

    borrowBtn: { backgroundColor: '#f39c12', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    borrowBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    disabledBtn: { backgroundColor: '#f1f3f6' },
    disabledBtnText: { color: '#bdc3c7', fontSize: 16, fontWeight: 'bold' }
});
