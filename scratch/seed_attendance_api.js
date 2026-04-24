const axios = require('axios');

async function seedAttendanceViaApi() {
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

        console.log("Fetching Classes...");
        const classesRes = await axios.get(`${BASE_URL}/classes?schoolId=${schoolId}&limit=100`, config);
        const classes = classesRes.data?.data?.data || classesRes.data?.data;

        console.log("Fetching Students...");
        const studentsRes = await axios.get(`${BASE_URL}/students?schoolId=${schoolId}&limit=1000`, config);
        const allStudents = studentsRes.data?.data?.items || studentsRes.data?.items;

        if (!classes || classes.length === 0) {
            console.error("No classes found!");
            return;
        }
        if (!allStudents || allStudents.length === 0) {
            console.error("No students found!");
            return;
        }

        console.log(`Found ${classes.length} classes and ${allStudents.length} students.`);
        console.log("First student sample:", JSON.stringify(allStudents[0], null, 2));

        // Generate dates for the last 30 days
        const targetDates = [];
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            
            // Skip Sundays (0)
            if (d.getDay() !== 0) {
                targetDates.push(d.toISOString().split('T')[0]);
            }
        }

        console.log(`Seeding attendance for ${targetDates.length} days...`);
        
        let successCount = 0;

        for (const cls of classes) {
            const classStudents = allStudents.filter(s => s.currentClassId === cls.id);
            if (classStudents.length === 0) continue;

            for (const dateStr of targetDates) {
                const attendanceList = classStudents.map(student => {
                    // 85% present, 5% late, 5% absent, 5% excused
                    const rand = Math.random();
                    let status = 'present';
                    let note = '';
                    let reason = '';
                    
                    if (rand > 0.95) {
                        status = 'excused';
                        reason = 'Có phép do ốm';
                    } else if (rand > 0.90) {
                        status = 'absent';
                        reason = 'Không phép';
                    } else if (rand > 0.85) {
                        status = 'late';
                        note = 'Đi trễ 10 phút';
                    }

                    return {
                        studentId: student.id,
                        status: status,
                        note: note,
                        reason: reason,
                        checkInTime: status === 'present' ? `${dateStr}T07:00:00Z` : (status === 'late' ? `${dateStr}T07:10:00Z` : undefined)
                    };
                });

                try {
                    await axios.post(`${BASE_URL}/attendance/bulk`, {
                        classId: cls.id,
                        schoolId: schoolId,
                        date: dateStr,
                        session: 'all_day',
                        attendance: attendanceList
                    }, config);
                    successCount++;
                } catch (err) {
                    console.error(`Error seeding attendance for class ${cls.name} on ${dateStr}:`, err.response?.data || err.message);
                }
            }
        }

        console.log(`✅ Done seeding attendance via API! Created ${successCount} bulk records.`);
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
    }
}

seedAttendanceViaApi();
