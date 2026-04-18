import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Modal, Animated } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { gameApi } from '../services/api';
import { getCurrentUser } from '../services/userHelper';

export default function MathRushScreen({ navigation }: any) {
    const [gameState, setGameState] = useState<'loading' | 'playing' | 'result'>('loading');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [options, setOptions] = useState<number[]>([]);
    const [gameResult, setGameResult] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [feedbackColor, setFeedbackColor] = useState<string>('white');
    
    const timerRef = useRef<any>(null);
    const progressAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        handleStartGame();
        return () => clearInterval(timerRef.current);
    }, []);

    const handleStartGame = async () => {
        try {
            const u = await getCurrentUser();
            setUser(u);
            const gradeLevel = u?.level || 6;
            
            const response = await gameApi.getQuestions(gradeLevel);
            if (response.data.success) {
                const fetchedQuestions = response.data.data;
                setQuestions(fetchedQuestions);
                setGameState('playing');
                setCurrentQuestionIndex(0);
                loadQuestion(fetchedQuestions[0]);
                startTimer();
            }
        } catch (error: any) {
            console.error('Game initialization error:', error);
            Alert.alert('Lỗi', 'Không thể chuẩn bị phòng thi. Vui lòng thử lại sau.');
            navigation.goBack();
        }
    };

    const loadQuestion = (q: any) => {
        if (!q) return;
        setOptions(q.options);
    };

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleFinishGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        Animated.timing(progressAnim, {
            toValue: 0,
            duration: 60000,
            useNativeDriver: false,
        }).start();
    };

    const handleAnswer = (selected: number) => {
        const currentQuestion = questions[currentQuestionIndex];
        if (selected === currentQuestion.answer) {
            setScore(prev => prev + 10);
            setFeedbackColor('#2ecc71'); // Green flash
        } else {
            setFeedbackColor('#ff4757'); // Red flash
        }

        setTimeout(() => {
            setFeedbackColor('white');
            if (currentQuestionIndex < questions.length - 1) {
                const nextIdx = currentQuestionIndex + 1;
                setCurrentQuestionIndex(nextIdx);
                loadQuestion(questions[nextIdx]);
            } else {
                handleFinishGame();
            }
        }, 200);
    };

    const handleFinishGame = async () => {
        setGameState('result');
    };

    const postResult = async () => {
        setSaving(true);
        try {
            const response = await gameApi.finishGame(score, 'math_rush');
            setGameResult(response.data.data);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể lưu kết quả');
        } finally {
            setSaving(false);
        }
    };


    useEffect(() => {
        if (gameState === 'result') {
            postResult();
        }
    }, [gameState]);

    if (gameState === 'loading') {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Đang chuẩn bị phòng thi...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header / Timer Bar */}
            <View style={styles.gameHeader}>
                <Text style={styles.gameTitle}>MATH RUSH</Text>
                <Text style={styles.scoreText}>{score}</Text>
                <View style={styles.progressContainer}>
                    <Animated.View style={[styles.progressBar, { width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                    }) }]} />
                </View>
            </View>

            {/* Question Area */}
            <View style={styles.questionContainer}>
                <View style={styles.timeLeftContainer}>
                    <Ionicons name="timer-outline" size={20} color="white" />
                    <Text style={styles.timeLeftText}>{timeLeft}s</Text>
                </View>
                
                <Text style={[styles.formula, { color: feedbackColor }]}>
                    {questions[currentQuestionIndex]?.formula}
                </Text>
                <Text style={styles.equalSign}>= ?</Text>
            </View>

            {/* Options Grid */}
            <View style={styles.optionsGrid}>
                {options.map((opt, idx) => (
                    <TouchableOpacity 
                        key={idx} 
                        style={styles.optionBtn}
                        onPress={() => handleAnswer(opt)}
                    >
                        <Text style={styles.optionText}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Result Modal */}
            <Modal transparent visible={gameState === 'result'} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <FontAwesome5 name="trophy" size={80} color="#f1c40f" style={styles.trophyIcon} />
                        <Text style={styles.modalTitle}>Hết giờ!</Text>
                        <Text style={styles.modalSub}>Bạn đã làm rất tốt</Text>

                        <View style={styles.resultBox}>
                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Điểm số</Text>
                                <Text style={styles.resultValue}>{score}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Xu nhận được</Text>
                                <View style={styles.rewardValue}>
                                    <FontAwesome5 name="star" size={16} color="#f1c40f" style={{ marginRight: 8 }} />
                                    <Text style={[styles.resultValue, { color: '#f1c40f' }]}>+{gameResult?.addedCoins || 0}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, { backgroundColor: '#575fcf' }]}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.modalBtnText}>Thoát</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, { backgroundColor: '#ff4757' }]}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.modalBtnText}>Nhận thưởng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    loadingContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: 'white', marginTop: 15, fontSize: 16 },
    gameHeader: { alignItems: 'center', paddingVertical: 20 },
    gameTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    scoreText: { color: 'white', fontSize: 48, fontWeight: 'bold', marginVertical: 10 },
    progressContainer: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#2ecc71' },
    questionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    timeLeftContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, opacity: 0.8 },
    timeLeftText: { color: 'white', fontSize: 18, marginLeft: 8, fontWeight: '500' },
    formula: { color: 'white', fontSize: 64, fontWeight: 'bold' },
    equalSign: { color: '#6366f1', fontSize: 40, fontWeight: 'bold', marginTop: 10 },
    optionsGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        padding: 10, 
        justifyContent: 'center', 
        marginBottom: 40 
    },
    optionBtn: {
        width: '42%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 25,
        margin: 10,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    optionText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    
    // Result Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', backgroundColor: '#1e272e', borderRadius: 30, padding: 30, alignItems: 'center' },
    trophyIcon: { marginBottom: 20 },
    modalTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 10 },
    modalSub: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 30 },
    resultBox: { 
        width: '100%', 
        backgroundColor: 'rgba(255,255,255,0.05)', 
        borderRadius: 20, 
        padding: 20, 
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    resultLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
    resultValue: { color: 'white', fontSize: 28, fontWeight: 'bold' },
    rewardValue: { flexDirection: 'row', alignItems: 'center' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
    modalBtnRow: { flexDirection: 'row', gap: 15 },
    modalBtn: { flex: 1, paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
    modalBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
