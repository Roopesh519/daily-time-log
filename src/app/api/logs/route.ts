import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Log from '@/lib/models/Log';
import { format, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const days = searchParams.get('days');

    if (date) {
      // Get logs for a specific date
      const log = await Log.findOne({ 
        userId: session.user.id, 
        date 
      }).populate('userId', 'name email');
      
      return NextResponse.json(log || { date, entries: [] });
    }

    if (days) {
      // Get logs for the last N days
      const daysCount = parseInt(days);
      const logs = [];
      
      for (let i = 0; i < daysCount; i++) {
        const targetDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const log = await Log.findOne({ 
          userId: session.user.id, 
          date: targetDate 
        });
        
        logs.push({
          date: targetDate,
          entries: log?.entries || []
        });
      }
      
      return NextResponse.json(logs);
    }

    return NextResponse.json({ error: 'Missing date or days parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, entries } = await request.json();

    if (!date || !entries) {
      return NextResponse.json({ error: 'Date and entries are required' }, { status: 400 });
    }

    await connectDB();

    const log = await Log.findOneAndUpdate(
      { userId: session.user.id, date },
      { 
        userId: session.user.id,
        date,
        entries,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(log);
  } catch (error) {
    console.error('Error creating/updating log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

