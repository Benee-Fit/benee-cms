import { currentUser, clerkClient } from '@repo/auth/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for validating organization data
const organizationSchema = z.object({
  // Personal Information
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  
  // Organization Details
  organizationName: z.string().min(1, 'Organization name is required'),
  organizationType: z.string().optional(),
  companySize: z.string().optional(),
  website: z.string().optional(),
  businessAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  linesOfBusiness: z.array(z.string()).optional(),
  preferredCarriers: z.array(z.string()).optional(),
  clientIndustries: z.array(z.string()).optional(),
  averageClientSize: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Authenticate the request
    const user = await currentUser();
    const userId = user?.id;
    
    console.log('Authentication debug:');
    console.log('- User ID:', userId);
    console.log('- User object:', user ? 'exists' : 'null');
    
    // Check if user is authenticated
    if (!userId) {
      console.error('Authentication failed: No user ID');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const data = await request.json();
    console.log('Received organization data:', JSON.stringify(data, null, 2));
    
    // Validate input data
    const parsedData = organizationSchema.safeParse(data);
    if (!parsedData.success) {
      console.error('Validation failed:', parsedData.error.flatten());
      return NextResponse.json(
        { error: 'Invalid organization data', details: parsedData.error.flatten() },
        { status: 400 }
      );
    }

    const organizationData = parsedData.data;

    // Store organization data in user's metadata (simpler approach)
    console.log('Storing organization data in user metadata...');
    
    try {
      const clerk = await clerkClient();
      
      // Update user metadata with organization information
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          organization: organizationData,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
        },
      });
      
      console.log('User metadata updated successfully');

      const successResponse = {
        success: true,
        message: 'Organization data saved successfully',
        organization: organizationData
      };
      
      console.log('Returning success response:', JSON.stringify(successResponse, null, 2));

      return NextResponse.json(successResponse);
    } catch (updateError: any) {
      console.error('Error updating user metadata:', updateError);
      throw updateError;
    }
  } catch (error: any) {
    console.error('Error saving organization data:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Provide more specific error messages
    let errorMessage = 'Failed to save organization data';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific errors
      if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
        statusCode = 401;
      } else if (error.message.includes('permission') || error.message.includes('forbidden')) {
        statusCode = 403;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error),
        errorType: error?.constructor?.name || 'Unknown'
      },
      { status: statusCode }
    );
  }
}