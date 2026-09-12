import { PDFParse } from 'pdf-parse';

export interface ExtractedPDFResult {
  text: string;
  pageCount: number;
  info?: Record<string, any>;
  characterCount: number;
}

export class PDFService {
  /**
   * Validates and extracts text from a PDF Buffer.
   * Ensures non-empty extractable text and handles corrupted or scanned PDFs gracefully.
   */
  async extractText(buffer: Buffer): Promise<ExtractedPDFResult> {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      const err: any = new Error('No PDF file buffer provided or file is empty');
      err.statusCode = 400;
      throw err;
    }

    // Check PDF magic header (%PDF-)
    const header = buffer.subarray(0, 5).toString('ascii');
    if (!header.startsWith('%PDF')) {
      const err: any = new Error('The uploaded file is not a valid PDF document');
      err.statusCode = 400;
      throw err;
    }

    let parsedText = '';
    let pageCount = 1;
    let parsedInfo: any;

    try {
      // PDFParse v2 class usage
      const parser = new PDFParse({ data: buffer });
      const parsedData = await parser.getText();
      parsedText = parsedData?.text || '';
      pageCount = parsedData?.total || 1;
      try {
        parsedInfo = await parser.getInfo();
      } catch {
        // info extraction is optional
      }
      try {
        await parser.destroy();
      } catch {
        // cleanup
      }
    } catch (parseErr: any) {
      console.error('[PDFService] Error parsing PDF buffer:', parseErr?.message || parseErr);
      const err: any = new Error('Failed to read and parse the PDF document. The file may be password protected or corrupted.');
      err.statusCode = 422;
      throw err;
    }

    const cleanedText = this.sanitizeExtractedText(parsedText);

    if (cleanedText.length < 20) {
      const err: any = new Error(
        'No readable text could be extracted from this PDF. Please ensure the document is not an image-only scan and contains selectable text.'
      );
      err.statusCode = 422;
      throw err;
    }

    // Protect token budget: safely bound to 60,000 characters
    const boundedText = cleanedText.length > 60000 ? cleanedText.substring(0, 60000) : cleanedText;

    return {
      text: boundedText,
      pageCount,
      info: parsedInfo,
      characterCount: boundedText.length
    };
  }

  /**
   * Sanitizes extracted PDF text by removing unprintable characters and normalizing whitespace
   */
  private sanitizeExtractedText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove ASCII control characters
      .replace(/[ \t]+/g, ' ')                          // collapse multiple horizontal spaces
      .replace(/\n{3,}/g, '\n\n')                      // collapse excessive blank lines
      .trim();
  }
}

export const pdfService = new PDFService();
