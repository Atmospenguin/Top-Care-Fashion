# Review System Migration - From Listing-Based to Transaction-Based

## Overview

The review system has been migrated from being tied to listings to being tied to transactions. This provides better tracking and allows both buyers and sellers to review each transaction.

## Key Changes

### Database Schema Changes

1. **Reviews Table**: Completely restructured
   - Now tied to transactions instead of listings
   - Each transaction can have up to 2 reviews (buyer and seller)
   - Includes reviewer type (buyer/seller) and reviewee information

2. **Users Table**: Added rating fields
   - `average_rating`: Average rating received (1.00-5.00)
   - `total_reviews`: Total number of reviews received

3. **Listings Table**: Added sold tracking
   - `sold`: Boolean indicating if listing has been sold
   - `sold_at`: Timestamp when listing was sold

### New Business Logic

1. **One Sale Per Listing**: Each listing can only be sold once
2. **Transaction-Based Reviews**: Reviews are now linked to specific transactions
3. **Dual Reviews**: Both buyer and seller can review each completed transaction
4. **User Ratings**: Users have accumulated ratings based on reviews received

### API Changes

#### New Endpoints
- `GET /api/admin/transactions/{id}/reviews` - Get reviews for a transaction
- `POST /api/admin/transactions/{id}/reviews` - Create a review for a transaction
- `GET /api/admin/users/{id}/reviews` - Get reviews received by a user

#### Updated Endpoints
- User APIs now include `average_rating` and `total_reviews`
- Listing APIs now include `sold` and `sold_at` fields
- Listing reviews endpoint now shows transaction-based information

### Migration Process

1. **Backup**: Old reviews are backed up to `reviews_backup` table
2. **Schema Update**: New columns added to users and listings tables
3. **Data Migration**: Existing reviews migrated to new structure (if they have transaction_id)
4. **Triggers**: Database triggers created to automatically update user ratings

## Running the Migration

### Option 1: Using the migration script (recommended)
```bash
node migrate-reviews.js
```

### Option 2: Using SQL file
```sql
SOURCE database/migration_reviews_to_transactions.sql
```

## UI Changes

### User Detail Page
- Now shows user's average rating and total reviews
- Reviews section displays reviews received by the user
- Transaction table includes links to view reviews

### Transaction Detail Page
- Shows review summary (how many reviews submitted)
- Displays all reviews for the transaction
- Shows which party (buyer/seller) submitted each review

### Listing Reviews Page
- Now shows a message about the system change
- Lists transactions related to the listing
- Provides links to view transaction reviews

## Benefits

1. **Better Tracking**: Reviews tied to specific transactions
2. **Dual Perspectives**: Both parties can review each transaction
3. **User Reputation**: Accumulated ratings for users
4. **Reduced Confusion**: Clear relationship between reviews and transactions
5. **One-Time Sales**: Listings can only be sold once, reducing complexity

## Notes

- Existing reviews with `transaction_id` are automatically migrated
- Reviews without transaction associations are preserved in the backup table
- Database triggers automatically maintain user rating statistics
- The old listing reviews endpoint is updated to show transaction information
