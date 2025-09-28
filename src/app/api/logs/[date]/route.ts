import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Log from '@/lib/models/Log';

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const log = await Log.findOne({ 
      userId: session.user.id, 
      date: params.date 
    });

    return NextResponse.json(log || { date: params.date, entries: [] });
  } catch (error) {
    console.error('Error fetching log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entries } = await request.json();

    if (!entries) {
      return NextResponse.json({ error: 'Entries are required' }, { status: 400 });
    }

    await connectDB();

    const log = await Log.findOneAndUpdate(
      { userId: session.user.id, date: params.date },
      { 
        userId: session.user.id,
        date: params.date,
        entries,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(log);
  } catch (error) {
    console.error('Error updating log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    await Log.findOneAndDelete({ 
      userId: session.user.id, 
      date: params.date 
    });

    return NextResponse.json({ message: 'Log deleted successfully' });
  } catch (error) {
    console.error('Error deleting log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

