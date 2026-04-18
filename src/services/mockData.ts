export const MOCK_USER = {
    id: 'mock_user_123',
    fullName: 'Nguyễn Minh Anh',
    email: 'student2@iclever.com',
    className: 'Lớp 7A1',
    schoolName: 'Trường THCS iClever',
    level: 5,
    levelName: 'Chiến binh học đường',
    points: 800,
    coins: 50,
    role: 'student', // 'student' or 'parent'
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
    badges: ['Học tập tốt', 'Chuyên cần'],
    achievements: [
        { title: 'Hoàn thành Unit 1', date: new Date().toISOString() }
    ]
};

export const setMockUserRole = (role: 'student' | 'parent') => {
    MOCK_USER.role = role;
};

export const MOCK_NEWS = [
    {
        _id: 'news1',
        title: 'Lễ khai giảng năm học mới 2024-2025',
        content: 'Thầy và trò trường THCS iClever long trọng tổ chức lễ khai giảng, chào đón năm học mới với nhiều niềm vui và khí thế học tập sôi nổi.',
        imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800',
        badge: 'HOẠT ĐỘNG TRƯỜNG',
        sourceName: 'Trường THCS iClever',
        sourceIcon: 'school',
        likesCount: 154,
        createdAt: new Date().toISOString()
    },
    {
        _id: 'news2',
        title: 'Chương trình dã ngoại định hướng Lớp 7A1',
        content: 'Các lớp tích cực tập luyện chuẩn bị cho Hội diễn văn nghệ và tham gia dã ngoại cuối tuần tại Ba Vì để gắn kết tinh thần đồng đội.',
        imageUrl: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800',
        badge: 'HOẠT ĐỘNG LỚP',
        sourceName: 'Lớp 7A1 - GVCN Cô Thu',
        sourceIcon: 'account-group',
        likesCount: 89,
        createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
        _id: 'news3',
        title: 'Ngày hội thể thao iClever Games 2024',
        content: 'Cùng cổ vũ các vận động viên nhí tham gia tranh tài ở các bộ môn bóng đá, bóng rổ và điền kinh tại sân vận động trường.',
        imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800',
        badge: 'HOẠT ĐỘNG TRƯỜNG',
        sourceName: 'Bầu trời iClever',
        sourceIcon: 'star',
        likesCount: 231,
        createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
        _id: 'news4',
        title: 'Cuộc thi Hùng biện tiếng Anh cấp trường',
        content: 'Thách thức bản thân với chủ đề "Green Future" và giành những giải thưởng hấp dẫn từ trung tâm anh ngữ quốc tế.',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800',
        badge: 'HOẠT ĐỘNG TRƯỜNG',
        sourceName: 'Khoa Ngoại Ngữ',
        sourceIcon: 'translate',
        likesCount: 112,
        createdAt: new Date(Date.now() - 259200000).toISOString()
    },
    {
        _id: 'news5',
        title: 'Họp phụ huynh định kỳ Học kỳ 1',
        content: 'Quý phụ huynh lớp 7A1 lưu ý lịch họp để trao đổi về tình hình học tập và định hướng phát triển cho con em mình.',
        imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800',
        badge: 'HOẠT ĐỘNG LỚP',
        sourceName: 'Văn phòng Nhà trường',
        sourceIcon: 'office-building',
        likesCount: 45,
        createdAt: new Date(Date.now() - 345600000).toISOString()
    }
];

export const MOCK_SUBJECTS = [
    { _id: 'sub1', name: 'Toán học', code: 'MATH7', icon: 'calculator', color: '#e74c3c' },
    { _id: 'sub2', name: 'Ngữ văn', code: 'LIT7', icon: 'book', color: '#3498db' },
    { _id: 'sub3', name: 'Tiếng Anh', code: 'ENG7', icon: 'language', color: '#2ecc71' },
    { _id: 'sub4', name: 'Vật lý', code: 'PHYS7', icon: 'atom', color: '#f1c40f' }
];

export const MOCK_GRADES = [
    // Toán (MOCK_SUBJECTS[0])
    { _id: 'g1', subject: MOCK_SUBJECTS[0], type: 'Miệng', score: 8, weight: 1 },
    { _id: 'g2', subject: MOCK_SUBJECTS[0], type: '15 phút', score: 9, weight: 1 },
    { _id: 'g3', subject: MOCK_SUBJECTS[0], type: '15 phút', score: 8.5, weight: 1 },
    { _id: 'g4', subject: MOCK_SUBJECTS[0], type: 'Miệng', score: 9, weight: 1 },
    { _id: 'g5', subject: MOCK_SUBJECTS[0], type: '1 tiết', score: 8.5, weight: 2 },
    { _id: 'g6', subject: MOCK_SUBJECTS[0], type: 'Học kỳ', score: 9, weight: 3 },
    
    // Ngữ Văn (MOCK_SUBJECTS[1])
    { _id: 'g7', subject: MOCK_SUBJECTS[1], type: 'Miệng', score: 7, weight: 1 },
    { _id: 'g8', subject: MOCK_SUBJECTS[1], type: '15 phút', score: 8, weight: 1 },
    { _id: 'g9', subject: MOCK_SUBJECTS[1], type: '15 phút', score: 7.5, weight: 1 },
    { _id: 'g10', subject: MOCK_SUBJECTS[1], type: 'Miệng', score: 8, weight: 1 },
    { _id: 'g11', subject: MOCK_SUBJECTS[1], type: '1 tiết', score: 7.5, weight: 2 },
    { _id: 'g12', subject: MOCK_SUBJECTS[1], type: 'Học kỳ', score: 8, weight: 3 },

    // Tiếng Anh (MOCK_SUBJECTS[2])
    { _id: 'g13', subject: MOCK_SUBJECTS[2], type: 'Miệng', score: 9, weight: 1 },
    { _id: 'g14', subject: MOCK_SUBJECTS[2], type: '15 phút', score: 9.5, weight: 1 },
    { _id: 'g15', subject: MOCK_SUBJECTS[2], type: '15 phút', score: 9, weight: 1 },
    { _id: 'g16', subject: MOCK_SUBJECTS[2], type: 'Miệng', score: 10, weight: 1 },
    { _id: 'g17', subject: MOCK_SUBJECTS[2], type: '1 tiết', score: 9, weight: 2 },
    { _id: 'g18', subject: MOCK_SUBJECTS[2], type: 'Học kỳ', score: 9.5, weight: 3 }
];

export const MOCK_HOMEWORK = [
    {
        _id: 'hw1',
        title: 'Bài tập về số hữu tỉ',
        description: 'Hoàn thành bài tập 1, 2, 3 trang 15 SGK Toán 7 tập 1. Chú ý trình bày sạch đẹp.',
        subject: MOCK_SUBJECTS[0], // Toán
        className: 'Lớp 7A1',
        deadLine: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        teacher: { fullName: 'Cô Nguyễn Thị Hoa' }
    },
    {
        _id: 'hw2',
        title: 'Soạn bài: Cổng trường mở ra',
        description: 'Đọc kỹ văn bản và trả lời các câu hỏi phần Đọc - Hiểu văn bản.',
        subject: MOCK_SUBJECTS[1], // Ngữ Văn
        className: 'Lớp 7A1',
        deadLine: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        teacher: { fullName: 'Thầy Lê Văn Tám' }
    },
    {
        _id: 'hw3',
        title: 'Unit 1: My Hobbies - Vocabulary',
        description: 'Học thuộc từ mới và đặt 5 câu với các từ đã học.',
        subject: MOCK_SUBJECTS[2], // Tiếng Anh
        className: 'Lớp 7A1',
        deadLine: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        teacher: { fullName: 'Cô Mary' }
    },
    {
        _id: 'hw4',
        title: 'Báo cáo thực hành: Đo độ dài',
        description: 'Nộp báo cáo thực hành theo nhóm.',
        subject: MOCK_SUBJECTS[3], // Vật lý
        className: 'Lớp 7A1',
        deadLine: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        teacher: { fullName: 'Thầy Hoàng Văn Hải' }
    }
];

export const MOCK_TIMETABLE = [
    {
        dayOfWeek: 'Thứ 2',
        lessons: [
            { startTime: '08:00', endTime: '08:45', subject: { name: 'Chào cờ' }, teacher: { fullName: 'Toàn trường' }, room: 'Sân trường' },
            { startTime: '08:50', endTime: '09:35', subject: { name: 'Toán' }, teacher: { fullName: 'Cô Thu' }, room: 'P.201' },
            { startTime: '09:50', endTime: '10:35', subject: { name: 'Tiếng Việt' }, teacher: { fullName: 'Cô Thu' }, room: 'P.201' },
            { startTime: '10:40', endTime: '11:25', subject: { name: 'Tiếng Anh' }, teacher: { fullName: 'Ms. Sarah' }, room: 'P.201' },
            null // Tiết 5 trống
        ]
    },
    {
        dayOfWeek: 'Thứ 3',
        lessons: [
            { startTime: '08:00', endTime: '08:45', subject: { name: 'Thể dục' }, teacher: { fullName: 'Thầy Đức' }, room: 'Sân tập' },
            { startTime: '08:50', endTime: '09:35', subject: { name: 'Toán' }, teacher: { fullName: 'Cô Thu' }, room: 'P.201' },
            { startTime: '09:50', endTime: '10:35', subject: { name: 'Mỹ thuật' }, teacher: { fullName: 'Cô Hạnh' }, room: 'P.Mỹ Thuật' },
            { startTime: '10:40', endTime: '11:25', subject: { name: 'Tự nhiên & XH' }, teacher: { fullName: 'Cô Thu' }, room: 'P.201' },
            null
        ]
    },
    {
        dayOfWeek: 'Thứ 4',
        lessons: [
            { startTime: '08:00', endTime: '08:45', subject: { name: 'Tiếng Việt' }, teacher: { fullName: 'Cô Thu' }, room: 'P.201' },
            { startTime: '08:50', endTime: '09:35', subject: { name: 'Tiếng Việt' }, teacher: { fullName: 'Cô Thu' }, room: 'P.201' },
            { startTime: '09:50', endTime: '10:35', subject: { name: 'Âm nhạc' }, teacher: { fullName: 'Cô Lan' }, room: 'P.Âm Nhạc' },
            { startTime: '10:40', endTime: '11:25', subject: { name: 'Kỹ năng sống' }, teacher: { fullName: 'Trung tâm' }, room: 'P.201' },
            null
        ]
    },
    {
        dayOfWeek: 'Thứ 5',
        lessons: [
            { startTime: '08:00', endTime: '08:45', subject: { name: 'Thể dục' }, teacher: { fullName: 'Thầy Đức' }, room: 'Sân tập' },
            { startTime: '08:50', endTime: '09:35', subject: { name: 'Toán' }, teacher: { fullName: 'Cô Thu' }, room: 'P.201' },
            { startTime: '09:50', endTime: '10:35', subject: { name: 'Tin học' }, teacher: { fullName: 'Thầy Hùng' }, room: 'P.Máy Tính' },
            { startTime: '10:40', endTime: '11:25', subject: { name: 'Tiếng Anh' }, teacher: { fullName: 'Ms. Sarah' }, room: 'P.201' },
            null
        ]
    },
    {
        dayOfWeek: 'Thứ 6',
        lessons: [
            { startTime: '08:00', endTime: '08:45', subject: { name: 'Tự nhiên & XH' }, teacher: { fullName: 'Cô Thu' }, room: 'P.201' },
            { startTime: '08:50', endTime: '09:35', subject: { name: 'Toán' }, teacher: { fullName: 'Cô Thu' }, room: 'P.201' },
            { startTime: '09:50', endTime: '10:35', subject: { name: 'Tiếng Việt' }, teacher: { fullName: 'Cô Thu' }, room: 'P.201' },
            { startTime: '10:40', endTime: '11:25', subject: { name: 'Sinh hoạt' }, teacher: { fullName: 'Cô Thu' }, room: 'P.201' },
            null
        ]
    }
];

export const MOCK_TUITION = {
    totalDue: 4700000,
    deadline: '25/09/2023',
    items: [
        { id: 'f1', name: 'Học phí tháng 9', period: 'Tháng 9/2023', amount: 3500000, status: 'unpaid', dueDate: '25/9/2023' },
        { id: 'f2', name: 'Tiền ăn bán trú T9', period: 'Tháng 9/2023', amount: 1200000, status: 'unpaid', dueDate: '25/9/2023' },
        { id: 'f3', name: 'Quỹ lớp kỳ 1', period: 'Tháng HK1', amount: 500000, status: 'paid', dueDate: '15/9/2023' },
        { id: 'f4', name: 'Học phí tháng 10', period: 'Tháng 10/2023', amount: 3500000, status: 'paid', dueDate: '05/10/2023' },
        { id: 'f5', name: 'Tiền bảo hiểm y tế', period: 'Năm học 2023-2024', amount: 650000, status: 'paid', dueDate: '30/09/2023' },
    ]
};

export const MOCK_MENU = [
    {
        date: '11/09/2023', dayName: 'THỨ HAI',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800',
        breakfast: 'Phở bò', lunch: 'Cơm, Thịt kho tàu, Canh rau ngót', snack: 'Sữa chua',
    },
    {
        date: '12/09/2023', dayName: 'THỨ BA',
        imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800',
        breakfast: 'Bún bò Huế', lunch: 'Cơm, Sườn nướng, Canh bí đỏ', snack: 'Trái cây tươi',
    },
    {
        date: '13/09/2023', dayName: 'THỨ TƯ',
        imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800',
        breakfast: 'Bánh mì trứng', lunch: 'Cơm, Gà hấp sả, Canh chua', snack: 'Bánh quy sữa',
    },
    {
        date: '14/09/2023', dayName: 'THỨ NĂM',
        imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800',
        breakfast: 'Cháo gà', lunch: 'Cơm, Bò xào nấm, Canh rau ngót', snack: 'Sữa tươi',
    },
    {
        date: '15/09/2023', dayName: 'THỨ SÁU',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800',
        breakfast: 'Phở bò', lunch: 'Cơm, Thịt kho tàu, Canh rau ngót', snack: 'Sữa chua',
    },
];

export const MOCK_LEAVE_REQUESTS = [
    { id: 'lr1', createdAt: '13/9/2023', displayDate: '13-09', reason: 'Sốt cao', attachment: 'Don_thuoc.jpg', status: 'approved' },
    { id: 'lr2', createdAt: '05/10/2023', displayDate: '05-10', reason: 'Khám sức khoẻ định kỳ', attachment: null, status: 'approved' },
    { id: 'lr3', createdAt: '15/11/2023', displayDate: '15-11', reason: 'Việc gia đình đột xuất', attachment: null, status: 'rejected' },
];

export const MOCK_ATTENDANCE = [
    { date: '15/09', dayName: 'Thứ Sáu', status: 'present', note: '' },
    { date: '14/09', dayName: 'Thứ Năm', status: 'present', note: '' },
    { date: '13/09', dayName: 'Thứ Tư', status: 'excused', note: 'Nghỉ ốm' },
    { date: '12/09', dayName: 'Thứ Ba', status: 'absent', note: 'Không rõ lý do' },
    { date: '11/09', dayName: 'Thứ Hai', status: 'present', note: '' },
    { date: '08/09', dayName: 'Thứ Sáu', status: 'present', note: '' },
];

export const MOCK_LESSONS = [
    {
        _id: 'les1',
        title: 'Số hữu tỉ và các phép toán',
        order: 1,
        content: 'Nội dung bài học về số hữu tỉ. Số hữu tỉ là số có thể viết dưới dạng phân số a/b với a, b là số nguyên và b khác 0.',
        youtubeId: 'https://www.youtube.com/watch?v=mf2Shj4zjF0', // Video Toán lớp 7
        questions: [
            {
                id: 'q1',
                type: 'multiple_choice',
                question: 'Số hữu tỉ là gì?',
                options: [
                    { id: 'o1', text: 'Là số tự nhiên', isCorrect: false },
                    { id: 'o2', text: 'Là phân số a/b (a,b ∈ Z, b ≠ 0)', isCorrect: true },
                    { id: 'o3', text: 'Là số thập phân vô hạn', isCorrect: false },
                    { id: 'o4', text: 'Là số vô tỉ', isCorrect: false }
                ],
                points: 10,
                explanation: 'Số hữu tỉ là số viết được dưới dạng phân số a/b với a, b là số nguyên và b khác 0.'
            },
            {
                id: 'q2',
                type: 'multiple_choice',
                question: 'Trong các số sau, số nào không phải số hữu tỉ?',
                options: [
                    { id: 'o5', text: '0', isCorrect: false },
                    { id: 'o6', text: '-5', isCorrect: false },
                    { id: 'o7', text: '2.5', isCorrect: false },
                    { id: 'o8', text: '√2', isCorrect: true }
                ],
                points: 10,
                explanation: '√2 là số vô tỉ không thể viết dưới dạng phân số hữu hạn.'
            }
        ]
    },
    {
        _id: 'les2',
        title: 'Số thập phân hữu hạn',
        order: 2,
        content: 'Nội dung bài học về số thập phân hữu hạn...',
        youtubeId: 'https://www.youtube.com/watch?v=mf2Shj4zjF0', // Video Toán lớp 7
        questions: [
            {
                id: 'q3',
                type: 'multiple_choice',
                question: 'Phân số nào sau đây viết được dưới dạng số thập phân hữu hạn?',
                options: [
                    { id: 'o9', text: '1/3', isCorrect: false },
                    { id: 'o10', text: '5/6', isCorrect: false },
                    { id: 'o11', text: '3/4', isCorrect: true },
                    { id: 'o12', text: '2/7', isCorrect: false }
                ],
                points: 10,
                explanation: '3/4 = 0.75 là số thập phân hữu hạn.'
            }
        ]
    }
];

export const MOCK_CONTACTS = [
    { _id: 'c1', name: 'Cô Trần Thị Thu', role: 'Toán - GVCN', phone: '0901234567', email: 'thu.tran@iclever.com', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150', isMainTeacher: true },
    { _id: 'c2', name: 'Thầy Nguyễn Văn Nam', role: 'Vật Lý', phone: '0912345678', email: 'nam.nguyen@iclever.com', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150', isMainTeacher: false },
    { _id: 'c3', name: 'Cô Lê Thị Hạnh', role: 'Mỹ Thuật', phone: '0923456789', email: 'hanh.le@iclever.com', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150', isMainTeacher: false },
    { _id: 'c4', name: 'Ms. Sarah', role: 'Tiếng Anh', phone: '0934567890', email: 'sarah.smith@iclever.com', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150', isMainTeacher: false }
];

export const MOCK_NOTIFICATIONS = [
    { 
        id: 'n1', 
        sender: 'GVCN Lớp 5A2', 
        title: 'Thông báo họp phụ huynh đầu năm', 
        content: 'Kính mời quý phụ huynh học sinh lớp 5A2 tham dự buổi họp phụ huynh đầu năm học 2023-2024. Thời gian: 8h...', 
        time: '08:30', 
        date: '15/09/2023', 
        type: 'general', 
        unread: true 
    },
    { 
        id: 'n2', 
        sender: 'Phòng Tài chính', 
        title: 'Thông báo đóng học phí tháng 9', 
        content: 'Nhà trường thông báo tới quý phụ huynh về việc đóng học phí và các khoản thu tháng 9/2023. Hạn nộp:...', 
        time: '14:00', 
        date: '10/09/2023', 
        type: 'payment', 
        unread: true 
    },
    { 
        id: 'n3', 
        sender: 'Hệ thống điểm danh', 
        title: 'BÉ MINH ANH VẮNG MẶT KHÔNG PHÉP', 
        content: 'Hệ thống ghi nhận học sinh vắng mặt tại buổi điểm danh sáng. Phụ huynh vui lòng kiểm tra.', 
        time: '08:00', 
        date: '12/09/2023', 
        type: 'attendance', 
        unread: false 
    },
    { 
        id: 'n4', 
        sender: 'Ban Giám Hiệu', 
        title: 'Thông báo nghỉ học do Bão số 5', 
        content: 'Theo chỉ đạo của Sở GD&ĐT, học sinh toàn trường được nghỉ học ngày mai (16/09) để đảm bảo an toàn trong bão.', 
        time: '17:30', 
        date: '15/09/2023', 
        type: 'emergency', 
        unread: true 
    },
    { 
        id: 'n5', 
        sender: 'Phòng Tài chính', 
        title: 'Xác nhận: Đã thanh toán học phí T9', 
        content: 'Nhà trường đã nhận được khoản học phí tháng 9 của học sinh Nguyễn Minh Anh. Trân trọng cảm ơn.', 
        time: '10:15', 
        date: '12/09/2023', 
        type: 'payment', 
        unread: false 
    },
    { 
        id: 'n6', 
        sender: 'Hệ thống điểm danh', 
        title: 'Bé Minh Anh đã vào trường', 
        content: 'Học sinh Nguyễn Minh Anh đã quẹt thẻ vào trường lúc 07:45 sáng nay.', 
        time: '07:46', 
        date: '15/09/2023', 
        type: 'attendance', 
        unread: false 
    },
    { 
        id: 'n7', 
        sender: 'Tổ ngoại khóa', 
        title: 'Thư mời: Lồng đèn thắp sáng ước mơ', 
        content: 'Trân trọng kính mời phụ huynh và các em học sinh tham dự đêm hội trung thu vào tối thứ 7 tuần này.', 
        time: '09:00', 
        date: '14/09/2023', 
        type: 'general', 
        unread: true 
    },
];

export const MOCK_STUDENT_NOTES = [
    { 
        id: 'sn1', 
        type: 'allergy', 
        title: 'DỊ ỨNG', 
        content: 'Cháu bị dị ứng với tôm và các loại hải sản vỏ cứng. Xin nhà trường lưu ý bữa ăn bán trú.', 
        isImportant: true, 
        updatedAt: '5/9/2023' 
    },
    { 
        id: 'sn2', 
        type: 'health', 
        title: 'SỨC KHỎE', 
        content: 'Cháu hay bị chảy máu cam khi vận động mạnh dưới trời nắng.', 
        isImportant: false, 
        updatedAt: '10/9/2023' 
    },
];

export const MOCK_SCHOOL_NOTICE = {
    title: 'Lưu ý từ nhà trường',
    content: 'Các thông tin sức khỏe quý phụ huynh cung cấp sẽ được bảo mật và chỉ chia sẻ với GVCN và bộ phận Y tế nhà trường để đảm bảo an toàn cho học sinh.'
};

export const MOCK_MEDICINE_INSTRUCTIONS = [
    { id: 'mi1', name: 'Thuốc ho Prospan', dosage: '5ml', time: '10:00', date: '15/9/2023', status: 'Chờ uống' },
    { id: 'mi2', name: 'Hạ sốt Hapacol', dosage: '1 gói', time: '14:30', date: '14/9/2023', status: 'Đã uống' },
];

export const MOCK_BUS_INFO = {
    driver: { name: 'Nguyễn Văn Tài', plate: '29B-123.45', phone: '0912345678', initials: 'TX' },
    monitor: { name: 'Cô Lê Thị Mây', role: 'Monitor', phone: '0987654321', initials: 'M' },
    schedule: [
        { title: 'Xuất phát', time: '06:30', status: 'done', icon: 'location' },
        { title: 'Tòa T1 Times City', time: '06:45', status: 'active', icon: 'navigate' },
        { title: 'Ngã tư Vọng', time: '07:00', status: 'pending', icon: 'location' },
        { title: 'Trường THCS Ngôi Sao', time: '07:15', status: 'pending', icon: 'location' },
    ]
};

export const MOCK_BOOKS = [
    { 
        id: 'b1', title: 'Dế Mèn phiêu lưu ký', author: 'Tô Hoài', 
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800', 
        category: 'Truyện tranh', status: 'Sẵn sàng', availability: 'Có sẵn',
        pages: 156, rating: 4.9, year: 1941,
        description: 'Tác phẩm văn học thiếu nhi kinh điển của nhà văn Tô Hoài, kể về cuộc phiêu lưu của chú Dế Mèn qua thế giới loài vật.'
    },
    { 
        id: 'b2', title: 'Cho tôi xin một vé đi tuổi thơ', author: 'Nguyễn Nhật Ánh', 
        imageUrl: 'https://images.unsplash.com/photo-1512820790803-73c1800ee793?auto=format&fit=crop&w=800', 
        category: 'Khoa học', status: 'Đang mượn', availability: 'Đã hết',
        pages: 210, rating: 4.8, year: 2021, returnDate: '25/10/2023',
        description: 'Cuốn sách đưa người đọc trở về với thế giới tuổi thơ hồn nhiên, đầy ắp tiếng cười và những bài học ý nghĩa.'
    },
    { 
        id: 'b3', title: 'Harry Potter và Hòn đá Phù thủy', author: 'J.K. Rowling', 
        imageUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800', 
        category: 'Truyện tranh', status: 'Sẵn sàng', availability: 'Có sẵn',
        pages: 350, rating: 5.0, year: 2000,
        description: 'Câu chuyện về cậu bé phù thủy Harry Potter và cuộc đối đầu với thế lực hắc ám của chúa tể Voldemort.'
    },
    { 
        id: 'b4', title: 'Toán học lớp 7', author: 'NXB Giáo Dục', 
        imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800', 
        category: 'Sách giáo khoa', status: 'Sẵn sàng', availability: 'Có sẵn',
        pages: 280, rating: 4.5, year: 2022,
        description: 'Sách giáo khoa bộ môn Toán dành cho học sinh lớp 7 theo chương trình giáo dục phổ thông mới.'
    },
    { 
        id: 'b5', title: 'Vật lý 7', author: 'NXB Giáo Dục', 
        imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800', 
        category: 'Sách giáo khoa', status: 'Sẵn sàng', availability: 'Đã hết',
        pages: 240, rating: 4.6, year: 2022,
        description: 'Sách giáo khoa bộ môn Vật lý lớp 7, cung cấp các kiến thức cơ bản về ánh sáng, âm thanh và điện học.'
    },
    { 
        id: 'b6', title: 'Vật lý vui', author: 'Yakov Perelman', 
        imageUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&w=800', 
        category: 'Khoa học', status: 'Sẵn sàng', availability: 'Có sẵn',
        pages: 250, rating: 4.8, year: 2021,
        description: 'Những câu chuyện, thí nghiệm vật lý thú vị giúp các em yêu thích môn học này hơn.'
    },
];

export const MOCK_CHATS = [
    { 
        id: 'chat1', name: 'Cô Trần Thị Thu', 
        lastMsg: 'Dạ vâng, tôi sẽ lưu ý nhắc nhở cháu thêm ạ.', 
        time: '10:30', unread: 0, avatar: '👩‍🏫', online: true 
    },
    { 
        id: 'chat2', name: 'Ms. Sarah', 
        lastMsg: 'Minh Anh needs to practice speaking more.', 
        time: 'Hôm qua', unread: 2, avatar: '👩🏽‍🏫', online: true 
    },
    { 
        id: 'chat3', name: 'Thầy Hùng Thể dục', 
        lastMsg: 'Em Minh Anh có tố chất thể thao rất tốt.', 
        time: 'Thứ 2', unread: 0, avatar: '👨🏻‍🏫', online: false 
    },
];

export const MOCK_MESSAGES = {
    'chat2': [
        { id: 'm1', text: 'Chào phụ huynh em Minh Anh.', time: '10:54 AM', senderType: 'teacher' },
        { id: 'm2', text: 'Em Minh Anh dạo này học tập rất tiến bộ.', time: '10:54 AM', senderType: 'teacher' },
        { id: 'm3', text: 'Cảm ơn cô ạ. Cháu về nhà cũng rất chịu khó làm bài tập.', time: '11:48 PM', senderType: 'parent' },
        { id: 'm4', text: 'Minh Anh needs to practice speaking more.', time: '10:54 AM', senderType: 'teacher' },
    ]
};

export const MOCK_SURVEYS = {
    ongoing: [
        { 
            id: 's1', 
            title: 'Khảo sát đăng ký BHYT năm học 2023-2024', 
            questions: 5, 
            expiryDate: '30/9/2023', 
            isNew: true 
        },
        { 
            id: 's2', 
            title: 'Phiếu lấy ý kiến về thực đơn bán trú', 
            questions: 3, 
            expiryDate: '15/9/2023', 
            isNew: true 
        },
    ],
    history: [
        { 
            id: 'sh1', 
            title: 'Đăng ký câu lạc bộ ngoại khóa kỳ 1', 
            status: 'completed' 
        },
        { 
            id: 'sh2', 
            title: 'Khảo sát chất lượng xe đưa đón', 
            status: 'expired' 
        },
    ]
};

export const MOCK_STUDENT_PROFILE = {
    personal: {
        studentId: 'S001',
        fullName: 'Nguyễn Minh Anh',
        dob: '15/08/2011',
        gender: 'Nữ',
        idCard: 'Chưa cập nhật',
        idIssueDate: '--/--/----',
        idIssuePlace: 'Cục CS QLHC',
        ethnicity: 'Kinh',
        hometown: 'Chưa cập nhật',
        address: 'Tòa T1, Times City, 458 Minh Khai, Hà Nội'
    },
    health: {
        height: 'cm',
        weight: 'kg',
        bloodType: 'Chưa rõ',
        vision: '10/10',
        insuranceId: 'Trống',
        importantNote: 'Tiền sử: Dị ứng hải sản vỏ cứng',
        lastCheckup: '05/09/2023 - Đạt loại Tốt'
    },
    contacts: {
        father: {
            name: 'Nguyễn Văn A',
            phone: '0912 345 678',
            job: 'Kỹ sư xây dựng'
        },
        mother: {
            name: 'Trần Thị B',
            phone: '0987 654 321',
            job: 'Giáo viên'
        }
    }
};

