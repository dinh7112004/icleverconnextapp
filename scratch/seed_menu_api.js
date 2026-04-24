const axios = require('axios');

async function seedViaApi() {
    const BASE_URL = 'http://192.168.1.181:3000/api/v1';
    
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
        // If my-school doesn't work, fetch all schools
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

        const targetDates = [];
        const today = new Date();
        for (let i = -7; i <= 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            targetDates.push(d.toISOString().split('T')[0]);
        }

        const menuItems = [
            { b: 'Phở bò tái lăn', l: 'Cơm trắng, Sườn xào chua ngọt', s: 'Váng sữa Monte', img: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=1000' },
            { b: 'Bún mọc sườn non', l: 'Cơm tấm, Chả trứng, Thịt nướng', s: 'Chè dưỡng nhan', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000' },
            { b: 'Bánh mì chảo', l: 'Bún chả Hà Nội, Nem rán', s: 'Sữa tươi TH True Milk', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000' },
            { b: 'Xôi xéo mỡ hành', l: 'Cơm, Cá thu sốt cà chua', s: 'Thạch rau câu', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000' },
            { b: 'Mì Quảng tôm thịt', l: 'Cơm, Thịt gà kho sả ớt', s: 'Sữa ngũ cốc', img: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1000' },
            { b: 'Bánh cuốn Thanh Trì', l: 'Cơm, Cá lóc kho tộ', s: 'Chè bưởi An Giang', img: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=1000' }
        ];

        console.log("Seeding menus via API...");
        for (let i = 0; i < targetDates.length; i++) {
            const date = targetDates[i];
            const item = menuItems[i % menuItems.length];
            
            const meals = [
                { mealType: 'BREAKFAST', dishName: item.b },
                { mealType: 'LUNCH', dishName: item.l },
                { mealType: 'AFTERNOON_SNACK', dishName: item.s }
            ];
            
            for (const meal of meals) {
                await axios.post(`${BASE_URL}/nutrition/menus`, {
                    schoolId,
                    date,
                    mealType: meal.mealType,
                    dishName: meal.dishName,
                    imageUrl: item.img
                }, config).catch(e => console.log(`Error seeding ${date} ${meal.mealType}:`, e.response?.data || e.message));
            }
            console.log(`- Seeded ${date}`);
        }
        
        console.log("✅ Done seeding menus via API!");
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
    }
}

seedViaApi();
