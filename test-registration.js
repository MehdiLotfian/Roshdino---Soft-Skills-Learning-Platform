const fetch = require('node-fetch');

async function testRegistration() {
    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'mehdi.lotfian',
                password: 'M12345679',
                email: 'mehdi.lotfian@example.com',
                firstName: 'mehdi.lotfian',
                lastName: 'User',
                role: 'user'
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testRegistration(); 