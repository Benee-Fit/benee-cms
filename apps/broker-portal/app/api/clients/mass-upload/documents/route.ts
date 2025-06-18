import { NextRequest } from 'next/server';
import { database } from '@repo/database';
import { uploadToSpaces } from '../../../../../lib/do-spaces';
import { analyzeInsuranceDocument } from '@/lib/gemini';
import AdmZip from 'adm-zip';

interface CSVClient {
  companyName: string;
  policyNumber: string;
  planManagementFee: number;
  hasBrokerSplit: boolean;
  brokerSplit?: number;
  parent?: string;
}

interface DocumentProcessingResult {
  fileName: string;
  status: 'processing' | 'success' | 'error' | 'unmatched';
  clientId?: string;
  documentType?: string;
  extractedData?: {
    carrier?: string;
    renewalDate?: string;
    premium?: number;
    headcount?: number;
  };
  error?: string;
}

// Helper function to send streaming updates
function sendUpdate(encoder: TextEncoder, controller: ReadableStreamDefaultController, data: any) {
  const chunk = encoder.encode(JSON.stringify(data) + '\n');
  controller.enqueue(chunk);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const zipFile = formData.get('zipFile') as File;
  const clientDataStr = formData.get('clientData') as string;
  
  if (!zipFile || !clientDataStr) {
    return new Response(
      JSON.stringify({ error: 'Missing required files or data' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let clientData: CSVClient[];
  try {
    clientData = JSON.parse(clientDataStr);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid client data format' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create clients in database first
  const createdClients = new Map<string, string>(); // policyNumber -> clientId
  const companyNameToId = new Map<string, string>(); // companyName -> clientId
  
  try {
    // First, create parent companies (those without parent field or referenced as parents)
    const parentCompanies = new Set<string>();
    const childCompanies: CSVClient[] = [];
    
    // Identify parent companies and child companies
    for (const client of clientData) {
      if (client.parent) {
        childCompanies.push(client);
        parentCompanies.add(client.parent);
      } else {
        parentCompanies.add(client.companyName);
      }
    }
    
    // Create parent companies first
    for (const client of clientData) {
      if (!client.parent) {
        const created = await database.brokerClient.create({
          data: {
            companyName: client.companyName,
            policyNumber: client.policyNumber,
            // Set default values - these will be updated from PDF analysis
            renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            headcount: 0, // 0 for holding companies, will be calculated from divisions
            premium: 0, // Will be updated from PDF analysis
            revenue: 0, // Will be updated from PDF analysis
            industry: 'Unknown', // Will be updated later
            // Use CSV data if available
            planManagementFee: client.planManagementFee ? client.planManagementFee : undefined,
            splitWithAnotherBroker: client.hasBrokerSplit || false,
            brokerCommissionSplit: client.brokerSplit ? client.brokerSplit : undefined,
          },
        });
        createdClients.set(client.policyNumber, created.id);
        companyNameToId.set(client.companyName.toLowerCase().trim(), created.id);
      }
    }
    
    // Create parent companies that are referenced but not in the CSV
    for (const parentName of parentCompanies) {
      const normalizedParentName = parentName.toLowerCase().trim();
      if (!companyNameToId.has(normalizedParentName)) {
        // Find the first child to get broker details
        const firstChild = childCompanies.find(c => c.parent?.toLowerCase().trim() === normalizedParentName);
        if (firstChild) {
          const created = await database.brokerClient.create({
            data: {
              companyName: parentName,
              policyNumber: `HOLDING-${Date.now()}`, // Generate unique policy number
              renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
              headcount: 0, // 0 for holding companies, will be calculated from divisions
              premium: 0, // Will be aggregated from divisions
              revenue: 0, // Will be aggregated from divisions
              industry: 'Holding Company',
              planManagementFee: firstChild.planManagementFee,
              splitWithAnotherBroker: firstChild.hasBrokerSplit || false,
              brokerCommissionSplit: firstChild.brokerSplit ? firstChild.brokerSplit : undefined,
            },
          });
          companyNameToId.set(normalizedParentName, created.id);
        }
      }
    }
    
    // Now create child companies with parent references
    for (const client of childCompanies) {
      const parentId = client.parent ? companyNameToId.get(client.parent.toLowerCase().trim()) : undefined;
      
      const created = await database.brokerClient.create({
        data: {
          companyName: client.companyName,
          policyNumber: client.policyNumber,
          renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          headcount: 1,
          premium: 0, // Will be updated from PDF analysis
          revenue: 0, // Will be updated from PDF analysis
          industry: 'Unknown', // Will be updated later
          planManagementFee: client.planManagementFee ? client.planManagementFee : undefined,
          splitWithAnotherBroker: client.hasBrokerSplit || false,
          brokerCommissionSplit: client.brokerSplit ? client.brokerSplit : undefined,
          parentId: parentId,
        },
      });
      createdClients.set(client.policyNumber, created.id);
      companyNameToId.set(client.companyName.toLowerCase().trim(), created.id);
    }
    
    // Update parent companies with aggregated data
    for (const parentName of parentCompanies) {
      const parentId = companyNameToId.get(parentName.toLowerCase().trim());
      if (parentId) {
        const divisions = await database.brokerClient.findMany({
          where: { parentId },
          select: { premium: true, revenue: true }
        });
        
        if (divisions.length > 0) {
          const totalPremium = Math.min(
            divisions.reduce((sum, div) => sum + Number(div.premium || 0), 0),
            99999999.99
          );
          const totalRevenue = Math.min(
            divisions.reduce((sum, div) => sum + Number(div.revenue || 0), 0),
            99999999.99
          );
          
          await database.brokerClient.update({
            where: { id: parentId },
            data: { 
              premium: totalPremium,
              revenue: totalRevenue
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error creating clients:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create clients in database' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Set up streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Process ZIP file
        const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
        const zip = new AdmZip(zipBuffer);
        const entries = zip.getEntries();
        
        const pdfEntries = entries.filter(entry => {
          const name = entry.entryName.toLowerCase();
          return name.endsWith('.pdf') && 
                 !entry.isDirectory && 
                 !name.includes('__macosx') && // Skip Mac OS metadata
                 !name.startsWith('.'); // Skip hidden files
        });

        if (pdfEntries.length === 0) {
          sendUpdate(encoder, controller, {
            type: 'error',
            message: 'No PDF files found in ZIP archive'
          });
          controller.close();
          return;
        }

        sendUpdate(encoder, controller, {
          type: 'upload_progress',
          progress: 100
        });

        const results: DocumentProcessingResult[] = [];
        let processedCount = 0;

        // Process each PDF
        for (const entry of pdfEntries) {
          const result: DocumentProcessingResult = {
            fileName: entry.entryName,
            status: 'processing'
          };

          sendUpdate(encoder, controller, {
            type: 'document_result',
            result
          });

          try {
            // Extract PDF text
            const pdfBuffer = entry.getData();
            
            // Ensure we have a valid buffer
            if (!pdfBuffer || pdfBuffer.length === 0) {
              result.status = 'error';
              result.error = 'PDF file is empty or corrupted';
              results.push(result);
              
              sendUpdate(encoder, controller, {
                type: 'document_result',
                result
              });
              continue;
            }
            
            // Skip files that are too small (likely corrupted) or too large
            const fileSizeMB = pdfBuffer.length / (1024 * 1024);
            if (fileSizeMB < 0.001) { // Less than 1KB
              result.status = 'error';
              result.error = 'PDF file is too small to be valid';
              results.push(result);
              
              sendUpdate(encoder, controller, {
                type: 'document_result',
                result
              });
              continue;
            }
            
            if (fileSizeMB > 50) { // More than 50MB
              result.status = 'error';
              result.error = 'PDF file is too large (max 50MB per file)';
              results.push(result);
              
              sendUpdate(encoder, controller, {
                type: 'document_result',
                result
              });
              continue;
            }
            
            // Analyze with AI using Gemini's document understanding
            const analysis = await analyzeInsuranceDocument(pdfBuffer, entry.entryName, clientData);
            
            result.extractedData = {
              carrier: analysis.carrier || undefined,
              renewalDate: analysis.renewalDate || undefined,
              premium: analysis.premium || undefined,
              headcount: analysis.headcount || undefined,
            };
            result.documentType = analysis.documentType;

            // Try to match to a client
            let matchedClientId: string | undefined;
            
            // If this is a holding company document, try to match to the parent company
            if (analysis.isHoldingCompany && analysis.matchedCompanyName) {
              // Look for the parent company by name
              matchedClientId = companyNameToId.get(analysis.matchedCompanyName.toLowerCase().trim());
              
              // If not found by exact match, try partial matching
              if (!matchedClientId) {
                for (const [normalizedName, id] of companyNameToId.entries()) {
                  if (normalizedName.includes(analysis.matchedCompanyName.toLowerCase()) ||
                      analysis.matchedCompanyName.toLowerCase().includes(normalizedName)) {
                    // Check if this is actually a parent company (not a division)
                    const client = await database.brokerClient.findUnique({
                      where: { id },
                      select: { parentId: true }
                    });
                    if (!client?.parentId) {
                      matchedClientId = id;
                      break;
                    }
                  }
                }
              }
            } else {
              // Regular matching logic for division documents
              if (analysis.matchedPolicyNumber && createdClients.has(analysis.matchedPolicyNumber)) {
                matchedClientId = createdClients.get(analysis.matchedPolicyNumber);
              } else if (analysis.matchedCompanyName) {
                // Try to find by company name
                const matchedClient = clientData.find(c => 
                  c.companyName.toLowerCase().includes(analysis.matchedCompanyName!.toLowerCase()) ||
                  analysis.matchedCompanyName!.toLowerCase().includes(c.companyName.toLowerCase())
                );
                if (matchedClient) {
                  matchedClientId = createdClients.get(matchedClient.policyNumber);
                }
              }
            }

            if (matchedClientId) {
              // Upload PDF to DO Spaces
              const fileKey = `client-documents/${matchedClientId}/${Date.now()}-${entry.entryName}`;
              const fileUrl = await uploadToSpaces(fileKey, pdfBuffer, 'application/pdf');

              // Generate document title from filename (remove path and extension)
              const fileName = entry.entryName.split('/').pop() || entry.entryName;
              const documentTitle = fileName.replace(/\.[^/.]+$/, '');

              // Save to database
              await database.clientDocument.create({
                data: {
                  clientId: matchedClientId,
                  fileName: entry.entryName,
                  fileType: 'application/pdf',
                  fileUrl: fileUrl,
                  documentType: analysis.documentType,
                  description: analysis.summary || 'Document processed via mass upload',
                  documentTitle,
                  jsonData: analysis,
                },
              });

              // Update client with extracted data if available
              const updateData: any = {};
              
              if (analysis.renewalDate) {
                try {
                  updateData.renewalDate = new Date(analysis.renewalDate);
                } catch (e) {
                  // Invalid date format, skip
                }
              }
              
              if (analysis.premium && analysis.premium > 0) {
                updateData.premium = Math.min(analysis.premium, 99999999.99);
              }
              
              if (analysis.headcount && analysis.headcount > 0) {
                updateData.headcount = analysis.headcount;
              }

              // Update new fields
              if (analysis.companySize) {
                updateData.companySize = analysis.companySize;
              }
              
              if (analysis.companyLocation) {
                updateData.companyLocation = analysis.companyLocation;
              }
              
              if (analysis.leadershipCEO) {
                updateData.leadershipCEO = analysis.leadershipCEO;
              }
              
              if (analysis.leadershipCFO) {
                updateData.leadershipCFO = analysis.leadershipCFO;
              }
              
              if (analysis.leadershipCHRO) {
                updateData.leadershipCHRO = analysis.leadershipCHRO;
              }
              
              if (analysis.planAdmin) {
                updateData.planAdmin = analysis.planAdmin;
              }
              
              if (analysis.currentCarrier || analysis.carrier) {
                updateData.currentCarrier = analysis.currentCarrier || analysis.carrier;
              }
              
              if (analysis.withCarrierSince) {
                try {
                  updateData.withCarrierSince = new Date(analysis.withCarrierSince);
                } catch (e) {
                  // Invalid date format, skip
                }
              }
              
              if (analysis.planType) {
                updateData.planType = analysis.planType;
              }
              
              if (analysis.planManagementFee && analysis.planManagementFee > 0) {
                updateData.planManagementFee = Math.min(analysis.planManagementFee, 99999999.99);
              }
              
              if (analysis.brokerCommissionSplit && analysis.brokerCommissionSplit > 0) {
                updateData.brokerCommissionSplit = analysis.brokerCommissionSplit;
              }

              if (Object.keys(updateData).length > 0) {
                await database.brokerClient.update({
                  where: { id: matchedClientId },
                  data: updateData,
                });
              }

              result.status = 'success';
              result.clientId = matchedClientId;
            } else {
              result.status = 'unmatched';
            }

          } catch (error) {
            console.error(`Error processing ${entry.entryName}:`, error);
            result.status = 'error';
            result.error = error instanceof Error ? error.message : 'Unknown processing error';
          }

          results.push(result);
          processedCount++;

          // Send progress update
          const progress = Math.round((processedCount / pdfEntries.length) * 100);
          sendUpdate(encoder, controller, {
            type: 'document_progress',
            progress
          });

          sendUpdate(encoder, controller, {
            type: 'document_result',
            result
          });
        }

        // Update parent companies with new aggregated totals after all documents are processed
        const processedParentIds = new Set<string>();
        
        for (const [_, clientId] of createdClients) {
          const client = await database.brokerClient.findUnique({
            where: { id: clientId },
            select: { parentId: true }
          });
          
          if (client?.parentId) {
            processedParentIds.add(client.parentId);
          }
        }
        
        // Update each parent company with aggregated revenue and premium
        for (const parentId of processedParentIds) {
          const divisions = await database.brokerClient.findMany({
            where: { parentId },
            select: { premium: true, revenue: true }
          });
          
          if (divisions.length > 0) {
            const totalPremium = Math.min(
              divisions.reduce((sum, div) => sum + Number(div.premium || 0), 0),
              99999999.99
            );
            const totalRevenue = Math.min(
              divisions.reduce((sum, div) => sum + Number(div.revenue || 0), 0),
              99999999.99
            );
            
            await database.brokerClient.update({
              where: { id: parentId },
              data: { 
                premium: totalPremium,
                revenue: totalRevenue
              }
            });
          }
        }
        
        // Send final results
        sendUpdate(encoder, controller, {
          type: 'complete',
          results
        });

      } catch (error) {
        console.error('Error in document processing:', error);
        sendUpdate(encoder, controller, {
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
    },
  });
}