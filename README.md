# Amply

A modern, secure Next.js application that helps founders sharpen how they show up in AI-mediated discovery: clearer positioning, consistent entity signals, and structured generative assets that models can summarize accurately.

## Features

- **Founder discovery stack**: Structured generation workflows, asset libraries, and context pipelines aimed at AI-readable brand narratives (not a “social media suite” in product positioning)
- **Auto-Save**: Automatic saving with debounced persistence
- **File Upload**: Secure file upload with validation
- **Authentication**: Google OAuth and development login
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Error Handling**: Comprehensive error boundaries and validation
- **Performance Optimised**: Debounced operations and lazy loading

##Security Features

- **Environment Variables**: All sensitive data moved to environment variables
- **Input Validation**: Comprehensive validation for all user inputs
- **File Validation**: Secure file upload with type and size validation
- **Error Boundaries**: Graceful error handling throughout the application
- **Sanitization**: Input sanitization to prevent XSS attacks

##Performance Optimisations

- **Debounced Operations**: Prevents excessive API calls
- **Lazy Loading**: Images and components load on demand
- **Memoization**: Optimised React components with proper memoization
- **Error Boundaries**: Prevents app crashes and improves UX
- **Validation**: Client-side validation reduces server load

##Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS with DaisyUI
- **Icons**: Lucide React
- **File Processing**: html2canvas, react-image-crop

##Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd onue
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXTAUTH_SECRET=your_nextauth_secret_key
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. **Set up the database**
   ```bash
   # Run the database setup script
   psql -h your_host -U your_user -d your_database -f database_setup_nextauth.sql
   ```

5. **Set up Supabase storage**
   ```bash
   # Run the storage setup script
   node setup-storage.js
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `NEXTAUTH_SECRET` | Secret key for NextAuth.js | Yes |
| `NEXTAUTH_URL` | Your application URL | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No (for dev) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No (for dev) |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_MAX_FILE_SIZE` | Maximum file size for uploads | 10MB |
| `NEXT_PUBLIC_MAX_VIDEO_SIZE` | Maximum video size for uploads | 100MB |
| `NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING` | Enable performance monitoring | false |
| `NEXT_PUBLIC_DEBOUNCE_DELAY` | Debounce delay for auto-save | 1000ms |

## 📁 Project Structure

```
onue/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── components/        # Reusable components
│   ├── dashboard/         # Dashboard pages
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── public/                # Static assets
├── database_setup.sql     # Database schema
├── supabaseClient.js      # Supabase configuration
└── README.md             # This file
```

## 🔒 Security Improvements

### 1. Environment Variables
- Moved all sensitive data to environment variables
- Created example environment file
- Added validation for required environment variables

### 2. Input Validation
- Comprehensive validation for all user inputs
- File type and size validation
- XSS prevention through input sanitization
- Email validation and URL validation

### 3. Error Handling
- Global error boundaries to prevent app crashes
- Graceful error messages for users
- Comprehensive error logging for developers
- Retry mechanisms for failed operations

### 4. File Upload Security
- File type validation
- File size limits
- Secure file storage with Supabase
- Malicious file prevention

## ⚡ Performance Improvements

### 1. Debounced Operations
- Auto-save with 1-second debounce
- Search operations with debouncing
- Form submissions with debouncing

### 2. Lazy Loading
- Images load on demand
- Components load when needed
- Route-based code splitting

### 3. Optimised Components
- React.memo for expensive components
- useMemo for expensive calculations
- useCallback for stable references

### 4. Error Boundaries
- Prevents app crashes
- Improves user experience
- Better error reporting

## 🧪 Development

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

### Starting Production Server
```bash
npm start
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/signin` - Sign in with Google
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Generative asset endpoints
- `GET /api/content/images` - List user images for retrieval / matching
- `POST /api/content/upload` - Upload file
- `DELETE /api/content/:id` - Delete asset

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🔄 Changelog

### Version 1.0.0 (Latest)
- ✅ Security improvements with environment variables
- ✅ Comprehensive input validation
- ✅ Error boundaries and error handling
- ✅ Performance optimizations
- ✅ File upload security
- ✅ Auto-save functionality
- ✅ Responsive design improvements

---

**Note**: This is a beta version. Some features may be incomplete or subject to change.
