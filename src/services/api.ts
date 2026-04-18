/**
 * iClever App - Real API Service
 * Replaces all mock data with actual Axios calls to the NestJS backend.
 * Base URL: http://localhost:3000/api/v1
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Configuration ──────────────────────────────────────────────
const BASE_URL = 'http://localhost:3000/api/v1';

// ─── Axios Instance ─────────────────────────────────────────────
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Request Interceptor: tự động gắn JWT token ─────────────────
apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

import { authEvents } from './authEvents';

// ─── Response Interceptor: xử lý lỗi toàn cục ──────────────────
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Nếu token hết hạn (401), xóa token và redirect về Login
        if (error.response?.status === 401) {
            console.log('[API] Token expired (401), logging out...');
            await AsyncStorage.multiRemove(['userToken', 'refreshToken', 'user']);
            authEvents.emitLogout();
        }
        return Promise.reject(error);
    }
);

// ─── Auth ────────────────────────────────────────────────────────
export const authApi = {
    login: (data: { identifier: string; password: string }) =>
        apiClient.post('/auth/login', data),

    register: (data: { email: string; password: string; fullName?: string; role?: string }) =>
        apiClient.post('/auth/register', data),

    getProfile: () =>
        apiClient.get('/auth/me'),

    refresh: (refreshToken: string) =>
        apiClient.post('/auth/refresh', { refreshToken }),
};

// ─── User / Profile ──────────────────────────────────────────────
export const userApi = {
    getProfile: () =>
        apiClient.get('/auth/me'),

    updateRole: (role: 'student' | 'parent') =>
        apiClient.patch('/users/me/role', { role }),
};

// ─── Student ─────────────────────────────────────────────────────
export const studentApi = {
    getProfile: (studentId?: string) =>
        apiClient.get(studentId ? `/students/${studentId}` : '/students/me'),

    getAttendance: (studentId: string, params?: { startDate?: string; endDate?: string }) =>
        apiClient.get('/attendance', { params: { studentId, ...params } }),
};

// ─── Academic (Môn học, Bài học, TKB, Điểm số, Bài tập) ─────────
export const academicApi = {
    getSubjects: (gradeLevel?: number) =>
        apiClient.get('/subjects', { params: { gradeLevel } }),


    getLessons: (courseId: string) =>
        apiClient.get(`/lms/courses/${courseId}/lessons`),

    // Lấy danh sách Course theo SubjectId (cầu nối Subject -> Lessons)
    getCoursesBySubject: (subjectId: string, classId?: string) =>
        apiClient.get(`/lms/courses`, { params: { subjectId, classId } }),


    getLessonDetails: (lessonId: string) =>
        apiClient.get(`/lms/lessons/${lessonId}`),

    // Bổ sung API lưu tiến độ
    recordLessonProgress: (lessonId: string, data: {
        studentId: string;
        courseId: string;
        lessonTitle: string;
        timeSpent: number;
    }) => apiClient.post(`/lms/lessons/${lessonId}/progress`, data),

    // API Quiz
    getLessonQuizzes: (lessonId: string) =>
        apiClient.get(`/lms/lessons/${lessonId}/quizzes`),
        
    startQuiz: (quizId: string, data: { studentId: string; studentName: string }) =>
        apiClient.post(`/lms/quizzes/${quizId}/start`, data),
        
    submitQuiz: (attemptId: string, answers: Array<{ questionId: string; answer: any }>) =>
        apiClient.post(`/lms/quiz-attempts/${attemptId}/submit`, { answers }),

    getTimetable: (classId: string) =>
        apiClient.get('/schedules/timetable', { params: { classId } }),

    getGrades: (studentId: string) =>
        apiClient.get('/academic-records/grades', { params: { studentId } }),

    getGradeReport: (studentId: string, academicYearId: string, semester: string) =>
        apiClient.get(`/academic-records/grades/student/${studentId}/report`, { 
            params: { academicYearId, semester } 
        }),

    getHomeworks: (classId: string) =>
        apiClient.get('/lms/assignments', { params: { classId } }),

    submitHomework: (assignmentId: string, data: { textContent: string; files?: any[] }) =>
        apiClient.post(`/lms/assignments/${assignmentId}/submit`, data),

    getSubmissions: (studentId: string) =>
        apiClient.get('/lms/submissions', { params: { studentId } }),

    getAttendance: (studentId: string) =>
        apiClient.get('/attendance', { params: { studentId, limit: 30 } }),
};

// ─── Notifications ───────────────────────────────────────────────
export const notificationApi = {
    getAll: (params?: { page?: number; limit?: number }) =>
        apiClient.get('/notifications', { params }),

    markRead: (id: string) =>
        apiClient.patch(`/notifications/${id}/read`),
};

// ─── News / Tin tức trường học ───────────────────────────────────
export const newsApi = {
    getAll: (params?: { page?: number; limit?: number }) =>
        apiClient.get('/notifications', { params: { type: 'news', ...params } }),
};

// ─── Contact / Danh bạ giáo viên ─────────────────────────────────
export const contactApi = {
    getAll: (classId?: string) =>
        apiClient.get('/teachers', { params: { classId } }),
};

// ─── Tuition / Học phí ───────────────────────────────────────────
export const tuitionApi = {
    get: (studentId: string) =>
        apiClient.get('/payments', { params: { studentId } }),
};

// ─── Canteen Menu / Thực đơn bán trú ────────────────────────────
export const menuApi = {
    getWeek: () =>
        apiClient.get('/nutrition/menus/current-week'),

    getByDate: (date: string) =>
        apiClient.get('/nutrition/menus', { params: { date } }),
};

// ─── Schools ─────────────────────────────────────────────────────
export const schoolsApi = {
    getCurrentAcademicYear: (schoolId: string) =>
        apiClient.get(`/schools/academic-years/current/${schoolId}`),
};

// ─── Leave Requests / Xin nghỉ học ───────────────────────────────
export const leaveApi = {
    getAll: (params?: { studentId?: string; parentId?: string; status?: string }) =>
        apiClient.get('/leave-requests', { params }),

    submit: (data: {
        studentId: string;
        classId: string;
        type: 'day' | 'period';
        fromDate?: string;
        toDate?: string;
        singleDate?: string;
        periods?: number[];
        reason: string;
        attachmentUrl?: string;
    }) => apiClient.post('/leave-requests', data),

    getOne: (id: string) =>
        apiClient.get(`/leave-requests/${id}`),
};

// ─── Health / Y tế ────────────────────────────────────────────────
export const medicineApi = {
    getAll: (studentId: string) =>
        apiClient.get('/health/medicines', { params: { studentId } }),

    submit: (data: {
        studentId: string;
        name: string;
        dosage: string;
        time: string;
        note?: string;
        date: string;
        imageUrl?: string;
    }) => apiClient.post('/health/medicines', data),
};

export const notesApi = {
    getAll: (studentId: string) =>
        apiClient.get(`/health/notes/student/${studentId}`),

    getSchoolNotice: () =>
        apiClient.get('/schools/notice'),

    submit: (data: {
        studentId: string;
        type: 'allergy' | 'health' | 'diet' | 'other';
        title: string;
        content: string;
        isImportant?: boolean;
    }) => apiClient.post('/health/notes', data),


    delete: (id: string) =>
        apiClient.delete(`/health/notes/${id}`),
};

// ─── School Bus / Xe đưa đón ─────────────────────────────────────
export const busApi = {
    getInfo: (studentId: string) =>
        apiClient.get(`/transportation/student/${studentId}`),

    getAllRoutes: () =>
        apiClient.get('/transportation/routes'),
};

// ─── Library / Thư viện ───────────────────────────────────────────
export const libraryApi = {
    getBooks: (category?: string) =>
        apiClient.get('/library/books', { params: category ? { category } : undefined }),

    getBook: (id: string) =>
        apiClient.get(`/library/books/${id}`),
};

// ─── Surveys / Khảo sát ────────────────────────────────────────────
export const surveyApi = {
    getSurveys: (status?: string) =>
        apiClient.get('/surveys', { params: status ? { status } : undefined }),

    getSurvey: (id: string) =>
        apiClient.get(`/surveys/${id}`),
};

// ─── Chat / Tin nhắn ──────────────────────────────────────────────
export const chatApi = {
    getChats: () =>
        apiClient.get('/messaging/conversations'),

    getMessages: (chatId: string) =>
        apiClient.get(`/messaging/conversations/${chatId}/messages`),

    sendMessage: (chatId: string, content: string) =>
        apiClient.post(`/messaging/conversations/${chatId}/messages`, { content }),
};

// ─── Game ─────────────────────────────────────────────────────────
export const gameApi = {
    // Lấy câu hỏi toán học theo khối lớp
    getQuestions: (gradeLevel: number) =>
        apiClient.get('/games/math-rush/questions', { params: { gradeLevel } }),

    // Submit điểm số và nhận thưởng (coins, points)
    finishGame: (score: number, gameType: string) =>
        apiClient.post('/games/finish', { score, gameType }),
};


// ─── Timetable / Thời khóa biểu ────────────────────────────────────
export const scheduleApi = {
    // Gọi API lấy thời khóa biểu dựa theo classId
    getSchedulesByClass: (classId: string) => 
        apiClient.get(`/schedules?classId=${classId}&isActive=true&page=1&limit=100`),
};

// ─── Export default instance ─────────────────────────────────────
export default apiClient;
