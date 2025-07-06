// Using built-in fetch (Node.js 18+)

async function testAPI() {
    console.log('🧪 Testing Roshdino API endpoints...\n');

    const baseURL = 'http://localhost:3000/api';

    // Test 1: Check if server is running
    try {
        console.log('1. Testing server connection...');
        const response = await fetch(`${baseURL}/auth/profile`);
        console.log(`   Status: ${response.status}`);
        console.log('   ✅ Server is running!\n');
    } catch (error) {
        console.log('   ❌ Server is not running or not accessible');
        console.log(`   Error: ${error.message}\n`);
        return;
    }

    // Test 2: Test registration
    try {
        console.log('2. Testing user registration...');
        const registerResponse = await fetch(`${baseURL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'testuser',
                password: 'testpass123',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'user'
            })
        });

        const registerData = await registerResponse.json();
        console.log(`   Status: ${registerResponse.status}`);
        console.log(`   Response: ${JSON.stringify(registerData, null, 2)}`);
        
        if (registerData.success) {
            console.log('   ✅ Registration successful!\n');
        } else {
            console.log('   ⚠️ Registration failed (might be duplicate user)\n');
        }
    } catch (error) {
        console.log('   ❌ Registration test failed');
        console.log(`   Error: ${error.message}\n`);
    }

    // Test 3: Test login
    try {
        console.log('3. Testing user login...');
        const loginResponse = await fetch(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'testuser',
                password: 'testpass123'
            })
        });

        const loginData = await loginResponse.json();
        console.log(`   Status: ${loginResponse.status}`);
        console.log(`   Response: ${JSON.stringify(loginData, null, 2)}`);
        
        if (loginData.success) {
            console.log('   ✅ Login successful!\n');
            
            // Test 4: Test authenticated endpoint
            console.log('4. Testing authenticated endpoint...');
            const profileResponse = await fetch(`${baseURL}/auth/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${loginData.token}`,
                    'Content-Type': 'application/json',
                }
            });

            const profileData = await profileResponse.json();
            console.log(`   Status: ${profileResponse.status}`);
            console.log(`   Response: ${JSON.stringify(profileData, null, 2)}`);
            
            if (profileData.success) {
                console.log('   ✅ Authentication working!\n');
            } else {
                console.log('   ❌ Authentication failed\n');
            }
        } else {
            console.log('   ❌ Login failed\n');
        }
    } catch (error) {
        console.log('   ❌ Login test failed');
        console.log(`   Error: ${error.message}\n`);
    }

    // Test 5: Test quiz endpoints
    try {
        console.log('5. Testing quiz endpoints...');
        const quizResponse = await fetch(`${baseURL}/quizzes/role/student`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const quizData = await quizResponse.json();
        console.log(`   Status: ${quizResponse.status}`);
        console.log(`   Response: ${JSON.stringify(quizData, null, 2)}`);
        
        if (quizData.success) {
            console.log('   ✅ Quiz endpoints working!\n');
        } else {
            console.log('   ⚠️ Quiz endpoints failed (might need authentication)\n');
        }
    } catch (error) {
        console.log('   ❌ Quiz test failed');
        console.log(`   Error: ${error.message}\n`);
    }

    console.log('🎉 API testing completed!');
}

// Run the test
testAPI().catch(console.error); 