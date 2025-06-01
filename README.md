# CUBS Employee Management System

A comprehensive employee management application built with React Native/Expo for managing employee records, visa tracking, document storage, and notifications.

## 🚀 Features

- **Employee Management**: Create, update, and manage employee records
- **Visa Tracking**: Monitor visa expiry dates with automated alerts
- **Document Storage**: Secure document upload and management using Backblaze B2
- **Email Notifications**: Automated email alerts using SendGrid
- **Role-based Access**: Admin and employee access levels
- **Real-time Updates**: Live data synchronization with Supabase
- **Mobile & Web**: Cross-platform support for iOS, Android, and Web

## 🛠 Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **UI Components**: React Native Paper
- **State Management**: Zustand
- **Backend**: Supabase (Database & Authentication)
- **File Storage**: Backblaze B2
- **Email Service**: SendGrid
- **Form Handling**: Formik + Yup
- **Styling**: Tailwind CSS, Linear Gradient

## 📋 Prerequisites

- Node.js (v16 or higher)
- Yarn or npm
- Expo CLI
- Supabase account
- Backblaze B2 account
- SendGrid account

## 🔧 Installation

1. **Clone the repository**
```bash
   git clone https://github.com/YOUR_USERNAME/cubs-employee-management.git
cd cubs-employee-management
```

2. **Install dependencies**
   ```bash
yarn install
```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
# Supabase Configuration
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

   # SendGrid Configuration
   EXPO_PUBLIC_SENDGRID_API_KEY=your-sendgrid-api-key
   EXPO_PUBLIC_SENDGRID_FROM_EMAIL=your-from-email

# Backblaze B2 Configuration
   EXPO_PUBLIC_B2_API_URL=your-b2-api-url
   EXPO_PUBLIC_B2_BUCKET_NAME=your-bucket-name
   EXPO_PUBLIC_B2_ENDPOINT=your-b2-endpoint
   EXPO_PUBLIC_B2_KEY_ID=your-b2-key-id
   EXPO_PUBLIC_B2_APPLICATION_KEY=your-b2-application-key

   # App Configuration
   EXPO_PUBLIC_ENV=development
   EXPO_PUBLIC_APP_NAME=CUBS Visa Management
   EXPO_PUBLIC_APP_VERSION=1.0.0
   ```

4. **Database Setup**
   - Run the SQL schema from `supabase/schema.sql` in your Supabase project
   - Set up Row Level Security policies

## 🚀 Running the App

### Development
```bash
# Start the development server
yarn start

# Run on specific platforms
yarn android  # Android
yarn ios      # iOS
yarn web      # Web
```

### Production Build
   ```bash
# Web build
yarn build

# Mobile builds (using EAS)
npx eas build --platform android
npx eas build --platform ios
```

## 📱 App Structure

```
cubs-employee-management/
├── app/                    # App screens and navigation
│   ├── (admin)/           # Admin-only screens
│   ├── (auth)/            # Authentication screens
│   ├── (employee)/        # Employee screens
│   └── (tabs)/            # Tab navigation screens
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── services/              # API and external service integrations
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── theme/                 # App theme configuration
```

## 🔐 Authentication & Access Control

### Roles
- **Admin**: Full system access, employee management, document oversight
- **Employee**: Personal profile, document upload, visa status viewing

### Demo Accounts
- Admin: `admin@cubs.com` / `admin123`
- Employee: `employee@cubs.com` / `employee123`

## 🗄 Database Schema

Key tables:
- `profiles`: User authentication and role management
- `employees`: Employee records and visa information
- `employee_documents`: Document metadata and storage links
- `notifications`: System notifications and alerts

## 📄 API Documentation

### Supabase Services
- Authentication and user management
- Real-time data synchronization
- Row Level Security policies

### External Integrations
- **Backblaze B2**: Document storage and retrieval
- **SendGrid**: Email notifications for visa expiry and system alerts

## 🔒 Security Features

- Environment variable protection
- Row Level Security (RLS) in Supabase
- Secure document storage
- Role-based access control
- Session management

## 📈 Development

### Code Quality
   ```bash
# Type checking
yarn type-check

# Linting
yarn lint
yarn lint:fix
```

### Testing
```bash
# Run tests (when implemented)
yarn test
```

## 🚀 Deployment

### Web Deployment
1. Build the web version: `yarn build`
2. Deploy the `web-build` folder to your hosting provider (Vercel, Netlify, etc.)

### Mobile Deployment
1. Use EAS Build for creating production builds
2. Submit to app stores following platform guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏢 About CUBS

CUBS Technical is a leading contracting company specializing in technical services. This employee management system was built to streamline operations and improve workforce management efficiency.

## 📞 Support

For support and questions:
- Email: support@cubstechnical.com
- Website: https://cubstechnical.com

---

**Built with ❤️ by the CUBS Technical Team**
