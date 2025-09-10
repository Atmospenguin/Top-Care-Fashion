# Changelog

All notable changes to the Top Care Fashion project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2024-09-10

### 🚀 Major Features
- **Unified Feedback System**: Integrated testimonials into a unified feedback management system
- **Enhanced Admin Interface**: Complete redesign of feedback management with support for both testimonials and user feedback
- **Comprehensive Sample Data**: Added extensive sample data for realistic testing and development

### ✨ Added
- New unified `feedback` table schema supporting both feedback and testimonials
- Enhanced TypeScript types with `FeedbackType` enum and updated `Feedback` interface
- New admin interface for creating, editing, and managing both feedback types
- Filter system for feedback types, email status, and other criteria
- Featured testimonials system for homepage display
- Tag system for categorizing testimonials
- Rating system (1-5 stars) for testimonials
- Comprehensive sample data including:
  - 10 user accounts with different roles and premium status
  - 10 product categories
  - 15 sample listings with realistic pricing and descriptions
  - 10 transaction records with various statuses
  - 8 user reviews with ratings
  - 29 feedback/testimonials entries (21 testimonials + 8 feedback)
  - 8 FAQ entries
  - 4 moderation reports
  - Updated site statistics

### 🔧 Changed
- **Database Schema**: Merged `testimonials` table into enhanced `feedback` table
- **API Endpoints**: Updated all testimonials-related APIs to use unified feedback system
- **Admin Content Page**: Modified to work with new unified system
- **Database Initialization**: Enhanced `init-db.js` with comprehensive sample data
- **Type Definitions**: Updated `admin.ts` types for unified feedback system

### 🗑️ Deprecated
- Old `testimonials` table (migration path provided in `MIGRATION_NOTES.md`)
- Separate testimonials management interface (replaced by unified system)

### 📝 Documentation
- Updated `development.md` with new database setup instructions
- Added comprehensive `MIGRATION_NOTES.md` for upgrading existing installations
- Documented sample user accounts and test data

### 🔒 Security
- All sample user passwords are properly hashed
- Maintained existing authentication and authorization patterns
- Added proper validation for new feedback types

### 🐛 Bug Fixes
- Fixed database initialization script to handle missing seed files
- Improved error handling in feedback API endpoints
- Enhanced form validation for testimonial creation

### 🏗️ Technical Details

#### Database Changes
```sql
-- New unified feedback table
CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_email VARCHAR(191) NULL,
  user_name VARCHAR(100) NULL COMMENT 'Display name for testimonials',
  message TEXT NOT NULL,
  rating TINYINT NULL COMMENT 'Rating 1-5 for testimonials',
  tags JSON NULL COMMENT 'Array of tags for testimonials',
  featured TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Featured on homepage',
  feedback_type ENUM('feedback', 'testimonial') NOT NULL DEFAULT 'feedback',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### API Changes
- `POST /api/admin/feedback` - Create feedback or testimonials
- `GET /api/admin/feedback` - Retrieve all feedback with type filtering
- `GET /api/testimonials` - Public endpoint for featured testimonials (now reads from feedback table)
- `POST /api/admin/testimonials` - Legacy endpoint (now writes to feedback table)

#### File Changes
- `web/database/schema.sql` - Updated database schema
- `web/src/types/admin.ts` - Enhanced type definitions
- `web/src/app/api/admin/feedback/route.ts` - New unified API
- `web/src/app/api/testimonials/route.ts` - Updated to use feedback table
- `web/src/app/api/admin/testimonials/route.ts` - Updated to use feedback table
- `web/src/app/admin/feedback/page.tsx` - Complete rewrite for unified management
- `web/src/app/admin/content/page.tsx` - Updated for compatibility
- `web/init-db.js` - Enhanced with comprehensive sample data

#### Sample Accounts
For testing purposes, the following accounts are available:

| Username | Email | Role | Premium | Description |
|----------|-------|------|---------|-------------|
| admin | admin@topcare.com | Admin | Yes | System administrator |
| fashionista_emma | emma@example.com | User | Yes | Premium fashion enthusiast |
| vintage_hunter | vintage@gmail.com | User | No | Vintage clothing collector |
| style_guru_alex | alex@fashion.co | User | Yes | Style consultant |
| casual_buyer | buyer@email.com | User | No | Regular buyer |
| premium_seller | seller@pro.com | User | Yes | Professional seller |
| trend_setter | trends@style.net | User | No | Trend follower |
| eco_warrior | eco@green.org | User | Yes | Sustainable fashion advocate |
| budget_shopper | budget@student.edu | User | No | Budget-conscious student |
| luxury_lover | luxury@designer.com | User | Yes | Luxury brand enthusiast |

**Note**: All passwords are hashed placeholders. Use password reset functionality or update database directly for testing.

### 📊 Statistics
- **Lines of Code Added**: ~800+
- **Files Modified**: 9
- **New Files**: 2 (MIGRATION_NOTES.md, CHANGELOG.md)
- **Database Records**: 100+ sample records across all tables
- **API Endpoints**: 3 updated, 1 enhanced

---

## [2.0.0] - Previous Version
- Initial platform setup
- Basic user management
- Listing and transaction systems
- Separate testimonials and feedback systems

---

## Migration Guide

For detailed migration instructions from v2.0.0 to v2.1.0, see `web/MIGRATION_NOTES.md`.

## Support

For questions about this update or migration assistance, please contact the development team or refer to the updated documentation in `development.md`.
