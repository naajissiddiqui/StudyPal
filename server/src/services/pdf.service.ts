export interface ExtractedPDFResult {
  text: string;
  pageCount: number;
  info?: Record<string, any>;
  characterCount: number;
}

export class PDFService {
  /**
   * Lazily loads the PDF parser function only when needed.
   * Avoids top-level imports and serverless module initialization crashes.
   */
  private async loadPdfParser(): Promise<(buffer: Buffer, options?: any) => Promise<any>> {
    try {
      // Direct require to lib/pdf-parse avoids index.js module.parent side-effects
      // and eliminates any need for canvas/DOMMatrix native addons.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParser = require('pdf-parse/lib/pdf-parse.js');
      if (typeof pdfParser === 'function') {
        return pdfParser;
      }
      if (pdfParser && typeof pdfParser.default === 'function') {
        return pdfParser.default;
      }
      return pdfParser;
    } catch {
      // Fallback to standard dynamic import if require is unavailable
      const imported: any = await import('pdf-parse');
      return imported.default || imported;
    }
  }

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
      const parsePdf = await this.loadPdfParser();
      const parsedData = await parsePdf(buffer);
      parsedText = parsedData?.text || '';
      pageCount = parsedData?.numpages || 1;
      parsedInfo = parsedData?.info || undefined;
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

