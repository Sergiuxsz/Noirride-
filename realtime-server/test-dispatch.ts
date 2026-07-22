import axios from 'axios';

async function testDispatch() {
  try {
    const res = await axios.post('http://localhost:8080/api/dispatch', {
      rideId: 'NR-9999',
      pickupLocation: 'Bucuresti',
      destination: 'Constanta'
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.error('Error:', err.response?.data || err.message);
  }
}
testDispatch();
