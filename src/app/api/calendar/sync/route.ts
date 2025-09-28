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

    // Get user's Google tokens
    const user = await User.findById(session.user.id);
    if (!user?.googleAuthTokens) {
      return NextResponse.json(
        { error: 'Google account not connected' },
        { status: 400 }
      );
    }

    // Set up Google Calendar API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: user.googleAuthTokens.accessToken,
      refresh_token: user.googleAuthTokens.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get events for the specified date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

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
    log.entries = log.entries.filter(entry => entry.type !== 'calendar');
    log.entries.push(...calendarEntries);

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

