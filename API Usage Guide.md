### API Usage Guide for Top Care Fashion

#### Backend Architecture
- **API Server**: Built using **Next.js API Routes** (`/api/*`) and deployed on **Vercel**.
- **Database**: **Supabase PostgreSQL**, managed with **Prisma ORM**.
- **Authentication**: **Supabase Auth** for secure login and registration, with local user synchronization.
- **File Storage**: Dynamic content hosted in **Supabase Storage buckets**.

#### Available API Endpoints
1. `GET /api/listings` - Fetch all active product listings.
2. `POST /api/auth/signin` - User authentication (login).
3. `POST /api/auth/register` - User registration.
4. `GET /api/auth/me` - Retrieve current user profile.
5. `GET /api/profile` - Fetch detailed user profile data.

#### Integration Example
Here’s an example of fetching active product listings:
```typescript
const fetchListings = async () => {
  try {
    const response = await fetch('https://your-app.vercel.app/api/listings');
    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error fetching listings:', error);
  }
};
```

---

### Changes Needed for API and Supabase to Align with Mobile App

#### 1. **Authentication**
   - Replace mock authentication with real API endpoints (`/api/auth/signin` and `/api/auth/register`) in the mobile app.
   - Ensure Supabase Auth's JWT-based authentication is properly integrated with the app.

#### 2. **User Profile Synchronization**
   - Implement the `GET /api/auth/me` endpoint in the mobile app to fetch the authenticated user's profile.
   - Add support for user roles (e.g., Guest, Registered, Premium, Admin) to align with Supabase Auth.

#### 3. **Database Alignment**
   - Ensure all mobile app data models (e.g., listings, transactions, reviews) mirror the schema in Supabase PostgreSQL.
   - Synchronize any changes in the database schema with the mobile app's data fetching and state management logic.

#### 4. **Dynamic and Static Asset Loading**
   - Update mobile app to use **Supabase Storage** for dynamic content (e.g., product images).
   - Verify that `REMOTE_ASSET_BASE_URL` is correctly configured in the mobile app.

#### 5. **API Enhancements**
   - Introduce filtering and pagination capabilities to endpoints like `/api/listings`.
   - Standardize error responses from the API to improve error handling in the mobile app.

#### 6. **Deployment and Testing**
   - Test Supabase integration with the mobile app to ensure smooth user authentication, data fetching, and updates.
   - Add basic unit/UI tests for the mobile app, focusing on API integration (e.g., Jest, React Native Testing Library).

By ensuring these changes, the API and Supabase database will fully align with the mobile app's functionality and data requirements.
