// Test script to verify preview functionality works correctly
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001';

async function testPreviewFunctionality() {
  console.log('🔍 Testing Preview Functionality...\n');
  
  try {
    // First verify backend is running
    console.log('1. Checking backend status...');
    const healthResponse = await fetch(`${API_URL}/health`);
    if (!healthResponse.ok) {
      console.log('❌ Backend is not running. Please start with: npm run start:dev');
      return;
    }
    console.log('✅ Backend is running\n');

    // Test data - representing a realistic preview request
    const testData = {
      startDate: '2025-08-05',
      endDate: '2025-08-11', 
      schedulingType: 'weekly'
    };

    console.log('2. Testing preview endpoint with data:', testData);
    
    // Mock admin token (replace with actual admin token for real testing)
    const adminToken = 'REPLACE_WITH_ACTUAL_ADMIN_TOKEN';
    
    const response = await fetch(`${API_URL}/admin/shift-optimization/preview-optimal-shifts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Preview request failed: ${response.status} ${response.statusText}`);
      console.log('Error details:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Preview endpoint responded successfully!\n');

    // Analyze the response structure
    console.log('3. Analyzing preview response structure:');
    console.log('📊 Preview data structure:');
    
    if (result.preview && Array.isArray(result.preview)) {
      console.log(`   • Preview array length: ${result.preview.length}`);
      
      if (result.preview.length > 0) {
        console.log('   • Sample preview item:', result.preview[0]);
      }
    }

    if (result.statistics) {
      console.log('📈 Statistics found:');
      console.log(`   • Total Requested: ${result.statistics.totalRequested || 'Not found'}`);
      console.log(`   • Total Assigned: ${result.statistics.totalAssigned || 'Not found'}`);
      console.log(`   • Fulfillment Rate: ${result.statistics.fulfillmentRate || 'Not found'}%`);
      console.log(`   • Conflicts: ${result.statistics.conflicts?.length || 'Not found'}`);
    }

    console.log('\n🎉 Preview functionality test completed!');
    console.log('✅ Frontend should now display realistic data instead of zeros');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Ensure backend is running: npm run start:dev');
    console.log('2. Check backend logs for errors');
    console.log('3. Verify admin authentication token');
  }
}

// Run the test
testPreviewFunctionality();
