// test-preview-function.js
const fetch = require('node-fetch');

async function testPreview() {
  try {
    console.log('🧪 Testing Preview Function...');
    
    // First login to get a token
    const loginResponse = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@rsud.id',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${errorText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    console.log('✅ Login successful');
    
    // Test preview endpoint
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`📅 Testing preview for ${startDate} to ${endDate}`);
    
    const previewResponse = await fetch('http://localhost:3001/admin/shift-optimization/preview-optimal-shifts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        schedulingType: 'weekly'
      })
    });
    
    if (!previewResponse.ok) {
      const errorData = await previewResponse.text();
      throw new Error(`Preview failed: ${previewResponse.status} - ${errorData}`);
    }
    
    const result = await previewResponse.json();
    
    console.log('\n📊 Preview Results:');
    console.log(`   Total Requested: ${result.statistics?.totalRequested || 0}`);
    console.log(`   Total Assigned: ${result.statistics?.totalAssigned || 0}`);
    console.log(`   Fulfillment Rate: ${result.statistics?.fulfillmentRate || 0}%`);
    console.log(`   Conflicts: ${result.statistics?.conflicts?.length || 0}`);
    console.log(`   Preview Length: ${result.preview?.length || 0}`);
    
    if (result.preview && result.preview.length > 0) {
      console.log('\n🎯 Sample Assignments:');
      result.preview.slice(0, 5).forEach((assignment, index) => {
        console.log(`   ${index + 1}. ${assignment.userName} (${assignment.userRole}) - ${assignment.date} at ${assignment.location} (${assignment.shiftType})`);
      });
    }
    
    if (result.recommendations && result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n✅ Preview test completed successfully!');
    
  } catch (error) {
    console.error('❌ Preview test failed:', error.message);
  }
}

testPreview();
