import { clerkClient } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';

// Schema for validating organization data
const organizationSchema = z.object({
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
});

export async function POST(request: Request) {
  try {
    const { userId, orgId } = auth();

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Validate input data
    const parsedData = organizationSchema.safeParse(data);
    if (!parsedData.success) {
      return NextResponse.json(
        { error: 'Invalid organization data', details: parsedData.error.flatten() },
        { status: 400 }
      );
    }

    const { organizationName, ...orgMetadata } = parsedData.data;

    // If organization already exists, just update it
    if (orgId) {
      const updatedOrg = await clerkClient.organizations.updateOrganization(orgId, {
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
    const newOrg = await clerkClient.organizations.createOrganization({
      name: organizationName,
      createdBy: userId,
      publicMetadata: orgMetadata,
    });
    
    // Add current user as admin
    await clerkClient.organizations.createOrganizationMembership({
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
    return NextResponse.json(
      { error: 'Failed to create or update organization' },
      { status: 500 }
    );
  }
}
