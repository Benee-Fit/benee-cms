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
  // Accept both nested businessAddress and flat structure
  businessAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  linesOfBusiness: z.array(z.string()).optional(),
  preferredCarriers: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    // Authenticate the request
    const user = await currentUser();
    const userId = user?.id;
    
    console.log('Authentication debug:');
    console.log('- User ID:', userId);
    console.log('- User object:', user ? 'exists' : 'null');
    console.log('- User private metadata:', user?.privateMetadata);
    
    // Get organizations that user belongs to
    let orgId = null;
    if (user?.privateMetadata?.orgId) {
      orgId = user.privateMetadata.orgId as string;
      console.log('- Existing org ID:', orgId);
    }
    
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

    const { organizationName, ...orgMetadata } = parsedData.data;

    // If organization already exists, just update it
    if (orgId) {
      console.log('Updating existing organization:', orgId);
      try {
        const clerk = await clerkClient();
        console.log('Clerk client initialized for update');
        
        // First check if organization exists
        try {
          const existingOrg = await clerk.organizations.getOrganization({ organizationId: orgId });
          console.log('Found existing organization:', existingOrg.id);
        } catch (checkError: any) {
          console.error('Organization not found:', checkError);
          // Clear the invalid orgId from user metadata
          await clerk.users.updateUserMetadata(userId, {
            privateMetadata: {
              orgId: null,
            },
          });
          // Continue to create new organization
          orgId = null;
        }
        
        if (orgId) {
          const updatedOrg = await clerk.organizations.updateOrganization(orgId, {
            name: organizationName,
            publicMetadata: orgMetadata,
          });
          
          const successResponse = {
            success: true,
            message: 'Organization updated successfully',
            organization: {
              id: updatedOrg.id,
              name: updatedOrg.name,
              ...orgMetadata
            }
          };
          
          console.log('Returning success response:', JSON.stringify(successResponse, null, 2));

          return NextResponse.json(successResponse);
        }
      } catch (updateError: any) {
        console.error('Error updating organization:', updateError);
        console.error('Update error status:', updateError?.status);
        console.error('Update error message:', updateError?.message);
        
        // If it's a 404, organization doesn't exist, so create a new one
        if (updateError?.status === 404 || updateError?.message?.includes('not found')) {
          console.log('Organization not found, will create a new one');
          orgId = null;
        } else {
          throw updateError;
        }
      }
    }
    
    // Create new organization
    console.log('Creating new organization with metadata...');
    
    try {
      const clerk = await clerkClient();
      console.log('Clerk client initialized for creation');
      console.log('Attempting to create organization with params:', {
        name: organizationName,
        createdBy: userId,
        hasPublicMetadata: !!orgMetadata
      });
      
      const newOrg = await clerk.organizations.createOrganization({
        name: organizationName,
        createdBy: userId,
        publicMetadata: orgMetadata,
      });
      console.log('Organization created successfully:', { id: newOrg.id, name: newOrg.name });

      // No need to manually add the user as admin - they are automatically made admin via createdBy
      console.log('User is automatically an admin via createdBy parameter');

      // Update user metadata with organization ID
      try {
        await clerk.users.updateUserMetadata(userId, {
          privateMetadata: {
            orgId: newOrg.id,
          },
        });
        console.log('User metadata updated with org ID:', newOrg.id);
      } catch (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        // Don't fail the whole operation for this
      }

      const successResponse = {
        success: true,
        message: 'Organization created successfully',
        organization: {
          id: newOrg.id,
          name: newOrg.name,
          ...orgMetadata
        }
      };
      
      console.log('Returning success response:', JSON.stringify(successResponse, null, 2));

      return NextResponse.json(successResponse);
    } catch (createError: any) {
      console.error('Error in organization creation process:', createError);
      console.error('Create error message:', createError?.message);
      console.error('Create error status:', createError?.status);
      console.error('Create error details:', createError?.errors);
      console.error('Create error response:', createError?.response);
      console.error('Full error object:', JSON.stringify(createError, null, 2));
      
      // Check if it's a Clerk API error
      if (createError?.message?.includes('not found') || createError?.status === 404) {
        console.error('Clerk Organizations API returned 404. Please ensure:');
        console.error('1. Organizations feature is enabled in your Clerk dashboard');
        console.error('2. Your Clerk plan supports organizations');
        console.error('3. CLERK_SECRET_KEY is correctly configured');
      }
      
      throw createError;
    }
  } catch (error: any) {
    console.error('Error creating organization:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create or update organization';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific Clerk errors
      if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
        statusCode = 401;
      } else if (error.message.includes('permission') || error.message.includes('forbidden')) {
        statusCode = 403;
      } else if (error.message.includes('not found')) {
        statusCode = 404;
        errorMessage = 'Organizations feature not available. Please check: 1) Organizations is enabled in Clerk dashboard, 2) Your Clerk plan supports organizations, 3) API keys are correctly configured';
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
