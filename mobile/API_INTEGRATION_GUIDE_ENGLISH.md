# Mobile API Integration Guide

## Overview

This guide explains how to connect your mobile app to the Web API, implementing the following data flow:

```
Mobile App → Web API (Next.js) → Supabase → Database
```

## File Structure

```
src/
├── config/
│   └── api.ts                 # API configuration
├── services/
│   ├── api.ts                 # Base API client
│   ├── listingsService.ts     # Product listings service
│   ├── authService.ts         # Authentication service
│   ├── userService.ts         # User profile service
│   ├── feedbackService.ts     # Feedback service
│   └── index.ts               # Centralized exports
└── components/
    ├── ListingsScreen.tsx     # Example product listing component
    └── AuthScreen.tsx         # Example authentication component
```

## Setup Steps

### 1. Environment Configuration

Copy `.env.example` to `.env` and set your API URL:

```bash
cp .env.example .env
```

Edit your `.env` file:

```env
# Local development
EXPO_PUBLIC_API_URL=http://localhost:3000

# Production (replace with your actual domain)
# EXPO_PUBLIC_API_URL=https://your-app.vercel.app
```

### 2. Install Dependencies

Make sure the necessary dependencies are installed:

```bash
npm install @supabase/supabase-js
```

## Usage

### 1. Replace Mock Data

**Before (using mock data):**
```typescript
import { MOCK_LISTINGS } from '../mocks/shop';

// Using mock data directly
const listings = MOCK_LISTINGS;
```

**Now (using real API):**
```typescript
import { listingsService } from '../services';

// Fetch data from the API
const listings = await listingsService.getListings();
```

### 2. Product Listings Example

```typescript
import React, { useState, useEffect } from 'react';
import { listingsService } from '../services';

const MyComponent = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await listingsService.getListings();
        setListings(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Render logic...
};
```

### 3. User Authentication Example

```typescript
import { authService } from '../services';

// User login
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authService.signIn({ email, password });
    console.log('Login successful:', response.user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// User registration
const handleRegister = async (username: string, email: string, password: string) => {
  try {
    const response = await authService.signUp({ username, email, password });
    console.log('Registration successful:', response.user);
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

## API Endpoints

Your Web API provides the following endpoints:

### Product-related
- `GET /api/listings` – Fetch all product listings  
- `GET /api/listings/:id` – Fetch a single product

### Authentication
- `POST /api/auth/signin` – User login  
- `POST /api/auth/register` – User registration  
- `GET /api/auth/me` – Get current user  
- `POST /api/auth/signout` – User logout  

### User
- `GET /api/profile` – Get user profile  
- `PUT /api/profile` – Update user profile  

### Feedback
- `GET /api/feedback` – Get feedback list  
- `POST /api/feedback` – Submit feedback  
- `GET /api/feedback/tags` – Get feedback tags  

## Error Handling

Each service includes built-in error handling:

```typescript
try {
  const listings = await listingsService.getListings();
  // Handle success
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message, error.status);
  } else {
    console.error('Network Error:', error.message);
  }
}
```

## Development Tips

### 1. Local Development

1. Start the Web API server:
   ```bash
   cd ../web
   npm run dev
   ```

2. Start the Mobile app:
   ```bash
   cd mobile
   npm start
   ```

3. Ensure `.env` has `EXPO_PUBLIC_API_URL=http://localhost:3000`

### 2. Production Deployment

1. Deploy the Web API to Vercel/Netlify  
2. Update `.env` → `EXPO_PUBLIC_API_URL=https://your-production-url`  
3. Rebuild the mobile app  

### 3. Debugging

Enable API debug logging:

```env
EXPO_PUBLIC_API_DEBUG=true
```

## Security Notes

1. **Never expose Supabase keys in the frontend**  
2. **All database access must go through the Web API**  
3. **Implement access control at the API layer**  
4. **Always use HTTPS in production**  

## Next Steps

1. Adjust API endpoints as needed  
2. Implement token storage (e.g. using AsyncStorage)  
3. Add offline support  
4. Enable caching  
5. Implement automatic retry for failed requests  
