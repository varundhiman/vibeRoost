# 🌟 VibeRoost - Social Recommendation Platform

A modern social platform for sharing and discovering recommendations for restaurants, movies, activities, and more. Built with React, TypeScript, and Supabase.

## ✨ Features

- 🔐 **User Authentication** - Secure signup/login with Supabase Auth
- 👥 **Community-Based Recommendations** - Join communities and share recommendations
- ⭐ **Review & Rating System** - Write detailed reviews with ratings
- 📱 **Personalized Feed** - AI-powered content personalization
- 🔍 **External API Integration** - Restaurant and movie data from Yelp & TMDB
- 💬 **Social Interactions** - Like, comment, and follow other users
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Redux Toolkit
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth, Storage)
- **APIs**: Yelp API, TMDB API for external data
- **Deployment**: Netlify (Frontend), Supabase (Backend)
- **Development**: Vite, ESLint, Prettier

## 📦 Project Structure

```
├── frontend-shared/           # Shared TypeScript library
│   ├── src/
│   │   ├── api/              # API client and configuration
│   │   ├── auth/             # Authentication services
│   │   ├── services/         # Business logic services
│   │   ├── store/            # Redux store and slices
│   │   └── types/            # TypeScript type definitions
├── web-app/                  # React web application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   └── App.tsx           # Main app component
├── supabase/                 # Backend configuration
│   ├── functions/            # Edge Functions (API endpoints)
│   ├── migrations/           # Database schema migrations
│   └── config.toml           # Supabase configuration
├── scripts/                  # Development and deployment scripts
└── docs/                     # Documentation files
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase CLI
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/varundhiman/vibeRoost.git
cd vibeRoost
```

2. **Install dependencies**
```bash
# Install frontend shared library
cd frontend-shared
npm install
npm run build

# Install web app
cd ../web-app
npm install
```

3. **Set up Supabase**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (replace with your project ID)
supabase link --project-ref your-project-id

# Push database migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy users
supabase functions deploy communities
supabase functions deploy reviews
supabase functions deploy feed
supabase functions deploy external-apis
```

4. **Configure environment variables**
```bash
# Copy example files
cp .env.example .env
cp web-app/.env.example web-app/.env

# Update with your Supabase credentials
# Get these from your Supabase Dashboard > Settings > API
```

5. **Start the development server**
```bash
# Use the production startup script
./scripts/start-production.sh

# Or manually:
cd web-app
npm start
```

The app will be available at `http://localhost:3000`

## 🔧 Environment Variables

Create these environment files with your Supabase credentials:

**`.env`** (Backend configuration):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

**`web-app/.env.local`** (Frontend configuration):
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_BASE_URL=https://your-project.supabase.co/functions/v1
```

## 🏗️ Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Redux Toolkit** for state management
- **Tailwind CSS** for styling
- **Shared Library** for reusable logic across apps

### Backend Architecture
- **Supabase Edge Functions** for API endpoints
- **PostgreSQL** with Row Level Security (RLS)
- **Real-time subscriptions** for live updates
- **File storage** for user uploads

### Key Features Implementation
- **Authentication**: Supabase Auth with JWT tokens
- **Database**: PostgreSQL with comprehensive schema
- **API**: RESTful Edge Functions with TypeScript
- **Real-time**: Supabase real-time subscriptions
- **File Upload**: Supabase Storage integration

## 📚 API Documentation

The app includes comprehensive Edge Functions for:

- **Users API** (`/functions/v1/users`) - User profiles and management
- **Communities API** (`/functions/v1/communities`) - Community operations
- **Reviews API** (`/functions/v1/reviews`) - Review CRUD operations
- **Feed API** (`/functions/v1/feed`) - Personalized content feed
- **External APIs** (`/functions/v1/external-apis`) - Restaurant/movie data

## 🧪 Testing

```bash
# Run frontend tests
cd frontend-shared
npm test

# Run Edge Function tests
cd supabase/functions
deno test --allow-all
```

## 🚀 Deployment

### Frontend (Netlify)
1. Connect your GitHub repository to Netlify
2. Set build command: `cd web-app && npm run build`
3. Set publish directory: `web-app/build`
4. Add environment variables in Netlify dashboard

### Backend (Supabase)
```bash
# Deploy all functions
supabase functions deploy

# Set production secrets
supabase secrets set JWT_SECRET=your-jwt-secret
supabase secrets set SERVICE_ROLE_KEY=your-service-role-key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend platform
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Heroicons](https://heroicons.com) for the beautiful icons
- [React](https://reactjs.org) team for the fantastic framework

## 📞 Support

If you have any questions or need help, please open an issue or contact the maintainers.

---

**Built with ❤️ by the VibeRoost team**