// Test script to verify timesheet settings functionality
// Run this with: node test-timesheet-settings.js

const testTimesheetSettings = async () => {
  try {
    console.log('🧪 Testing Timesheet Settings API...\n');

    // Test GET request
    console.log('1. Testing GET /api/timesheet-settings');
    const getResponse = await fetch('http://localhost:3000/api/timesheet-settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const getData = await getResponse.json();
    console.log('   Status:', getResponse.status);
    console.log('   Response:', JSON.stringify(getData, null, 2));

    if (getResponse.ok) {
      console.log('   ✅ GET request successful\n');
    } else {
      console.log('   ❌ GET request failed\n');
      return;
    }

    // Test PUT request
    console.log('2. Testing PUT /api/timesheet-settings');
    const putResponse = await fetch('http://localhost:3000/api/timesheet-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        require_approval: false,
        auto_clockout: true,
        allow_overtime: true
      }),
    });

    const putData = await putResponse.json();
    console.log('   Status:', putResponse.status);
    console.log('   Response:', JSON.stringify(putData, null, 2));

    if (putResponse.ok) {
      console.log('   ✅ PUT request successful\n');
    } else {
      console.log('   ❌ PUT request failed\n');
    }

    // Test GET again to verify persistence
    console.log('3. Testing GET again to verify persistence');
    const getResponse2 = await fetch('http://localhost:3000/api/timesheet-settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const getData2 = await getResponse2.json();
    console.log('   Status:', getResponse2.status);
    console.log('   Response:', JSON.stringify(getData2, null, 2));

    if (getData2.data && getData2.data.require_approval === false) {
      console.log('   ✅ Settings persisted correctly!\n');
    } else {
      console.log('   ❌ Settings did not persist\n');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testTimesheetSettings();
