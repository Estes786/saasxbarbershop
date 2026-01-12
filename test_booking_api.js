// Test API endpoint untuk booking
const axios = require('axios');

async function testBookingAPI() {
  console.log('🧪 TESTING BOOKING API...\n');
  
  const testData = {
    branch_id: '97bbf7bc-3e55-48ab-8210-31c0022ad164', // Bozq_1 branch
    customer_phone: '+628123456789',
    customer_name: 'Test Customer',
    service_id: 'test-service',
    service_name: 'Cukur Dewasa',
    capster_id: '366y',
    capster_name: '366y',
    booking_date: '2026-01-03',
    booking_time: '10:00',
    customer_notes: 'Test booking dari debugging'
  };
  
  console.log('📤 Sending booking data:', testData);
  
  try {
    const response = await axios.post('http://localhost:3000/api/transactions', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('\n✅ Booking SUCCESS!');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('\n❌ Booking FAILED!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testBookingAPI().catch(console.error);
