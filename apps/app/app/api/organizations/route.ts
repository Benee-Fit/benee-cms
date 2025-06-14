import { currentUser, clerkClient } from '@repo/auth/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for validating organization data
const organizationSchema = z.object({
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
    
    // Get organizations that user belongs to
    let orgId = null;
    if (user?.privateMetadata?.orgId) {
      orgId = user.privateMetadata.orgId as string;
    }
    
    // Check if user is authenticated
    if (!userId) {
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
      const clerk = await clerkClient();
      const updatedOrg = await clerk.organizations.updateOrganization(orgId, {
        name: organizationName,
        publicMetadata: orgMetadata,
      });
      
      return NextResponse.json({
        success: true,
        message: 'Organization updated successfully',
        organization: {
          id: updatedOrg.id,
          name: updatedOrg.name,
          ...orgMetadata
        }
      });
    }
    
    // Create new organization
    const clerk = await clerkClient();
    const newOrg = await clerk.organizations.createOrganization({
      name: organizationName,
      createdBy: userId,
      publicMetadata: orgMetadata,
    });
    
    // Add current user as admin
    await clerk.organizations.createOrganizationMembership({
      organizationId: newOrg.id,
      userId,
      role: 'admin',
    });

    return NextResponse.json({
      success: true,
      message: 'Organization created successfully',
      organization: {
        id: newOrg.id,
        name: newOrg.name,
        ...orgMetadata
      }
    });
    
  } catch (error) {
    console.error('Error creating organization:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create or update organization';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}
