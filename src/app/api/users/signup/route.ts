import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = signupSchema.parse(body);

    // Connect to database with timeout handling
    try {
      await connectDB();
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      
      // Check if it's a timeout error
      if (dbError.code === 'ETIMEOUT' || dbError.message?.includes('timeout')) {
        return NextResponse.json(
          { error: 'Database connection timeout. Please try again.' },
          { status: 503 }
        );
      }
      
      // Check if it's a network error
      if (dbError.code === 'ENOTFOUND' || dbError.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { error: 'Database connection failed. Please check your network connection.' },
          { status: 503 }
        );
      }
      
      // Generic database error
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      name,
      email,
      passwordHash: password, // Will be hashed by pre-save middleware
    });

    await user.save();

    return NextResponse.json(
      { message: 'User created successfully', userId: user._id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
