// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse');

export async function extractTextFromDocument(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string> {
  try {
    if (mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
      const parser = new PDFParse({ data: fileBuffer });
      const data = await parser.getText();
      return data.text.replace(/\s+/g, ' ').trim();
    } else if (mimeType.startsWith('text/') || filename.toLowerCase().endsWith('.txt')) {
      return fileBuffer.toString('utf-8').replace(/\s+/g, ' ').trim();
    } else {
      throw new Error('Unsupported file format. Please upload PDF or TXT files.');
    }
  } catch (error: any) {
    console.error('Document Extraction Error:', error);
    throw new Error(`Failed to extract text from document: ${error.message}`);
  }
}
