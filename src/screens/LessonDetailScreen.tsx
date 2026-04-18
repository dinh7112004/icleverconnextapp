import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Dimensions, Alert, LayoutAnimation, UIManager, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { academicApi, userApi } from '../services/api';
import { Lesson, Quiz, LessonContent } from '../types';
import RenderHtml from 'react-native-render-html';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LessonDetailScreen({ route, navigation }: any) {
    const { lessonId, courseId, title } = route.params;
    
    // States cho Tab & Lesson
    const [activeTab, setActiveTab] = useState<'video' | 'quiz'>('video');
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [videoContent, setVideoContent] = useState<LessonContent | null>(null);
    const [loading, setLoading] = useState(true);

    // States cho Quiz
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Array<{ questionId: string, answer: any }>>([]);
    const [quizResult, setQuizResult] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false); // Trạng thái đã bấm nút Kiểm tra chưa
    const [currentScore, setCurrentScore] = useState(0); // Điểm số trong lượt làm bài này

    useEffect(() => {
        fetchLessonAndQuiz();
    }, []);

    const fetchLessonAndQuiz = async () => {
        try {
            // Lấy thông tin bài học
            const lessonRes = await academicApi.getLessonDetails(lessonId);
            const lessonData = lessonRes.data.data || lessonRes.data;
            setLesson(lessonData);

            // Trích xuất video từ mảng contents của backend
            const video = lessonData.contents?.find((c: LessonContent) => c.type === 'video');
            setVideoContent(video || null);

            // Ghi nhận tiến độ học tập (Hit API progress)
            recordStudentProgress(lessonData.title);

            // Lấy thông tin Quiz của bài học
            const quizRes = await academicApi.getLessonQuizzes(lessonId);
            const quizData = quizRes.data.data || quizRes.data;
            if (quizData && quizData.length > 0) {
                setQuiz(quizData[0]); // Lấy quiz đầu tiên của bài học
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const recordStudentProgress = async (lessonTitle: string) => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                await academicApi.recordLessonProgress(lessonId, {
                    studentId: user._id || user.id, // Lấy ID của học sinh đang đăng nhập
                    courseId: courseId,
                    lessonTitle: lessonTitle,
                    timeSpent: 0, // Vừa vào thì timeSpent = 0
                });
            }
        } catch (error) {
            console.log('Lỗi ghi nhận tiến độ:', error);
        }
    };

    // Hàm lấy ID Youtube từ URL
    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Hàm gọi API bắt đầu làm bài
    const handleStartQuiz = async () => {
        if (!quiz) return;
        try {
            const userData = await AsyncStorage.getItem('user');
            if (!userData) return;
            const user = JSON.parse(userData);

            const response = await academicApi.startQuiz(quiz._id, {
                studentId: user.id || user._id, // Ưu tiên dùng ID UUID của Postgres
                studentName: user.fullName || 'Học sinh'
            });
            const responseData = response.data.data || response.data;
            setAttemptId(responseData._id);
            setCurrentQuestionIndex(0);
            setUserAnswers([]);
            setQuizResult(null);
            setCurrentScore(0);
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể bắt đầu làm bài');
        }
    };

    // Hàm chọn đáp án
    const handleSelectOption = (optionId: string) => {
        if (!quiz) return;
        const currentQuestion = quiz.questions[currentQuestionIndex];
        
        const newAnswers = [...userAnswers];
        const answerIndex = newAnswers.findIndex(a => a.questionId === currentQuestion.id);
        
        if (answerIndex > -1) {
            newAnswers[answerIndex].answer = optionId;
        } else {
            newAnswers.push({ questionId: currentQuestion.id, answer: optionId });
        }
        setUserAnswers(newAnswers);
    };

    // Hàm gọi API Nộp bài
    const handleSubmitQuiz = async () => {
        if (!attemptId) return;
        setIsSubmitting(true);
        try {
            const response = await academicApi.submitQuiz(attemptId, userAnswers);
            const responseData = response.data.data || response.data;
            
            console.log("Submit Quiz Response:", responseData);
            console.log("Rewards received:", responseData.rewards);
            
            setQuizResult(responseData); 
            
            // Cập nhật lại profile
            await userApi.getProfile(); 
        } catch (error: any) {
            Alert.alert('Lỗi', 'Không thể nộp bài, vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderQuizContent = () => {
        if (!quiz) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Bài học này chưa có bài kiểm tra.</Text>
                </View>
            );
        }

        // TRẠNG THÁI 1: Đã nộp bài (Xem kết quả vinh danh)
        if (quizResult) {
            const pointsAwarded = quizResult.rewards?.points || 0;
            const coinsAwarded = quizResult.rewards?.coins || 0;

            return (
                <View style={styles.resultContainer}>
                    <View style={styles.medalWrapper}>
                        <View style={styles.medalCircle}>
                            <Ionicons name="ribbon" size={80} color="#f1c40f" />
                        </View>
                        <Ionicons name="star" size={24} color="#f1c40f" style={styles.starSmall} />
                        <Ionicons name="star" size={32} color="#f1c40f" style={styles.starLarge} />
                    </View>

                    <Text style={styles.resultTitle}>Xuất sắc!</Text>
                    <Text style={styles.resultDesc}>
                        Bạn đã hoàn thành bài học và trả lời đúng {(quizResult.answers?.filter((a: any) => a.isCorrect).length) || 0}/{quiz.questions.length} câu.
                    </Text>

                    <View style={styles.rewardRow}>
                        <View style={styles.rewardCard}>
                            <Text style={styles.rewardLabel}>ĐIỂM THƯỞNG</Text>
                            <Text style={[styles.rewardValue, { color: '#3498db' }]}>+{pointsAwarded}</Text>
                        </View>
                        <View style={styles.rewardCard}>
                            <Text style={styles.rewardLabel}>XU NHẬN ĐƯỢC</Text>
                            <Text style={[styles.rewardValue, { color: '#f39c12' }]}>+{coinsAwarded}</Text>
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.mainActionBtn} 
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.mainActionText}>Về danh sách bài học</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryBtn} onPress={handleStartQuiz}>
                        <Ionicons name="refresh" size={20} color="#3498db" style={{ marginRight: 8 }} />
                        <Text style={styles.secondaryBtnText}>Làm lại</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // TRẠNG THÁI 2: Đang làm bài
        if (attemptId) {
            const currentQuestion = quiz.questions[currentQuestionIndex];
            const currentAnswerId = userAnswers.find(a => a.questionId === currentQuestion?.id)?.answer;
            const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

            return (
                <View style={styles.quizSection}>
                    <View style={styles.quizHeader}>
                        <Text style={styles.quizCount}>Câu {currentQuestionIndex + 1} / {quiz.questions.length}</Text>
                        <View style={styles.scoreBadge}>
                            <Text style={styles.scoreText}>Điểm: {currentScore}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }]} />
                    </View>

                    <Text style={styles.questionText}>{currentQuestion?.question}</Text>

                    {currentQuestion?.options.map((option) => {
                        const isSelected = currentAnswerId === option.id;
                        const isCorrect = option.isCorrect;
                        
                        let cardStyle: any[] = [styles.optionCard];
                        let radioStyle: any[] = [styles.optionRadio];
                        let textStyle: any[] = [styles.optionText];

                        if (isAnswerChecked) {
                            if (isCorrect) {
                                cardStyle.push(styles.correctOption);
                                textStyle.push(styles.correctText);
                                radioStyle.push(styles.correctRadio);
                            } else if (isSelected) {
                                cardStyle.push(styles.wrongOption);
                                textStyle.push(styles.wrongText);
                                radioStyle.push(styles.wrongRadio);
                            }
                        } else if (isSelected) {
                            cardStyle.push(styles.selectedOption);
                        }

                        return (
                            <TouchableOpacity 
                                key={option.id} 
                                style={cardStyle}
                                onPress={() => !isAnswerChecked && handleSelectOption(option.id)}
                                disabled={isAnswerChecked}
                            >
                                <View style={radioStyle}>
                                    {isCorrect && isAnswerChecked ? <Ionicons name="checkmark" size={16} color="white" /> : 
                                     !isCorrect && isSelected && isAnswerChecked ? <Ionicons name="close" size={16} color="white" /> :
                                     isSelected ? <View style={styles.radioInner} /> : null}
                                </View>
                                <Text style={textStyle}>{option.text}</Text>
                            </TouchableOpacity>
                        );
                    })}

                    {/* GIẢI THÍCH BOX (Chỉ hiện SAU KHI bấm Kiểm tra) */}
                    {isAnswerChecked && (
                        <View style={styles.explanationBox}>
                            <View style={styles.explanationHeader}>
                                <Ionicons name="information-circle" size={20} color="#3498db" />
                                <Text style={styles.explanationTitle}>Lời giải chi tiết:</Text>
                            </View>
                            <Text style={styles.explanationText}>
                                {currentQuestion.explanation || "Đáp án đúng là " + (currentQuestion.options.find(o => o.isCorrect)?.text) + ". Hãy ghi nhớ kiến thức này nhé!"}
                            </Text>
                        </View>
                    )}

                    <View style={styles.navButtons}>
                        {!isAnswerChecked ? (
                            <TouchableOpacity 
                                style={[styles.submitBtn, !currentAnswerId && styles.disabledBtn]} 
                                disabled={!currentAnswerId}
                                onPress={() => {
                                    setIsAnswerChecked(true);
                                    // Kiểm tra xem có đúng không để cộng điểm local
                                    const correctOptionId = currentQuestion.options.find(o => o.isCorrect)?.id;
                                    if (currentAnswerId === correctOptionId) {
                                        setCurrentScore(prev => prev + 10);
                                    }
                                }}
                            >
                                <Text style={styles.submitBtnText}>Kiểm tra</Text>
                            </TouchableOpacity>
                        ) : (
                            !isLastQuestion ? (
                                <TouchableOpacity 
                                    style={styles.nextBtn} 
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setCurrentQuestionIndex(prev => prev + 1);
                                        setIsAnswerChecked(false); // Reset trạng thái cho câu tiếp theo
                                    }}
                                >
                                    <Text style={styles.nextBtnText}>Tiếp theo</Text>
                                    <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity 
                                    style={styles.submitBtn} 
                                    disabled={isSubmitting}
                                    onPress={handleSubmitQuiz}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Text style={styles.submitBtnText}>Hoàn thành</Text>
                                            <Ionicons name="checkmark-done" size={22} color="white" style={{ marginLeft: 8 }} />
                                        </>
                                    )}
                                </TouchableOpacity>
                            )
                        )}
                    </View>
                </View>
            );
        }

        // TRẠNG THÁI 3: Màn hình chờ bắt đầu
        return (
            <View style={styles.startQuizContainer}>
                <Ionicons name="document-text" size={80} color="#3498db" />
                <Text style={styles.quizTitle}>{quiz.title}</Text>
                <Text style={styles.quizDesc}>{quiz.description}</Text>
                <View style={styles.quizMeta}>
                    <Text style={styles.metaInfo}>🕒 {quiz.timeLimit ? `${quiz.timeLimit} phút` : 'Không giới hạn'}</Text>
                    <Text style={styles.metaInfo}>📝 {quiz.questions.length} câu hỏi</Text>
                </View>
                <TouchableOpacity style={styles.startBtn} onPress={handleStartQuiz}>
                    <Text style={styles.startBtnText}>BẮT ĐẦU LUYỆN TẬP</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'video' && styles.activeTab]}
                    onPress={() => setActiveTab('video')}
                >
                    <Text style={[styles.tabText, activeTab === 'video' && styles.activeTabText]}>Bài học</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'quiz' && styles.activeTab]}
                    onPress={() => {
                        setActiveTab('quiz');
                        if (quiz && !attemptId && !quizResult) {
                            handleStartQuiz();
                        }
                    }}
                >
                    <Text style={[styles.tabText, activeTab === 'quiz' && styles.activeTabText]}>
                        {attemptId ? `Điểm: ${currentScore}` : 'Luyện tập'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {activeTab === 'video' ? (
                    <View>
                        {videoContent?.url ? (
                            <YoutubePlayer
                                height={220}
                                play={false}
                                videoId={getYoutubeId(videoContent.url) || ''}
                                webColor="black" 
                            />
                        ) : (
                            <View style={styles.videoPlaceholder}>
                                <Ionicons name="document-text" size={64} color="white" />
                                <Text style={styles.videoText}>Bài học lý thuyết</Text>
                            </View>
                        )}

                        <View style={styles.contentSection}>
                            <Text style={styles.lessonDetailTitle}>{lesson?.title}</Text>
                            <RenderHtml
                                contentWidth={width - 40}
                                source={{ html: lesson?.description || '' }}
                                tagsStyles={{
                                    p: { fontSize: 16, color: '#334155', lineHeight: 26, marginBottom: 12 },
                                    h3: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 20, marginBottom: 12 },
                                    li: { fontSize: 16, color: '#334155', marginBottom: 5 },
                                    b: { color: '#000', fontWeight: 'bold' }
                                }}
                            />
                            
                            {lesson?.contents?.filter((c: any) => c.type === 'document').map((doc: any) => (
                                <View key={doc.id} style={styles.docCard}>
                                    <View style={styles.docIconBg}>
                                        <Ionicons name="document-text" size={22} color="#3b82f6" />
                                    </View>
                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                        <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
                                        <Text style={styles.docSub}>Tài liệu đính kèm • PDF</Text>
                                    </View>
                                    <Ionicons name="download-outline" size={20} color="#94a3b8" />
                                </View>
                            ))}

                            <TouchableOpacity 
                                style={styles.startPracticeBtnLarge} 
                                onPress={() => {
                                    setActiveTab('quiz');
                                    if (quiz && !attemptId && !quizResult) {
                                        handleStartQuiz();
                                    }
                                }}
                            >
                                <Text style={styles.startPracticeTextLarge}>Bắt đầu làm bài tập</Text>
                                <Ionicons name="arrow-forward" size={22} color="white" style={{ marginLeft: 10 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    renderQuizContent()
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingVertical: 15,
        backgroundColor: 'white'
    },
    headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#2c3e50', flex: 1, textAlign: 'center' },
    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
    activeTab: { borderBottomWidth: 3, borderBottomColor: '#3498db' },
    tabText: { fontSize: 15, fontWeight: 'bold', color: '#bdc3c7' },
    activeTabText: { color: '#3498db' },
    scrollContent: { paddingBottom: 30 },
    videoPlaceholder: { 
        width: '100%', 
        height: 220, 
        backgroundColor: '#2c3e50', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    videoText: { color: 'white', marginTop: 10, fontSize: 16, fontWeight: 'bold' },
    contentSection: { padding: 20 },
    lessonDetailTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15 },
    lessonBody: { fontSize: 15, color: '#34495e', lineHeight: 24 },
    docCard: { 
        marginTop: 20, 
        padding: 15, 
        backgroundColor: '#f8fbfc', 
        borderRadius: 12, 
        flexDirection: 'row', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#edf2f7'
    },
    docTitle: { fontWeight: 'bold', fontSize: 14, color: '#2d3748' },
    docSub: { fontSize: 12, color: '#718096', marginTop: 2 },
    
    quizSection: { paddingHorizontal: 20, paddingTop: 10 },
    quizHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 12 
    },
    quizCount: { fontSize: 13, color: '#64748b', fontWeight: '600' },
    scoreBadge: { 
        backgroundColor: '#f0f9ff', 
        paddingHorizontal: 12, 
        paddingVertical: 5, 
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#bae6fd'
    },
    scoreText: { fontSize: 13, fontWeight: 'bold', color: '#0369a1' },
    progressBarContainer: { 
        width: '100%', 
        height: 8, 
        backgroundColor: '#f1f5f9', 
        borderRadius: 10, 
        marginBottom: 25, 
        overflow: 'hidden' 
    },
    progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 10 },
    questionText: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#1e293b', 
        marginBottom: 25, 
        lineHeight: 30 
    },
    optionCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: 16, 
        borderRadius: 16, 
        borderWidth: 2, 
        borderColor: '#f1f5f9', 
        marginBottom: 12,
        backgroundColor: 'white',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    selectedOption: { borderColor: '#3b82f6', backgroundColor: '#f0f9ff' },
    correctOption: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
    optionText: { fontSize: 16, color: '#334155', fontWeight: '500', flex: 1 },
    correctText: { color: '#065f46', fontWeight: 'bold' },
    optionRadio: { 
        width: 24, 
        height: 24, 
        borderRadius: 12, 
        borderWidth: 2, 
        borderColor: '#cbd5e1', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    selectedRadio: { borderColor: '#3b82f6', backgroundColor: 'white' },
    correctRadio: { borderColor: '#10b981', backgroundColor: '#10b981' },
    radioInner: { 
        width: 12, 
        height: 12, 
        borderRadius: 6, 
        backgroundColor: '#3b82f6' 
    },
    wrongOption: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
    wrongText: { color: '#991b1b' },
    wrongRadio: { borderColor: '#ef4444', backgroundColor: '#ef4444' },
    
    explanationBox: { 
        backgroundColor: '#f8fafc', 
        padding: 16, 
        borderRadius: 16, 
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6'
    },
    explanationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    explanationTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginLeft: 8 },
    explanationText: { fontSize: 14, color: '#475569', lineHeight: 22 },

    navButtons: { marginTop: 25 },
    nextBtn: { 
        flexDirection: 'row',
        backgroundColor: '#3b82f6', 
        paddingVertical: 16, 
        borderRadius: 14, 
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    nextBtnText: { color: 'white', fontSize: 17, fontWeight: 'bold' },
    submitBtn: { 
        flexDirection: 'row',
        backgroundColor: '#3b82f6', 
        paddingVertical: 16, 
        borderRadius: 14, 
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitBtnText: { color: 'white', fontSize: 17, fontWeight: 'bold' },
    disabledBtn: { backgroundColor: '#cbd5e0' },

    // RESULT STYLES
    resultContainer: { alignItems: 'center', padding: 25, marginTop: 30 },
    medalWrapper: { marginBottom: 30, position: 'relative' },
    medalCircle: { 
        width: 140, 
        height: 140, 
        borderRadius: 70, 
        backgroundColor: '#fff9db', 
        justifyContent: 'center', 
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#f1c40f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    starSmall: { position: 'absolute', left: -10, bottom: 20 },
    starLarge: { position: 'absolute', right: -15, top: 10 },
    resultTitle: { fontSize: 26, fontWeight: 'bold', color: '#2c3e50', marginTop: 10 },
    resultDesc: { fontSize: 15, color: '#718096', textAlign: 'center', marginTop: 12, lineHeight: 22 },
    rewardRow: { flexDirection: 'row', marginTop: 30, marginBottom: 40 },
    rewardCard: { 
        flex: 1, 
        backgroundColor: 'white', 
        borderRadius: 15, 
        padding: 15, 
        marginHorizontal: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#edf2f7',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    rewardLabel: { fontSize: 11, fontWeight: 'bold', color: '#a0aec0', marginBottom: 8 },
    rewardValue: { fontSize: 24, fontWeight: 'bold' },
    mainActionBtn: { 
        width: '100%',
        backgroundColor: '#2563eb', 
        paddingVertical: 16, 
        borderRadius: 12, 
        alignItems: 'center',
        marginBottom: 15
    },
    mainActionText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    secondaryBtn: { 
        flexDirection: 'row',
        width: '100%',
        backgroundColor: 'white', 
        paddingVertical: 15, 
        borderRadius: 12, 
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    secondaryBtnText: { color: '#4a5568', fontWeight: 'bold', fontSize: 16 },

    docCard: { 
        marginTop: 15, 
        padding: 14, 
        backgroundColor: '#f8fafc', 
        borderRadius: 16, 
        flexDirection: 'row', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    docIconBg: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    docTitle: { fontWeight: 'bold', fontSize: 15, color: '#1e293b' },
    docSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
    
    startPracticeBtnLarge: {
        flexDirection: 'row',
        backgroundColor: '#4f46e5', // Màu xanh tím đậm như screenshot
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 35,
        marginBottom: 20,
        elevation: 6,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
    },
    startPracticeTextLarge: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },

    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: '#95a5a6', fontSize: 16 },
    startQuizContainer: { alignItems: 'center', padding: 25, marginTop: 40 },
    quizTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginTop: 25, textAlign: 'center' },
    quizDesc: { fontSize: 15, color: '#7f8c8d', marginTop: 12, textAlign: 'center', lineHeight: 22 },
    quizMeta: { flexDirection: 'row', marginTop: 30, marginBottom: 40 },
    metaInfo: { marginHorizontal: 12, fontSize: 15, fontWeight: 'bold', color: '#34495e' },
    startBtn: { backgroundColor: '#3498db', paddingVertical: 16, paddingHorizontal: 50, borderRadius: 30 },
    startBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
