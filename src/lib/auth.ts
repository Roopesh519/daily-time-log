import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { MongoClient } from 'mongodb';
import User from '@/lib/models/User';
import connectDB from '@/lib/mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();
          const user = await User.findOne({ email: credentials.email });
          
          if (!user) {
            return null;
          }

          const isPasswordValid = await user.comparePassword(credentials.password);
          
          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      
      // Store Google tokens for calendar access
      if (account?.provider === 'google' && account.access_token) {
        console.log('Google OAuth tokens received:', {
          accessToken: account.access_token ? 'Present' : 'Missing',
          refreshToken: account.refresh_token ? 'Present' : 'Missing',
          expiresAt: account.expires_at,
          userId: user.id,
          tokenType: account.token_type,
          scope: account.scope
        });
        
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
        token.googleExpiryDate = account.expires_at;
        
        // Store tokens in User model for calendar sync
        try {
          await connectDB();
          const updateResult = await User.findByIdAndUpdate(user.id, {
            googleAuthTokens: {
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              expiryDate: account.expires_at,
            },
          });
          console.log('Tokens stored in User model:', updateResult ? 'Success' : 'Failed');
        } catch (error) {
          console.error('Error storing Google tokens:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.googleAccessToken = token.googleAccessToken as string;
        session.googleRefreshToken = token.googleRefreshToken as string;
        session.googleExpiryDate = token.googleExpiryDate as number;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
    };
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleExpiryDate?: number;
  }
}

