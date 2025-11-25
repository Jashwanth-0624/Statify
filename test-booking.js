const axios = require('axios');

async function testBooking() {
  try {
    console.log('Testing ticket booking...');
    const matchId = '6042291d-aa24-4fac-96ec-f0d460d87617';
    const stand = 'North Stand';

    const response = await axios.post(`http://localhost:3000/api/tickets/${matchId}/book`, {
      stand
    }, {
      validateStatus: () => true // Don't throw on any status code
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testBooking();
