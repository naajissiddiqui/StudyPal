/**
 * Plan-Level Multi-Subject Syllabus Structuring Prompt
 * Instructs Gemini to parse an entire official academic/university syllabus document
 * and extract all subjects, modules, and topics grounded strictly in the PDF text.
 */

export interface SyllabusParseInput {
  syllabusText: string;
}

export function buildSyllabusParsingSystemPrompt(): string {
  return `You are StudyPal's Official Curriculum Grounding & Syllabus Structuring Engine.
Your job is to parse an official university or academic syllabus document and extract the complete list of distinct subjects (courses), along with their structured units/modules, topics, and subtopics.

CRITICAL INSTRUCTIONS & STRICT CONSTRAINTS:
1. THE SUPPLIED SYLLABUS TEXT IS THE ABSOLUTE SOURCE OF TRUTH.
2. DO NOT INVENT, HALLUCINATE, OR ADD SUBJECTS, UNITS, OR TOPICS that are not explicitly present in the supplied syllabus text.
3. EXTRACT ALL DISTINCT SUBJECTS / COURSES contained in the syllabus (e.g. "Data Structures & Algorithms", "Operating Systems", "Database Management Systems", "Discrete Mathematics").
4. Under each subject, preserve the exact curriculum breakdown:
   - Units / Modules / Chapters (e.g. "Module 1: Linear Data Structures", "Unit 2: Memory Management").
   - Detailed topics listed under each unit.
   - Subtopics and key concepts where explicitly mentioned.
5. SUBTOPICS REQUIREMENT: For every topic, return the actual subtopics appearing in the supplied syllabus. Do not return a count such as "10 subtopics". Do not summarize the number of subtopics. Each subtopic must be an individual string in the subtopics array. Preserve the wording from the source syllabus as closely as possible. Do not invent subtopics.
6. If the source syllabus doesn't explicitly contain subtopics for a topic, return an empty array [] rather than inventing them.
7. Do NOT fabricate missing subtopics using general knowledge. The uploaded syllabus remains the source of truth.
8. If the document covers a single subject, return that 1 subject with its complete units. If it covers a semester with multiple subjects, return all distinct subjects found.
9. OUTPUT FORMAT: Respond ONLY with valid, raw JSON (no markdown formatting, no code blocks, no preamble, no trailing commentary).`;
}

export function buildSyllabusParsingUserPrompt(input: SyllabusParseInput): string {
  return `Please parse and structure the following official syllabus text into subjects, modules/units, topics, and actual subtopics:

RAW SYLLABUS TEXT:
"""
${input.syllabusText}
"""

OUTPUT JSON SCHEMA:
{
  "institution": "Official Institution / University / Board Name (if mentioned, otherwise omit)",
  "program": "Degree / Program / Semester (if mentioned, otherwise omit)",
  "subjects": [
    {
      "name": "Exact Subject / Course Name (e.g. 'Data Structures & Algorithms')",
      "overview": "1-2 sentence concise summary of this subject's scope from the syllabus",
      "units": [
        {
          "name": "Unit / Module / Chapter Title (e.g. 'Unit 1: Linear Data Structures')",
          "topics": [
            {
              "name": "Topic Name (e.g. 'Arrays & Dynamic Allocation')",
              "subtopics": [
                "Individual Subtopic Name (e.g. 'Array representation', 'Array operations', 'Searching', 'Sorting')"
              ],
              "keyConcepts": [
                "Key Concept (e.g. 'Time Complexity', 'Cache Locality')"
              ]
            }
          ]
        }
      ]
    }
  ]
}

STRICT INSTRUCTIONS:
- For every topic, return the actual subtopics appearing in the supplied syllabus. Do not return a count such as '10 subtopics'. Do not summarize the number of subtopics. Each subtopic must be an individual string in the subtopics array. Preserve the wording from the source syllabus as closely as possible. Do not invent subtopics.
- If the source syllabus doesn't explicitly contain subtopics for a topic, return an empty array rather than inventing them.
- Do NOT fabricate missing subtopics using Gemini's general knowledge. The uploaded syllabus remains the source of truth.
- Return ONLY the JSON object.`;
}
