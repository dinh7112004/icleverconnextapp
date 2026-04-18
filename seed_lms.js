const axios = require('axios');

async function run() {
  try {
    console.log("Logging in as admin...");
    const login = await axios.post('http://localhost:3000/api/v1/auth/login', {
        identifier: 'admin@thcsnguyendu.edu.vn',
        password: 'password123'
    });
    const token = login.data.data.accessToken;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    console.log("Fetching subjects...");
    const subjectsRes = await axios.get('http://localhost:3000/api/v1/subjects', config);
    // Unwrap envelope: có thể là array thẳng hoặc { data: [...] }
    const subjectsList = Array.isArray(subjectsRes.data) ? subjectsRes.data : (subjectsRes.data?.data || []);
    const math = subjectsList.find(s => s.name === 'Toán học') || subjectsList[0];
    
    if (!math) {
        console.log("No subjects found in DB! Please seed subjects first."); 
        return;
    }
    console.log("Using subject:", math.name, "| id:", math.id);
    
    console.log("Fetching teacher...");
    const teachersReq = await axios.get('http://localhost:3000/api/v1/teachers', config);
    // Unwrap teacher list
    const teachersList = teachersReq.data?.items || teachersReq.data?.data || teachersReq.data || [];
    const teacher = Array.isArray(teachersList) ? teachersList[0] : null;
    const teacherId = teacher?.id || 'system';
    const teacherName = teacher?.fullName || 'Giáo viên';
    console.log("Using teacher:", teacherName, "| id:", teacherId);
    
    console.log("Creating LMS Course (or reusing existing)...");
    let courseMongoId;
    try {
        const courseRes = await axios.post('http://localhost:3000/api/v1/lms/courses', {
            code: 'TOAN-7-EXT',
            name: 'Toán Đại Số Lớp 7 (Mở rộng)',
            description: 'Khóa học bồi dưỡng kiến thức Toán lớp 7 cho học sinh',
            subjectId: math.id,
            subjectName: math.name,
            teacherId: teacherId,
            teacherName: teacherName,
            academicYear: '2024-2025',
            semester: '1',
            difficulty: 'intermediate',
        }, config);
        const courseData = courseRes.data?.data || courseRes.data;
        courseMongoId = courseData?._id || courseData?.id;
        console.log("Course created:", courseMongoId);
    } catch (e) {
        if (e.response?.data?.error?.message?.includes('đã tồn tại')) {
            // Course đã tồn tại -> tìm lại bằng query
            console.log("Course already exists, fetching it...");
            const existingRes = await axios.get('http://localhost:3000/api/v1/lms/courses', { 
                ...config, 
                params: { subjectId: math.id } 
            });
            const existingList = existingRes.data?.data || existingRes.data || [];
            const existing = Array.isArray(existingList) ? existingList[0] : null;
            courseMongoId = existing?._id || existing?.id;
            console.log("Reusing existing course:", courseMongoId);
        } else {
            throw e;
        }
    }
    
    // Tạo Lessons TRƯỚC khi Publish (backend yêu cầu ít nhất 1 bài học)
    console.log("Creating Lesson 1...");
    await axios.post('http://localhost:3000/api/v1/lms/lessons', {
        courseId: courseMongoId,
        title: 'Bài 1: Số hữu tỉ và các phép toán',
        description: 'Giới thiệu về tập hợp số hữu tỉ, các phép toán cộng trừ nhân chia cơ bản.',
        order: 1,
        estimatedMinutes: 45
    }, config).catch(e => console.log("Lesson 1 note:", e.response?.data?.error?.message || e.message));
    
    console.log("Creating Lesson 2...");
    await axios.post('http://localhost:3000/api/v1/lms/lessons', {
        courseId: courseMongoId,
        title: 'Bài 2: Giá trị tuyệt đối của số hữu tỉ',
        description: 'Định nghĩa và bài tập về giá trị tuyệt đối.',
        order: 2,
        estimatedMinutes: 30
    }, config).catch(e => console.log("Lesson 2 note:", e.response?.data?.error?.message || e.message));

    // Publish course SAU khi đã có bài học
    await axios.post(`http://localhost:3000/api/v1/lms/courses/${courseMongoId}/publish`, {}, config)
        .catch(e => console.log("Publish note:", e.response?.data?.error?.message || e.message));
    console.log("Course published!");
    
    console.log("Done! Mock LMS data created successfully.");
  } catch (e) {
    console.error("Error!!!", e.response?.data || e.message);
  }
}
run();
