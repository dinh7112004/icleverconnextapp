import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet, Text, View, TextInput, ScrollView,
    TouchableOpacity, SafeAreaView, ActivityIndicator,
    Image, FlatList, Dimensions, Modal, Alert, StatusBar, RefreshControl
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { libraryApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - 48) / 2;
const CATEGORIES = ['Tất cả', 'Sách giáo khoa', 'Truyện tranh', 'Khoa học'];
const CACHE_KEY = 'library_cache_';

// Memoized Book Item
const BookItem = React.memo(({ item, theme, isDark, onSelect }: any) => (
    <TouchableOpacity 
        style={styles.bookCard} 
        activeOpacity={0.7}
        onPress={() => onSelect(item)}
    >
        <View style={styles.imageContainer}>
            <Image source={{ uri: item.imageUrl }} style={styles.bookCover} />
            {item.status === 'Đang mượn' && (
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>ĐANG MƯỢN</Text>
                </View>
            )}
            <View style={[styles.ratingBadge, { backgroundColor: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)' }]}>
                <Ionicons name="star" size={10} color="#f1c40f" />
                <Text style={[styles.ratingText, { color: theme.text }]}>{item.rating}</Text>
            </View>
        </View>
        <View style={styles.bookInfo}>
            <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
            <Text style={[styles.bookAuthor, { color: theme.textSecondary }]}>{item.author}</Text>
            <View style={styles.cardFooter}>
                <View style={[
                    styles.availIndicator, 
                    { backgroundColor: item.availability === 'Có sẵn' ? '#2ecc71' : '#e74c3c' }
                ]} />
                <Text style={[
                    styles.availText, 
                    { color: item.availability === 'Có sẵn' ? '#2ecc71' : '#e74c3c' }
                ]}>
                    {item.availability}
                </Text>
            </View>
        </View>
    </TouchableOpacity>
));

export default function LibraryScreen({ navigation }: any) {
    const { isDark, theme } = useTheme();
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Tất cả');
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [borrowing, setBorrowing] = useState(false);
    const [showBorrowedOnly, setShowBorrowedOnly] = useState(false);

    const fetchBooks = useCallback(async (isRefresh = false) => {
        if (!isRefresh && books.length === 0) setLoading(true);
        try {
            // Cache lookup
            const cacheKey = `${CACHE_KEY}${activeCategory}`;
            if (!isRefresh && books.length === 0) {
                const cached = await AsyncStorage.getItem(cacheKey);
                if (cached) {
                    setBooks(JSON.parse(cached));
                    setLoading(false);
                }
            }

            const category = activeCategory === 'Tất cả' ? undefined : activeCategory;
            const response = await libraryApi.getBooks(category);
            
            let booksData = [];
            if (response.data && response.data.success) {
                const innerData = response.data.data;
                booksData = Array.isArray(innerData?.data) ? innerData.data : (Array.isArray(innerData) ? innerData : []);
            }
            setBooks(booksData);
            AsyncStorage.setItem(cacheKey, JSON.stringify(booksData));
        } catch (error) {
            console.error('Error fetching books:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeCategory, books.length]);

    useEffect(() => {
        fetchBooks();
    }, [activeCategory]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBooks(true);
    };

    const handleSelectBook = useCallback((book: any) => {
        setSelectedBook(book);
        setModalVisible(true);
    }, []);

    const handleBorrow = async () => {
        if (!selectedBook) return;
        setBorrowing(true);
        try {
            const response = await libraryApi.borrowBook(selectedBook.id);
            if (response.data.success) {
                Alert.alert("Thành công", `Đã đăng ký mượn "${selectedBook.title}".`, [{ text: "Đã hiểu", onPress: () => {
                    setModalVisible(false);
                    onRefresh();
                }}]);
            }
        } catch (error) {
            Alert.alert("Lỗi", "Không thể mượn sách.");
        } finally {
            setBorrowing(false);
        }
    };

    const filteredBooks = useMemo(() => {
        return books.filter(book => {
            const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 book.author.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesBorrowed = showBorrowedOnly ? (book.status === 'Đang mượn') : true;
            return matchesSearch && matchesBorrowed;
        });
    }, [books, searchQuery, showBorrowedOnly]);

    const renderItem = useCallback(({ item }: any) => (
        <BookItem item={item} theme={theme} isDark={isDark} onSelect={handleSelectBook} />
    ), [theme, isDark, handleSelectBook]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
                        <View style={[styles.modalIndicator, { backgroundColor: theme.border }]} />
                        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDark ? '#1E293B' : '#f8fafc' }]} onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={[styles.modalHeader, { backgroundColor: isDark ? '#1E293B' : '#f8fafc' }]}>
                                <Image source={{ uri: selectedBook?.imageUrl }} style={styles.modalImage} />
                            </View>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalCategory}>{selectedBook?.category}</Text>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedBook?.title}</Text>
                                <Text style={[styles.modalAuthor, { color: theme.textSecondary }]}>Tác giả: {selectedBook?.author}</Text>
                                <View style={[styles.statsRow, { borderColor: theme.border }]}>
                                    <View style={styles.statItem}><Text style={[styles.statValue, { color: theme.text }]}>{selectedBook?.rating}</Text><Text style={styles.statLabel}>Đánh giá</Text></View>
                                    <View style={[styles.statItem, styles.statBorder, { borderColor: theme.border }]}><Text style={[styles.statValue, { color: theme.text }]}>{selectedBook?.pages}</Text><Text style={styles.statLabel}>Số trang</Text></View>
                                    <View style={styles.statItem}><Text style={[styles.statValue, { color: theme.text }]}>{selectedBook?.year}</Text><Text style={styles.statLabel}>Năm XB</Text></View>
                                </View>
                                <View style={styles.descSection}>
                                    <Text style={[styles.descLabel, { color: theme.text }]}>Giới thiệu sách</Text>
                                    <Text style={[styles.descText, { color: theme.textSecondary }]}>{selectedBook?.description}</Text>
                                </View>
                                {selectedBook?.availability === 'Có sẵn' ? (
                                    <TouchableOpacity style={[styles.borrowBtn, { backgroundColor: theme.primary }]} onPress={handleBorrow} disabled={borrowing}>
                                        {borrowing ? <ActivityIndicator color="white" /> : <Text style={styles.borrowBtnText}>Đăng ký mượn sách</Text>}
                                    </TouchableOpacity>
                                ) : (
                                    <View style={[styles.borrowBtn, styles.disabledBtn, { backgroundColor: theme.border }]}><Text style={{ color: theme.textSecondary }}>{selectedBook?.status === 'Đang mượn' ? 'Đang mượn' : 'Hết sách'}</Text></View>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <View style={[styles.header, { backgroundColor: theme.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}><Ionicons name="arrow-back" size={24} color={theme.text} /></TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{showBorrowedOnly ? 'Sách đang mượn' : 'Thư viện số'}</Text>
                <TouchableOpacity style={[styles.headerIcon, showBorrowedOnly && { backgroundColor: theme.primary }]} onPress={() => setShowBorrowedOnly(!showBorrowedOnly)}><Ionicons name={showBorrowedOnly ? "bookmark" : "bookmark-outline"} size={22} color={showBorrowedOnly ? "white" : theme.text} /></TouchableOpacity>
            </View>

            <View style={[styles.searchSection, { backgroundColor: theme.surface }]}>
                <View style={[styles.searchBar, { backgroundColor: isDark ? '#1E293B' : '#f1f5f9' }]}>
                    <Ionicons name="search" size={20} color={theme.textSecondary} /><TextInput style={[styles.searchInput, { color: theme.text }]} placeholder="Tìm kiếm..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={theme.textSecondary} />
                </View>
            </View>

            {!showBorrowedOnly && (
                <View style={[styles.catSection, { backgroundColor: theme.surface }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity key={cat} style={[styles.catChip, { backgroundColor: isDark ? '#1E293B' : '#f8fafc', borderColor: theme.border }, activeCategory === cat && { backgroundColor: theme.primary, borderColor: theme.primary }]} onPress={() => setActiveCategory(cat)}>
                                <Text style={[styles.catText, { color: theme.textSecondary }, activeCategory === cat && { color: 'white' }]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {loading && books.length === 0 ? (
                <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : (
                <FlatList
                    data={filteredBooks}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    numColumns={2}
                    contentContainerStyle={styles.bookList}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    removeClippedSubviews={true}
                    initialNumToRender={6}
                    maxToRenderPerBatch={6}
                    windowSize={5}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}><MaterialCommunityIcons name="book-search-outline" size={80} color={isDark ? '#2D3748' : '#e2e8f0'} /><Text style={[styles.emptyText, { color: theme.textSecondary }]}>Không tìm thấy sách</Text></View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
    headerIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    searchSection: { padding: 16 },
    searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 50 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 15 },
    catSection: { paddingBottom: 16 },
    catScroll: { paddingHorizontal: 16 },
    catChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, marginRight: 10, borderWidth: 1 },
    catText: { fontSize: 14, fontWeight: '600' },
    bookList: { padding: 16 },
    bookCard: { width: COLUMN_WIDTH, marginBottom: 24, marginRight: 16 },
    imageContainer: { width: '100%', height: COLUMN_WIDTH * 1.5, borderRadius: 16, overflow: 'hidden', elevation: 5 },
    bookCover: { width: '100%', height: '100%', resizeMode: 'cover' },
    statusBadge: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(231, 76, 60, 0.9)', paddingVertical: 4, alignItems: 'center' },
    statusText: { color: 'white', fontSize: 10, fontWeight: '900' },
    ratingBadge: { position: 'absolute', bottom: 10, right: 10, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 3 },
    ratingText: { fontSize: 11, fontWeight: '700' },
    bookInfo: { marginTop: 12 },
    bookTitle: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
    bookAuthor: { fontSize: 13, marginTop: 2 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
    availIndicator: { width: 8, height: 8, borderRadius: 4 },
    availText: { fontSize: 12, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContainer: { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: SCREEN_HEIGHT * 0.9, overflow: 'hidden' },
    modalIndicator: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 12 },
    closeBtn: { position: 'absolute', top: 20, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    modalHeader: { width: '100%', height: SCREEN_HEIGHT * 0.4, alignItems: 'center', justifyContent: 'center' },
    modalImage: { width: '60%', height: '80%', borderRadius: 12 },
    modalContent: { padding: 24 },
    modalCategory: { fontSize: 13, fontWeight: '700', color: '#f39c12', textTransform: 'uppercase', marginBottom: 8 },
    modalTitle: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
    modalAuthor: { fontSize: 16, marginBottom: 24 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 24 },
    statItem: { flex: 1, alignItems: 'center' },
    statBorder: { borderLeftWidth: 1, borderRightWidth: 1 },
    statValue: { fontSize: 18, fontWeight: '800' },
    statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
    descSection: { marginBottom: 32 },
    descLabel: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
    descText: { fontSize: 15, lineHeight: 24 },
    borrowBtn: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    borrowBtnText: { color: 'white', fontSize: 17, fontWeight: '800' },
    disabledBtn: { elevation: 0 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, marginTop: 16 }
});
