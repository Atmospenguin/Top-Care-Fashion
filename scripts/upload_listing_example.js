/**
 * 上传 Listing 的示例脚本 (Node.js/JavaScript)
 * 
 * 使用方法：
 * 1. 安装依赖：npm install axios
 * 2. 设置环境变量或修改脚本中的配置
 * 3. 运行脚本：node upload_listing_example.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ========== 配置 ==========
const API_BASE_URL = process.env.API_BASE_URL || 'https://top-care-fashion.vercel.app';
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''; // 从登录后获取

// ========== API 端点 ==========
const CREATE_LISTING_ENDPOINT = `${API_BASE_URL}/api/listings/create`;
const UPLOAD_IMAGE_ENDPOINT = `${API_BASE_URL}/api/listings/upload-image`;

/**
 * 上传图片并返回图片 URL
 * @param {string} imagePath - 本地图片文件路径
 * @returns {Promise<string|null>} 上传后的图片 URL，失败返回 null
 */
async function uploadListingImage(imagePath) {
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ 图片文件不存在: ${imagePath}`);
    return null;
  }

  try {
    // 读取图片并转换为 base64
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    const filename = path.basename(imagePath);

    // 准备请求数据
    const payload = {
      imageData: imageBase64,
      fileName: filename
    };

    // 发送请求
    const response = await axios.post(UPLOAD_IMAGE_ENDPOINT, payload, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.data && response.data.imageUrl) {
      console.log(`✅ 图片上传成功: ${response.data.imageUrl}`);
      return response.data.imageUrl;
    } else {
      console.error('❌ 响应中没有 imageUrl 字段');
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error(`❌ 图片上传失败: HTTP ${error.response.status}`);
      console.error(`   错误信息: ${error.response.data}`);
    } else {
      console.error(`❌ 上传图片时出错: ${error.message}`);
    }
    return null;
  }
}

/**
 * 创建 listing
 * @param {Object} listingData - listing 数据对象
 * @returns {Promise<Object|null>} 创建成功的 listing 对象，失败返回 null
 */
async function createListing(listingData) {
  if (!AUTH_TOKEN) {
    console.error('❌ 错误: 未设置 AUTH_TOKEN');
    console.error('   请设置环境变量 AUTH_TOKEN 或在脚本中修改');
    return null;
  }

  // 验证必需字段
  const requiredFields = ['title', 'description', 'price', 'category', 'shippingOption'];
  const missingFields = requiredFields.filter(field => !listingData[field]);

  if (missingFields.length > 0) {
    console.error(`❌ 缺少必需字段: ${missingFields.join(', ')}`);
    return null;
  }

  try {
    const response = await axios.post(CREATE_LISTING_ENDPOINT, listingData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.data && response.data.success && response.data.data) {
      const listing = response.data.data;
      console.log('✅ Listing 创建成功!');
      console.log(`   ID: ${listing.id}`);
      console.log(`   标题: ${listing.title}`);
      console.log(`   价格: $${listing.price}`);
      return listing;
    } else {
      console.error('❌ 响应格式错误:', response.data);
      return null;
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 401) {
        console.error('❌ 认证失败: Token 无效或已过期');
        console.error('   请重新登录获取新的 token');
      } else if (status === 403) {
        console.error(`❌ 创建失败: ${errorData.message || 'Listing limit reached'}`);
      } else {
        console.error(`❌ 创建失败: HTTP ${status}`);
        console.error(`   错误信息: ${errorData.error || errorData.message || error.response.statusText}`);
      }
    } else {
      console.error(`❌ 网络请求错误: ${error.message}`);
    }
    return null;
  }
}

/**
 * 主函数：示例用法
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Top Care Fashion - Listing 上传脚本示例');
  console.log('='.repeat(60));
  console.log();

  // 检查 token
  if (!AUTH_TOKEN) {
    console.log('⚠️  警告: 未设置 AUTH_TOKEN');
    console.log('   请先设置环境变量或在脚本中修改 AUTH_TOKEN');
    console.log();
    console.log('   获取 token 的方法：');
    console.log('   1. 登录后从浏览器开发者工具 Network 标签中获取');
    console.log('   2. 使用登录 API 获取 token');
    console.log();
    return;
  }

  // ========== 示例 1: 上传图片 ==========
  console.log('📸 示例 1: 上传图片');
  console.log('-'.repeat(60));

  // 如果你有本地图片，可以上传
  // const imageUrl = await uploadListingImage('path/to/your/image.jpg');
  // 如果没有图片，可以使用已有的图片 URL
  const imageUrls = [
    'https://example.com/image1.jpg', // 替换为实际的图片 URL
    'https://example.com/image2.jpg',
  ];

  console.log(`使用图片 URLs: ${imageUrls.join(', ')}`);
  console.log();

  // ========== 示例 2: 创建 listing ==========
  console.log('📝 示例 2: 创建 listing');
  console.log('-'.repeat(60));

  // 构建 listing 数据
  const listingData = {
    // 必需字段
    title: '示例商品标题',
    description: '这是一个示例商品描述。可以包含商品的详细信息、使用情况等。',
    price: 99.99,
    category: 'Tops', // 可选值: "Accessories", "Bottoms", "Footwear", "Outerwear", "Tops"
    shippingOption: 'Standard', // 可选值: "Standard", "Express", "Meet-up"

    // 可选字段
    brand: '示例品牌',
    size: 'M', // 例如: "S", "M", "L", "XL", "38", "39", "N/A" 等
    condition: 'Good', // 可选值: "Brand New", "Like New", "Good", "Fair", "Poor"
    material: 'Cotton',
    tags: ['vintage', 'casual', 'summer'],
    gender: 'Unisex', // 可选值: "Men", "Women", "Unisex"
    images: imageUrls, // 图片 URL 数组
    shippingFee: 5.00, // 运费（可选）
    location: 'New York, NY', // 如果是 Meet-up，需要提供位置
    quantity: 1, // 库存数量，默认为 1
  };

  // 创建 listing
  const result = await createListing(listingData);

  if (result) {
    console.log();
    console.log('='.repeat(60));
    console.log('✅ 成功!');
    console.log('='.repeat(60));
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log();
    console.log('='.repeat(60));
    console.log('❌ 失败!');
    console.log('='.repeat(60));
  }
}

/**
 * 批量上传多个 listings
 * @param {Array} listings - listing 数据数组
 * @returns {Promise<Array>} 成功创建的 listing 列表
 */
async function batchUploadListings(listings) {
  const results = [];

  for (let i = 0; i < listings.length; i++) {
    console.log(`\n[${i + 1}/${listings.length}] 处理 listing...`);
    const result = await createListing(listings[i]);
    if (result) {
      results.push(result);
    }
    // 可以添加延迟以避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n✅ 成功创建 ${results.length}/${listings.length} 个 listings`);
  return results;
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createListing, uploadListingImage, batchUploadListings };


