
import fetch from 'node-fetch';

async function testApi() {
    try {
        const response = await fetch('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Hello'
            })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Raw Response:', text.substring(0, 500)); // Print first 500 chars

        try {
            const json = JSON.parse(text);
            console.log('JSON parsed successfully:', json);
        } catch (e) {
            console.error('Failed to parse JSON:', e.message);
        }
    } catch (error) {
        console.error('Network Error:', error);
    }
}

testApi();
