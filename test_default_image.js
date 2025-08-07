// Test default image loading
async function testDefaultImage() {
  console.log('🚀 Testing default image loading...');
  
  try {
    const defaultImageUrl = `${window.location.origin}/default_avatar.jpg`;
    console.log('📸 Default image URL:', defaultImageUrl);
    
    const response = await fetch(defaultImageUrl);
    console.log('📸 Fetch response status:', response.status);
    console.log('📸 Fetch response ok:', response.ok);
    
    if (!response.ok) {
      console.error('❌ Failed to fetch default image:', response.status);
      return;
    }
    
    const blob = await response.blob();
    console.log('✅ Default image loaded as blob:', blob.size, 'bytes');
    
    const file = new File([blob], 'default_avatar.jpg', { type: 'image/jpeg' });
    console.log('✅ Default image converted to file:', file.name, file.size, 'bytes');
    
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('📤 Uploading to Cloudinary...');
    const uploadResponse = await fetch('/api/v1/streaming/upload/image', {
      method: 'POST',
      body: formData,
    });
    
    console.log('📡 Upload response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Upload failed:', errorText);
      return;
    }
    
    const uploadData = await uploadResponse.json();
    console.log('✅ Upload successful:', uploadData);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testDefaultImage();


