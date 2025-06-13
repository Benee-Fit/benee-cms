// Type definitions for PDF processing packages
declare module 'adm-zip' {
  class AdmZip {
    constructor(data?: Buffer | string);
    getEntries(): Array<{
      entryName: string;
      isDirectory: boolean;
      getData(): Buffer;
    }>;
  }
  export = AdmZip;
}

declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
  }
  
  function pdfParse(buffer: Buffer): Promise<PDFData>;
  export = pdfParse;
}