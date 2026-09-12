import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { pdfService } from '../services/pdf.service';
import { aiService } from '../services/ai.service';

export class SyllabusController {
  /**
   * POST /api/syllabus/upload
   * Accepts an authenticated user's uploaded syllabus PDF (representing the full academic curriculum),
   * extracts text, parses all subjects/units/topics via Gemini, and returns structured curriculum.
   */
  async uploadAndParseSyllabus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication is required to upload a syllabus' }
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No syllabus PDF file was uploaded' }
        });
        return;
      }

      // Validate mimetype
      const allowedMimes = ['application/pdf', 'application/x-pdf', 'application/acrobat'];
      if (!allowedMimes.includes(req.file.mimetype) && !req.file.originalname.toLowerCase().endsWith('.pdf')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_FILE_TYPE', message: 'Only PDF documents (.pdf) are supported' }
        });
        return;
      }

      const originalFileName = req.file.originalname || 'syllabus.pdf';

      // 1. Extract text from PDF buffer
      const extraction = await pdfService.extractText(req.file.buffer);

      // 2. Parse syllabus with Gemini using plan-level multi-subject prompt
      const parsedSyllabus = await aiService.parseSyllabusWithAI(extraction.text);

      // 3. Process each subject and attach flattened topics
      const processedSubjects = parsedSyllabus.subjects.map(subject => {
        const flattenedTopics: Array<{
          name: string;
          unitName: string;
          subtopics: string[];
          keyConcepts: string[];
          status: 'WEAK' | 'AVERAGE' | 'STRONG';
        }> = [];

        for (const unit of subject.units) {
          for (const topic of unit.topics) {
            flattenedTopics.push({
              name: topic.name,
              unitName: unit.name,
              subtopics: topic.subtopics || [],
              keyConcepts: topic.keyConcepts || [],
              status: 'AVERAGE'
            });
          }
        }

        return {
          name: subject.name,
          overview: subject.overview,
          units: subject.units,
          flattenedTopics
        };
      });

      res.status(200).json({
        success: true,
        message: `Successfully extracted ${processedSubjects.length} subject(s) from "${originalFileName}"`,
        data: {
          fileName: originalFileName,
          institution: parsedSyllabus.institution,
          program: parsedSyllabus.program,
          pageCount: extraction.pageCount,
          rawTextLength: extraction.characterCount,
          subjects: processedSubjects
        }
      });
    } catch (err: any) {
      console.error('[SyllabusController] uploadAndParseSyllabus error:', err?.message || err);
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'SYLLABUS_PROCESSING_ERROR',
          message: err.message || 'Failed to process syllabus PDF'
        }
      });
    }
  }
}

export const syllabusController = new SyllabusController();
