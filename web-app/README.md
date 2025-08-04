# Social Recommendations Web App

A React.js web application for the Social Recommendation platform, built with TypeScript, Tailwind CSS, and optimized for Netlify deployment.

## Features

- **Authentication**: Sign up/in with email or social providers (Google, Facebook, Apple)
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Community Management**: Join and discover communities
- **Review System**: Create and browse reviews with photos
- **Drag & Drop**: Photo upload functionality
- **Accessibility**: Keyboard navigation and screen reader support
- **SEO Optimized**: Meta tags and semantic HTML
- **Offline Support**: Service worker and caching

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for form handling
- **React Dropzone** for file uploads
- **Headless UI** for accessible components
- **React Helmet Async** for SEO
- **React Hot Toast** for notifications
- **Redux Toolkit** for state management

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend services running (see main README)

### Installation

1. **Install dependencies:**
   ```bash
   cd web-app
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   REACT_APP_API_BASE_URL=http://localhost:8080
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Install the shared frontend library:**
   ```bash
   cd ../frontend-shared
   npm install
   npm run build
   cd ../web-app
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

   The app will open at [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components (Header, Sidebar)
│   └── UI/             # Basic UI components (Button, Input)
├── pages/              # Page components
│   ├── Auth/           # Authentication pages
│   ├── Communities/    # Community-related pages
│   └── Reviews/        # Review-related pages
├── App.tsx             # Main app component with routing
├── index.tsx           # App entry point
└── index.css           # Global styles and Tailwind imports
```

## Features Implemented

### ✅ Core Features
- [x] Responsive design with Tailwind CSS
- [x] Authentication pages (login/signup)
- [x] Dashboard with activity feed
- [x] Community discovery and management
- [x] Review creation with photo upload
- [x] Review browsing and filtering
- [x] User profile management
- [x] Settings page
- [x] 404 error page

### ✅ Technical Features
- [x] TypeScript for type safety
- [x] React Router for SPA routing
- [x] Redux integration with shared library
- [x] Form validation with React Hook Form
- [x] Drag & drop file uploads
- [x] Toast notifications
- [x] SEO optimization with React Helmet
- [x] Accessibility features
- [x] Netlify deployment configuration

### 🔄 In Progress
- [ ] Backend integration (currently using mock data)
- [ ] Real-time updates
- [ ] Advanced search and filtering
- [ ] Social interactions (likes, comments)
- [ ] Push notifications

## Deployment

### Netlify Deployment

1. **Connect to Netlify:**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `build`

2. **Environment Variables:**
   Set these in Netlify dashboard:
   ```
   REACT_APP_API_BASE_URL=https://your-api-domain.com
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Deploy:**
   - Push to main branch for automatic deployment
   - Or manually deploy from Netlify dashboard

### Manual Build

```bash
npm run build
```

The `build` folder contains the production build ready for deployment.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new components
3. Include accessibility attributes
4. Test on multiple screen sizes
5. Update documentation

## License

MIT License - see main project LICENSE file.