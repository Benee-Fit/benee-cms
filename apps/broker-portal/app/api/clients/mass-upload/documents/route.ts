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
  
  try {
    for (const client of clientData) {
      const created = await database.brokerClient.create({
        data: {
          companyName: client.companyName,
          policyNumber: client.policyNumber,
          // Set default values - these will be updated from PDF analysis
          renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          headcount: 1,
          premium: client.planManagementFee * 10, // Estimate
          revenue: client.planManagementFee * 100, // Estimate
          industry: 'Unknown', // Will be updated later
        },
      });
      createdClients.set(client.policyNumber, created.id);
    }
  } catch (error) {
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
              if (analysis.renewalDate || analysis.premium || analysis.headcount) {
                const updateData: any = {};
                
                if (analysis.renewalDate) {
                  try {
                    updateData.renewalDate = new Date(analysis.renewalDate);
                  } catch (e) {
                    // Invalid date format, skip
                  }
                }
                
                if (analysis.premium && analysis.premium > 0) {
                  updateData.premium = analysis.premium;
                }
                
                if (analysis.headcount && analysis.headcount > 0) {
                  updateData.headcount = analysis.headcount;
                }

                if (Object.keys(updateData).length > 0) {
                  await database.brokerClient.update({
                    where: { id: matchedClientId },
                    data: updateData,
                  });
                }
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