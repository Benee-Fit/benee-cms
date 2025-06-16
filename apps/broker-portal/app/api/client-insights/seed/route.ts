import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@repo/auth/server';
import { database } from '@repo/database';
import { seedClientInsightsData } from '../../../utils/seedClientInsights';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Seeding client insights data for user: ${user.id}`);
    
    const result = await seedClientInsightsData(user.id);
    
    return NextResponse.json({
      message: 'Client insights data seeded successfully',
      ...result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error seeding client insights data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to seed client insights data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all insights and time series data for this broker
    const deleted = await database.clientInsightData.deleteMany({
      where: { brokerId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: 'All client insights data cleared',
      deleted: deleted.count,
    });
  } catch (error) {
    console.error('Error clearing client insights data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear client insights data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}