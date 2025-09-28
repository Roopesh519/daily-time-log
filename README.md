# Daily Time Log

A full-stack time logging application that allows users to track their daily activities and sync with Google Calendar.

## Features

- **User Authentication**: Sign up, sign in, and password management with NextAuth.js
- **Manual Time Logging**: Add, edit, and delete manual time entries
- **Google Calendar Integration**: Sync events from Google Calendar automatically
- **Dashboard View**: View logs for the last 7 days with total time tracking
- **Calendar Interface**: Select any date to view or edit logs
- **Responsive Design**: Modern UI built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with JWT sessions and Google OAuth
- **Deployment**: Compatible with Vercel and Render

## Prerequisites

- Node.js 18+ 
- MongoDB database (local or MongoDB Atlas)
- Google Cloud Console project with Calendar API enabled

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd daily-time-log
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in the required environment variables in `.env.local`:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/daily-time-log
   # or for MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/daily-time-log

   # NextAuth Configuration
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000

   # Google OAuth Credentials
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # JWT Secret (if using custom JWT)
   JWT_SECRET=your-jwt-secret-here

   # App Configuration
   NODE_ENV=development
   ```

4. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Calendar API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
   - Copy the Client ID and Client Secret to your `.env.local` file

5. **Set up MongoDB**
   - Install MongoDB locally or create a MongoDB Atlas account
   - Create a database named `daily-time-log`
   - Update the `MONGODB_URI` in your `.env.local` file

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth configuration
│   │   ├── calendar/      # Google Calendar sync
│   │   ├── logs/         # Log CRUD operations
│   │   └── users/        # User management
│   ├── auth/              # Authentication pages
│   │   ├── signin/       # Sign in page
│   │   └── signup/       # Sign up page
│   ├── dashboard/         # Main dashboard
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── CalendarView.tsx  # Calendar picker
│   ├── LogEntryModal.tsx # Add/edit log entry modal
│   └── Providers.tsx     # Session provider
├── lib/                  # Utility libraries
│   ├── auth.ts          # NextAuth configuration
│   ├── mongodb.ts       # Database connection
│   └── models/          # Mongoose models
│       ├── Log.ts       # Log model
│       └── User.ts      # User model
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in with credentials
- `POST /api/auth/signup` - Sign up with Google OAuth

### Users
- `POST /api/users/signup` - Create new user account

### Logs
- `GET /api/logs?days=7` - Get logs for last N days
- `GET /api/logs?date=YYYY-MM-DD` - Get logs for specific date
- `POST /api/logs` - Create/update log entries
- `GET /api/logs/[date]` - Get log for specific date
- `PUT /api/logs/[date]` - Update log for specific date
- `DELETE /api/logs/[date]` - Delete log for specific date

### Calendar
- `POST /api/calendar/sync` - Sync Google Calendar events

## Data Models

### User
```typescript
{
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  googleAuthTokens?: {
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Log
```typescript
{
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  entries: LogEntry[];
  createdAt: Date;
  updatedAt: Date;
}
```

### LogEntry
```typescript
{
  _id?: string;
  type: 'manual' | 'calendar';
  startTime: string; // ISO string
  endTime: string; // ISO string
  title: string;
  description: string;
  sourceId?: string; // For calendar sync reference
}
```

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com/)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy

3. **Update Google OAuth**
   - Add your Vercel domain to authorized redirect URIs
   - Update `NEXTAUTH_URL` in environment variables

### Render

1. **Create a new Web Service**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set start command: `npm start`
   - Add environment variables

2. **Set up MongoDB Atlas**
   - Create a MongoDB Atlas cluster
   - Update `MONGODB_URI` with Atlas connection string

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **API Routes**: Add new routes in `src/app/api/`
2. **Components**: Create reusable components in `src/components/`
3. **Pages**: Add new pages in `src/app/`
4. **Types**: Define TypeScript interfaces in `src/types/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.

