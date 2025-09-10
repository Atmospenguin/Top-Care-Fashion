# Migration Notes: Testimonials Integration into Feedbacks

## Overview
Testimonials have been integrated into the unified feedback system. The `testimonials` table is now deprecated and all functionality has been moved to the `feedback` table.

## Database Changes

### New Schema
The `feedback` table now includes:
- `user_name` - Display name for testimonials
- `rating` - 1-5 star rating for testimonials  
- `tags` - JSON array of tags for testimonials
- `featured` - Boolean flag for homepage display
- `feedback_type` - ENUM('feedback', 'testimonial') to distinguish types

### Migration Required
To migrate existing data, run this SQL after deploying the new schema:

```sql
-- Migrate existing testimonials to unified feedback table
INSERT INTO feedback (user_name, message, rating, tags, featured, feedback_type, created_at)
SELECT user_name, text, rating, tags, featured, 'testimonial', created_at 
FROM testimonials;

-- After confirming migration success, drop the old table
-- DROP TABLE testimonials;
```

## API Changes

### Updated Endpoints
- `/api/testimonials` - Now reads from feedback table with testimonial filter
- `/api/admin/feedback` - Now handles both feedback and testimonials
- `/api/admin/testimonials` - Still works but writes to feedback table

### New Features
- Unified admin interface for managing both feedback and testimonials
- Filter by type (feedback/testimonial)
- Enhanced testimonial creation with all original features
- Backward compatibility maintained for existing testimonials API

## Files Modified
- `web/database/schema.sql` - Updated schema
- `web/src/types/admin.ts` - Updated types
- `web/src/app/api/admin/feedback/route.ts` - Enhanced for unified system
- `web/src/app/api/testimonials/route.ts` - Updated to use feedback table
- `web/src/app/api/admin/testimonials/route.ts` - Updated to use feedback table
- `web/src/app/admin/feedback/page.tsx` - Complete rewrite for unified management
- `web/src/app/admin/content/page.tsx` - Updated to use new system

## Sample Test Accounts

The database includes 10 test accounts for comprehensive testing:

| Username | Email | Password | Role | Premium | Use Case |
|----------|-------|----------|------|---------|----------|
| admin | admin@topcare.com | *hashed* | Admin | Yes | Administrative testing |
| fashionista_emma | emma@example.com | *hashed* | User | Yes | Premium user features |
| vintage_hunter | vintage@gmail.com | *hashed* | User | No | Regular user, vintage focus |
| style_guru_alex | alex@fashion.co | *hashed* | User | Yes | Premium seller testing |
| casual_buyer | buyer@email.com | *hashed* | User | No | Buyer experience testing |
| premium_seller | seller@pro.com | *hashed* | User | Yes | Premium seller features |
| trend_setter | trends@style.net | *hashed* | User | No | Social features testing |
| eco_warrior | eco@green.org | *hashed* | User | Yes | Sustainability features |
| budget_shopper | budget@student.edu | *hashed* | User | No | Budget-focused testing |
| luxury_lover | luxury@designer.com | *hashed* | User | Yes | High-end market testing |

**Note**: All passwords are bcrypt hashed placeholders (`$2b$10$hashedpasswordX`). For testing:
1. Implement password reset functionality, or
2. Update passwords directly in database:
   ```sql
   UPDATE users SET password_hash = '$2b$10$actualhashedpassword' WHERE username = 'admin';
   ```

## Sample Data Overview

The database now contains:
- **29 Feedback/Testimonials**: Mixed content for testing filtering
- **15 Product Listings**: Across 10 categories, various price points ($25-200)
- **10 Transactions**: Different statuses for testing workflows
- **8 User Reviews**: With ratings for testing review system
- **8 FAQ Entries**: 6 answered, 2 pending for testing admin workflow
- **4 Moderation Reports**: Various statuses for testing moderation
- **Site Statistics**: Realistic numbers for homepage display

## Testing Checklist
1. ✅ Verify testimonials still display on homepage
2. ✅ Test admin feedback management with both types
3. ✅ Confirm testimonial creation through admin interface
4. ✅ Test filtering and search functionality
5. ✅ Verify featured testimonials appear correctly
6. ✅ Test tag system for testimonials
7. ✅ Confirm rating system works (1-5 stars)
8. ✅ Test anonymous vs registered feedback
9. ✅ Verify email functionality for registered users
10. ✅ Test admin content management interface
11. ✅ Confirm backward compatibility with existing APIs
