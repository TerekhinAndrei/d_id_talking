// Simple test for stream creation
async function testStreamCreation() {
  console.log('🚀 Testing simple stream creation...');
  
  try {
    const response = await fetch('/api/v1/streaming/create-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
      }),
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response not ok:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Response data:', data);
    console.log('🔍 data.success:', data.success);
    console.log('🔍 typeof data.success:', typeof data.success);
    
    if (data.success) {
      console.log('✅ Stream created successfully!');
      console.log('🎬 Stream ID:', data.stream_id);
      console.log('🔗 Session ID:', data.session_id);
    } else {
      console.log('❌ Stream creation failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testStreamCreation();


