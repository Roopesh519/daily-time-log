import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Log from '@/lib/models/Log';
import User from '@/lib/models/User';
import { google } from 'googleapis';
import { format, parseISO } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date } = await request.json();
    
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    await connectDB();

    // Check if user has Google tokens in session
    if (!session.googleAccessToken) {
      return NextResponse.json(
        { error: 'Google account not connected. Please sign in with Google first.' },
        { status: 400 }
      );
    }

    // Check if we have a refresh token - if not, force re-authentication
    if (!session.googleRefreshToken) {
      return NextResponse.json(
        { 
          error: 'Google authentication needs to be refreshed. Please sign in with Google again to grant calendar access.',
          needsReauth: true 
        },
        { status: 401 }
      );
    }

    // Get user for database operations
    const user = await User.findById(session.user.id);
    console.log('User found:', user ? 'Yes' : 'No');
    console.log('User ID:', session.user.id);
    console.log('Session Google tokens:', session.googleAccessToken ? 'Present' : 'Missing');

    // Set up Google Calendar API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    console.log('Setting OAuth credentials:', {
      accessToken: session.googleAccessToken ? 'Present' : 'Missing',
      refreshToken: session.googleRefreshToken ? 'Present' : 'Missing',
      expiryDate: session.googleExpiryDate,
      currentTime: Date.now(),
      needsRefresh: session.googleExpiryDate && session.googleExpiryDate < Date.now()
    });

    // Set credentials - only include refresh_token if it exists
    const credentials: any = {
      access_token: session.googleAccessToken,
      expiry_date: session.googleExpiryDate,
    };
    
    if (session.googleRefreshToken) {
      credentials.refresh_token = session.googleRefreshToken;
    }
    
    oauth2Client.setCredentials(credentials);

    // Check if token needs refresh (only if we have a refresh token)
    if (session.googleExpiryDate && session.googleExpiryDate < Date.now() && session.googleRefreshToken) {
      console.log('Token expired, attempting refresh...');
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log('Token refresh successful');
        
        // Update the oauth2Client with new credentials
        oauth2Client.setCredentials(credentials);
      } catch (refreshError) {
        console.error('Error refreshing Google token:', refreshError);
        return NextResponse.json(
          { error: 'Failed to refresh Google token. Please sign in again.' },
          { status: 401 }
        );
      }
    } else if (session.googleExpiryDate && session.googleExpiryDate < Date.now() && !session.googleRefreshToken) {
      console.log('Token expired but no refresh token available, proceeding anyway...');
    } else {
      console.log('Token is still valid, proceeding with calendar API call');
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get events for the specified date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Making calendar API call for date:', date);
    console.log('Time range:', {
      start: startOfDay.toISOString(),
      end: endOfDay.toISOString()
    });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    // Convert Google Calendar events to log entries
    const calendarEntries = events.map((event) => ({
      type: 'calendar' as const,
      startTime: event.start?.dateTime || event.start?.date || '',
      endTime: event.end?.dateTime || event.end?.date || '',
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      sourceId: event.id,
    }));

    // Get existing log for the date
    let log = await Log.findOne({ userId: session.user.id, date });
    
    if (!log) {
      log = new Log({
        userId: session.user.id,
        date,
        entries: [],
      });
    }

    // Remove existing calendar entries and add new ones
    log.entries = log.entries.filter((entry: any) => entry.type !== 'calendar');
    log.entries.push(...calendarEntries);

    // Sort all entries by start time to maintain chronological order
    log.entries.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    await log.save();

    return NextResponse.json({
      message: 'Calendar synced successfully',
      entriesAdded: calendarEntries.length,
      log,
    });
  } catch (error) {
    console.error('Error syncing calendar:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}

