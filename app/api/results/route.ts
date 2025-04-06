import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const results = await getCollection('scanResults');
    
    if (!results) {
      throw new Error('Failed to connect to database');
    }

    const data = await request.json();
    
    if (!data.createdAt) {
      data.createdAt = new Date();
    }
    
    const result = await results.insertOne(data);
    
    return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Error saving scan result:', error);
    return NextResponse.json(
      { error: 'Failed to save scan result', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const results = await getCollection('scanResults');
    
    if (!results) {
      throw new Error('Failed to connect to database');
    }
    
    const scanResults = await results.find({}).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json(scanResults);
  } catch (error) {
    console.error('Error retrieving scan results:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve scan results', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
