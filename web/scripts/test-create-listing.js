// 测试创建 listing
async function testCreateListing() {
  try {
    console.log('🚀 Testing create listing API...');
    
    const listingData = {
      title: "Test Listing",
      description: "This is a test listing created via API",
      price: 25.99,
      brand: "Test Brand",
      size: "M",
      condition: "Good",
      material: "Cotton",
      tags: ["Test", "Demo"],
      category: "Tops",
      images: [],
      shippingOption: "Free shipping",
      location: "Test Location"
    };
    
    const response = await fetch('http://localhost:3001/api/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 注意：这里需要有效的认证 token
      },
      body: JSON.stringify(listingData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Listing created:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCreateListing();
