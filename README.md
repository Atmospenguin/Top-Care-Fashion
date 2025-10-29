# Top Care Fashion

A modern fashion marketplace platform built with Next.js, React Native, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ LTS
- npm 9+
- Expo CLI (for mobile development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd Top-Care-Fashion
   ```

2. **Install dependencies**
   ```bash
   # Web app
   cd web && npm install
   
   # Mobile app
   cd mobile && npm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment files
   cp web/.env.example web/.env.local
   cp mobile/.env.example mobile/.env.local
   
   # Fill in your Supabase credentials
   ```

4. **Start development servers**
   ```bash
   # Web (Next.js)
   cd web && npm run dev
   
   # Mobile (Expo)
   cd mobile && npx expo start
   ```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.5.2 (React 19.1.0) + React Native 0.81.4
- **Backend**: Next.js API Routes + Prisma 6.16.2
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Deployment**: Vercel (web) + Expo EAS (mobile)

### Project Structure
```
├── web/                # Next.js web application
│   ├── src/app/api/    # API routes
│   ├── src/components/ # React components
│   ├── prisma/         # Database schema
│   └── supabase/       # Supabase configuration
├── mobile/             # React Native mobile app
│   ├── screens/        # App screens
│   ├── components/     # Reusable components
│   └── constants/      # Configuration & assets
└── docs/               # Documentation
```

## 🔧 Development

### Web App
- **Framework**: Next.js with App Router
- **Styling**: TailwindCSS 4
- **Database**: Prisma ORM with Supabase PostgreSQL
- **Authentication**: Supabase Auth + local user sync

### Mobile App
- **Framework**: React Native with Expo 54
- **Navigation**: React Navigation 7
- **State**: React Context API
- **Icons**: Ionicons via @expo/vector-icons

## 📱 Features

### Current Implementation
- ✅ User authentication (login/register)
- ✅ Product listings display
- ✅ User profiles
- ✅ Shopping cart functionality
- ✅ Mix & Match outfit builder
- ✅ Premium subscription plans

### Planned Features
- 🔄 Real-time chat
- 🔄 Push notifications
- 🔄 AI-powered outfit recommendations
- 🔄 Advanced search & filters
- 🔄 Payment processing

## 🗄️ Database

### Schema Overview
- **Users**: Authentication, profiles, premium status
- **Listings**: Product catalog with categories
- **Transactions**: Order management
- **Reviews**: User feedback system
- **Feedback**: Customer testimonials

### Sample Data
The database includes comprehensive test data:
- 10 user accounts with different roles
- 15+ product listings
- Sample transactions and reviews
- FAQ entries and site statistics

## 🚀 Deployment

### Web App
- **Platform**: Vercel
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage buckets
- **Domain**: Auto-configured with Vercel

### Mobile App
- **Platform**: Expo EAS Build
- **Distribution**: Website
- **Updates**: Over-the-air updates via Expo

## 📚 Documentation

- [Development Guide](development.md) - Setup, architecture, and workflows
- [Mobile Documentation](mobile/README.md) - React Native app details
- [Test Accounts](docs/TEST_ACCOUNTS.md) - Sample user credentials
- [Plans & Pricing](docs/Plans%20&%20Pricing.md) - Subscription details

- [Operational Lessons & Checklist](development.md#16-operational-lessons--quick-fixes-2025-10-25) - Quick fixes and API hygiene checklist (added 2025-10-25)

## 🔐 Security

- Supabase Auth for secure authentication
- Row Level Security (RLS) policies
- Environment variable protection
- Input validation and sanitization
- HTTPS enforcement



## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/top-care-fashion/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/top-care-fashion/discussions)
- **Email**: atmospenguin@qq.com

## 🎨 Brand

- **Primary Color**: #F54B3D
- **Logo**: Available in SVG format (brand color, white, icon)
- **Typography**: Geist font family
- **Design System**: TailwindCSS with custom brand tokens

---

Built with ❤️ by the Top Care Fashion team
