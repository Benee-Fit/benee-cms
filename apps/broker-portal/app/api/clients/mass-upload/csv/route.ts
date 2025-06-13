import { NextRequest, NextResponse } from 'next/server';
import { database } from '@repo/database';

interface CSVClient {
  companyName: string;
  policyNumber: string;
  planManagementFee: number;
  hasBrokerSplit: boolean;
  brokerSplit?: number;
}

interface ProcessingResult {
  success: CSVClient[];
  duplicates: CSVClient[];
  errors: { row: number; error: string; data: any }[];
}

export async function POST(request: NextRequest) {
  try {
    const { clients } = await request.json();
    
    if (!Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json(
        { error: 'Invalid client data provided' },
        { status: 400 }
      );
    }

    const result: ProcessingResult = {
      success: [],
      duplicates: [],
      errors: []
    };

    // Get existing policy numbers for duplicate checking
    const existingPolicyNumbers = new Set(
      (await database.brokerClient.findMany({
        select: { policyNumber: true }
      })).map(client => client.policyNumber)
    );

    // Track policy numbers within this batch for internal duplicates
    const batchPolicyNumbers = new Set<string>();

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      
      try {
        // Validate required fields
        if (!client.companyName || !client.policyNumber) {
          result.errors.push({
            row: i + 2, // +2 because CSV has header and is 1-indexed
            error: 'Missing required fields: companyName or policyNumber',
            data: client
          });
          continue;
        }

        // Validate plan management fee
        if (isNaN(client.planManagementFee) || client.planManagementFee < 0) {
          result.errors.push({
            row: i + 2,
            error: 'Invalid plan management fee',
            data: client
          });
          continue;
        }

        // Validate broker split percentage if hasBrokerSplit is true
        if (client.hasBrokerSplit) {
          if (!client.brokerSplit || isNaN(client.brokerSplit) || client.brokerSplit < 0 || client.brokerSplit > 100) {
            result.errors.push({
              row: i + 2,
              error: 'Invalid broker split percentage (must be between 0-100)',
              data: client
            });
            continue;
          }
        }

        // Check for duplicates (existing or within batch)
        if (existingPolicyNumbers.has(client.policyNumber) || batchPolicyNumbers.has(client.policyNumber)) {
          result.duplicates.push(client);
          continue;
        }

        // Add to successful clients
        batchPolicyNumbers.add(client.policyNumber);
        result.success.push(client);
        
      } catch (error) {
        result.errors.push({
          row: i + 2,
          error: error instanceof Error ? error.message : 'Unknown validation error',
          data: client
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing CSV data:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV data' },
      { status: 500 }
    );
  }
}