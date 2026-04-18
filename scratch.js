const axios = require('axios');
async function test() {
    try {
        const login = await axios.post('http://localhost:3000/api/v1/auth/login', {
            identifier: 'phuhuynh1@thcsnguyendu.edu.vn',
            password: 'password123'
        });
        console.log("Login User:", login.data.data.user);
        
        const token = login.data.data.accessToken;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        try {
            const me = await axios.get('http://localhost:3000/api/v1/auth/me', config);
            console.log("Auth Me:", me.data);
        } catch (e) {
            console.log("Auth Me Error:", e.response?.data || e.message);
        }

        try {
            const childrenRes = await axios.get('http://localhost:3000/api/v1/parents/children', config);
            console.log("Children Info:", childrenRes.data);
        } catch (e) {
            console.log("Children Info Error:", e.response?.data || e.message);
        }
    } catch (e) {
        console.log("Login Error:", e.response?.data || e.message);
    }
}
test();
