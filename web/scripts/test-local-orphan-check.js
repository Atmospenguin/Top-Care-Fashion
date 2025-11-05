require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n========================================');
console.log('LOCAL ORPHAN IMAGE CHECK');
console.log('========================================\n');

if (!supabaseUrl || !serviceKey) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const prisma = new PrismaClient();
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function checkOrphans() {
  try {
    console.log('Step 1: Fetching all files from listing-images bucket...');

    // List all files in bucket
    let allFiles = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase.storage
        .from('listing-images')
        .list('', { limit, offset, sortBy: { column: 'name', order: 'asc' } });

      if (error) {
        throw new Error(`Failed to list files: ${error.message}`);
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      // Filter only actual files (not folders)
      const files = data.filter(item =>
        item && item.metadata && typeof item.metadata.size === 'number'
      );

      allFiles.push(...files);

      if (data.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    console.log(`✓ Found ${allFiles.length} files in bucket\n`);

    console.log('Step 2: Checking listings.image_url...');
    const listingsWithImageUrl = await prisma.listings.findMany({
      where: {
        image_url: { not: null }
      },
      select: { image_url: true }
    });
    console.log(`✓ Found ${listingsWithImageUrl.length} listings with image_url\n`);

    console.log('Step 3: Checking listings.image_urls[]...');
    const listingsWithImageUrls = await prisma.listings.findMany({
      where: {
        image_urls: { not: null }
      },
      select: { image_urls: true }
    });
    console.log(`✓ Found ${listingsWithImageUrls.length} listings with image_urls array\n`);

    console.log('Step 4: Checking reviews.images[]...');
    const reviewsWithImages = await prisma.reviews.findMany({
      where: {
        images: { not: null }
      },
      select: { images: true }
    });
    console.log(`✓ Found ${reviewsWithImages.length} reviews with images\n`);

    console.log('Step 5: Building set of used image files...');
    const usedImageFiles = new Set();

    // Check listings.image_url
    for (const listing of listingsWithImageUrl) {
      if (listing.image_url) {
        const match = listing.image_url.match(/listing-images\/([^?]+)/);
        if (match) usedImageFiles.add(match[1]);
      }
    }

    // Check listings.image_urls (stored as JSON string!)
    for (const listing of listingsWithImageUrls) {
      if (listing.image_urls) {
        try {
          let urlsArray;
          if (typeof listing.image_urls === 'string') {
            urlsArray = JSON.parse(listing.image_urls);
          } else if (Array.isArray(listing.image_urls)) {
            urlsArray = listing.image_urls;
          }

          if (Array.isArray(urlsArray)) {
            for (const url of urlsArray) {
              if (typeof url === 'string' && url.includes('listing-images/')) {
                const match = url.match(/listing-images\/([^?]+)/);
                if (match) usedImageFiles.add(match[1]);
              }
            }
          }
        } catch (e) {
          console.error(`Failed to parse image_urls for listing ${listing.id}:`, e.message);
        }
      }
    }

    // Check reviews.images
    for (const review of reviewsWithImages) {
      if (review.images && Array.isArray(review.images)) {
        for (const url of review.images) {
          if (typeof url === 'string') {
            const match = url.match(/listing-images\/([^?]+)/);
            if (match) usedImageFiles.add(match[1]);
          }
        }
      }
    }

    console.log(`✓ Found ${usedImageFiles.size} unique image files referenced in database\n`);

    console.log('Step 6: Identifying orphan files...');
    const orphanFiles = allFiles.filter(file => !usedImageFiles.has(file.name));

    const totalSize = allFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
    const orphanSize = orphanFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);

    console.log('\n========================================');
    console.log('RESULTS');
    console.log('========================================\n');
    console.log(`Total files in bucket:      ${allFiles.length}`);
    console.log(`Referenced files:           ${allFiles.length - orphanFiles.length}`);
    console.log(`Orphan files:               ${orphanFiles.length}`);
    console.log(`Total storage:              ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Orphan storage wasted:      ${(orphanSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log('');

    if (orphanFiles.length > 0) {
      console.log('First 10 orphan files:');
      orphanFiles.slice(0, 10).forEach((file, i) => {
        const sizeMB = ((file.metadata?.size || 0) / (1024 * 1024)).toFixed(2);
        console.log(`  ${i + 1}. ${file.name} (${sizeMB} MB)`);
      });

      if (orphanFiles.length > 10) {
        console.log(`  ... and ${orphanFiles.length - 10} more`);
      }
    } else {
      console.log('✓ No orphan files found! All images are properly referenced.');
    }

    console.log('\n========================================\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrphans();
