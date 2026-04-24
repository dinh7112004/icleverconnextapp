const axios = require('axios');

async function seedTimetableViaApi() {
    const BASE_URL = 'http://192.168.1.181:3000/api/v1'; // Update to the current local API url

    try {
        console.log("Logging in as admin...");
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            identifier: 'admin@thcsnguyendu.edu.vn',
            password: 'password123'
        });
        const token = loginRes.data.data.accessToken;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        console.log("Fetching school info...");
        const schoolRes = await axios.get(`${BASE_URL}/schools/my-school`, config).catch(() => null);
        let schoolId = schoolRes?.data?.data?.id;
        if (!schoolId) {
            const schoolsRes = await axios.get(`${BASE_URL}/schools`, config);
            schoolId = schoolsRes.data?.data?.data?.[0]?.id || schoolsRes.data?.data?.[0]?.id;
        }

        if (!schoolId) {
            console.error("Could not find schoolId");
            return;
        }
        console.log("Using School ID:", schoolId);

        console.log("Fetching Academic Year...");
        const academicRes = await axios.get(`${BASE_URL}/schools/academic-years/list?schoolId=${schoolId}`, config);
        const academicYearId = academicRes.data?.data?.data?.[0]?.id || academicRes.data?.data?.[0]?.id;
        
        console.log("Fetching Classes...");
        const classesRes = await axios.get(`${BASE_URL}/classes?schoolId=${schoolId}&limit=100`, config);
        const classes = classesRes.data?.data?.data || classesRes.data?.data;

        console.log("Fetching Subjects...");
        const subjectsRes = await axios.get(`${BASE_URL}/subjects`, config);
        const subjects = subjectsRes.data?.data?.data || subjectsRes.data?.data;

        console.log("Fetching Teachers...");
        const teachersRes = await axios.get(`${BASE_URL}/teachers?schoolId=${schoolId}&limit=100`, config);
        const teachers = teachersRes.data?.data?.data || teachersRes.data?.data;

        if (!classes || classes.length === 0) {
            console.error("No classes found!");
            return;
        }
        if (!subjects || subjects.length === 0) {
            console.error("No subjects found!");
            return;
        }

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const periods = [
            { period: 1, startTime: '07:00', endTime: '07:45' },
            { period: 2, startTime: '07:50', endTime: '08:35' },
            { period: 3, startTime: '08:40', endTime: '09:25' },
            { period: 4, startTime: '09:45', endTime: '10:30' },
            { period: 5, startTime: '10:35', endTime: '11:20' },
            { period: 6, startTime: '13:00', endTime: '13:45' }, // Afternoon 1 slot
        ];

        console.log(`Seeding timetable for ${classes.length} classes...`);
        
        for (const cls of classes) {
            const schedules = [];

            for (const day of days) {
                for (const p of periods) {
                    // Pick a random subject
                    const subject = subjects[Math.floor(Math.random() * subjects.length)];
                    // Find a teacher for this subject, or any teacher
                    let teacher = teachers.find(t => t.specialization === subject.name);
                    if (!teacher) teacher = teachers[Math.floor(Math.random() * teachers.length)];

                    schedules.push({
                        classId: cls.id,
                        schoolId: schoolId,
                        academicYearId: academicYearId,
                        semester: 'SEMESTER_1',
                        dayOfWeek: day,
                        period: p.period,
                        startTime: p.startTime + ':00',
                        endTime: p.endTime + ':00',
                        subjectId: subject.id,
                        teacherId: teacher ? teacher.id : undefined,
                        room: cls.room || `P${cls.name}`,
                        scheduleType: 'regular',
                        isActive: true
                    });
                }
            }

            // Delete old schedules first if needed? We'll rely on bulk create to update/upsert
            try {
                await axios.post(`${BASE_URL}/schedules/bulk`, {
                    classId: cls.id,
                    academicYearId: academicYearId,
                    semester: 'SEMESTER_1',
                    schedules: schedules
                }, config);
                console.log(`- Seeded full timetable (6 periods/day) for Class ${cls.name}`);
            } catch (err) {
                console.error(`Error seeding class ${cls.name}:`, err.response?.data || err.message);
            }
        }

        console.log("✅ Done seeding timetables via API!");
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
    }
}

seedTimetableViaApi();
