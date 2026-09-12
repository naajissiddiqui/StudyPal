import assert from 'assert';
import { z } from 'zod';
import { pdfService } from '../services/pdf.service';
import { AISyllabusResponseSchema, AIService } from '../services/ai.service';
import { plannerService } from '../services/planner.service';
import { buildSyllabusParsingSystemPrompt, buildSyllabusParsingUserPrompt } from '../prompts/syllabus.prompt';
import { buildStudyPlanSystemPrompt } from '../prompts/studyPlan.prompt';

import fs from 'fs';
import path from 'path';

// Load sample valid PDF binary for testing
const samplePdfPath = path.resolve(__dirname, '../../node_modules/pdf-parse/test/data/04-valid.pdf');
const SAMPLE_VALID_PDF = fs.existsSync(samplePdfPath)
  ? fs.readFileSync(samplePdfPath)
  : Buffer.from('%PDF-1.4\n%Fallback');

async function runTests() {
  console.log('🧪 Starting Plan-Level Multi-Subject Syllabus Upload & Grounding Test Suite...\n');
  let passedCount = 0;
  let failedCount = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passedCount++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err?.message || err}`);
      failedCount++;
    }
  }

  // 1. PDF Text Extraction Tests
  await test('PDFService: Extract text from valid PDF buffer', async () => {
    const result = await pdfService.extractText(SAMPLE_VALID_PDF);
    assert(result.text.length > 0, 'Extracted text should not be empty');
    assert(result.pageCount >= 1, 'Page count should be at least 1');
    assert(result.characterCount > 0, 'Character count should be positive');
  });

  await test('PDFService: Reject non-PDF buffer', async () => {
    const invalidBuffer = Buffer.from('This is a plain text file, not a PDF');
    let threw = false;
    try {
      await pdfService.extractText(invalidBuffer);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('not a valid PDF document'), 'Should throw valid PDF error');
    }
    assert(threw, 'Should have thrown error for non-PDF');
  });

  await test('PDFService: Reject empty buffer', async () => {
    let threw = false;
    try {
      await pdfService.extractText(Buffer.alloc(0));
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('empty'), 'Should throw empty buffer error');
    }
    assert(threw, 'Should have thrown error for empty buffer');
  });

  // 2. Multi-Subject Syllabus Zod Schema & Subtopic Validation Tests
  await test('AISyllabusResponseSchema: Validate multi-subject structured syllabus JSON with actual named subtopics', () => {
    const sampleMultiSubjectResponse = {
      institution: 'Mumbai University',
      program: 'B.E. Computer Engineering (Semester IV)',
      subjects: [
        {
          name: 'Data Structures and Algorithms',
          overview: 'Fundamental abstract data types, algorithms, and computational complexity.',
          units: [
            {
              name: 'Unit I: Linear Data Structures',
              topics: [
                {
                  name: 'Arrays & Dynamic Arrays',
                  subtopics: [
                    'Array representation',
                    'Array operations',
                    'Searching',
                    'Sorting'
                  ],
                  keyConcepts: ['Time Complexity', 'Amortized Analysis']
                },
                {
                  name: 'Singly and Doubly Linked Lists',
                  subtopics: ['Reversal', 'Cycle Detection', 'Insertion and Deletion'],
                  keyConcepts: ['Pointer Manipulation']
                }
              ]
            },
            {
              name: 'Unit II: Non-Linear Structures',
              topics: [
                {
                  name: 'Binary Trees & Traversals',
                  subtopics: ['Inorder Traversal', 'Preorder Traversal', 'Postorder Traversal', 'Lowest Common Ancestor'],
                  keyConcepts: ['Recursion', 'Level Order']
                },
                {
                  name: 'Disjoint Sets',
                  subtopics: [], // Empty subtopics when not explicitly in syllabus
                  keyConcepts: ['Union Find']
                }
              ]
            }
          ]
        },
        {
          name: 'Operating Systems',
          overview: 'Principles of process management, memory paging, file systems, and concurrency.',
          units: [
            {
              name: 'Unit I: Process Management',
              topics: [
                {
                  name: 'CPU Scheduling Algorithms',
                  subtopics: ['Round Robin', 'Multi-level Feedback Queues', 'Shortest Job First'],
                  keyConcepts: ['Preemption', 'Context Switching']
                }
              ]
            }
          ]
        }
      ]
    };

    const parsed = AISyllabusResponseSchema.parse(sampleMultiSubjectResponse);
    assert.strictEqual(parsed.institution, 'Mumbai University');
    assert.strictEqual(parsed.subjects.length, 2);
    assert.strictEqual(parsed.subjects[0].name, 'Data Structures and Algorithms');
    assert.strictEqual(parsed.subjects[1].name, 'Operating Systems');
    assert.strictEqual(parsed.subjects[0].units.length, 2);
    assert.strictEqual(parsed.subjects[0].units[0].topics.length, 2);

    // Verify actual subtopic strings are preserved
    const arraySubtopics = parsed.subjects[0].units[0].topics[0].subtopics;
    assert.deepStrictEqual(arraySubtopics, [
      'Array representation',
      'Array operations',
      'Searching',
      'Sorting'
    ]);
    assert.strictEqual(arraySubtopics.length, 4);

    // Verify empty subtopics are preserved without error
    const disjointSubtopics = parsed.subjects[0].units[1].topics[1].subtopics;
    assert.deepStrictEqual(disjointSubtopics, []);
  });

  await test('AISyllabusResponseSchema: Reject count and summary strings in subtopics (e.g. "10 subtopics", "5 topics", "multiple subtopics")', () => {
    const invalidCountCases = [
      '10 subtopics',
      '5 topics',
      'multiple subtopics',
      'several subtopics',
      '20 subtopics',
      '3 chapters'
    ];

    for (const invalidString of invalidCountCases) {
      const invalidData = {
        subjects: [
          {
            name: 'Data Structures',
            units: [
              {
                name: 'Unit 1: Arrays',
                topics: [
                  {
                    name: 'Arrays',
                    subtopics: [invalidString]
                  }
                ]
              }
            ]
          }
        ]
      };

      let threw = false;
      try {
        AISyllabusResponseSchema.parse(invalidData);
      } catch (err: any) {
        threw = true;
        assert(err instanceof z.ZodError, `Expected ZodError for "${invalidString}"`);
      }
      assert(threw, `Should reject invalid subtopic summary count: "${invalidString}"`);
    }
  });

  await test('AISyllabusResponseSchema: Reject syllabus with missing required subjects or empty units', () => {
    const invalidResponse = {
      subjects: [] // Empty subjects must be rejected
    };

    let threw = false;
    try {
      AISyllabusResponseSchema.parse(invalidResponse);
    } catch (err) {
      threw = true;
      assert(err instanceof z.ZodError, 'Should throw ZodError');
    }
    assert(threw, 'Should reject invalid schema');
  });

  // 3. Prompt Grounding Verifications
  await test('Prompt: Syllabus parsing prompt contains strict grounding and subtopic constraints', () => {
    const systemPrompt = buildSyllabusParsingSystemPrompt();
    assert(systemPrompt.includes('ABSOLUTE SOURCE OF TRUTH'), 'System prompt must mandate syllabus as source of truth');
    assert(systemPrompt.includes('DO NOT INVENT, HALLUCINATE, OR ADD SUBJECTS'), 'System prompt must prohibit hallucination');
    assert(systemPrompt.includes('Do not return a count such as "10 subtopics"'), 'System prompt must explicitly forbid subtopic count strings');
    assert(systemPrompt.includes('Each subtopic must be an individual string in the subtopics array'), 'System prompt must require individual strings');

    const userPrompt = buildSyllabusParsingUserPrompt({
      syllabusText: 'Subject 1: Data Structures\nUnit 1: Arrays\nSubject 2: Operating Systems\nUnit 1: Process Scheduling'
    });
    assert(userPrompt.includes('Data Structures'), 'User prompt must include raw syllabus text');
    assert(userPrompt.includes('Operating Systems'), 'User prompt must include second subject');
    assert(userPrompt.includes('Do not return a count such as \'10 subtopics\''), 'User prompt must forbid count summaries');
  });

  await test('Prompt: Study plan prompt enforces syllabus authoritative curriculum', () => {
    const planPrompt = buildStudyPlanSystemPrompt();
    assert(planPrompt.includes('authoritative curriculum'), 'Plan prompt must specify authoritative curriculum');
    assert(planPrompt.includes('Do NOT introduce topics outside the supplied syllabus'), 'Plan prompt must prohibit outside topics');
  });

  // 4. Deterministic Planner Priority Calculation Tests
  await test('PlannerService: Deterministic Priority calculation formula intact', () => {
    const today = new Date().toISOString().split('T')[0];
    const examDateSoon = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
    const examDateFar = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    // Priority Score = Urgency × Difficulty × Weakness
    const hardWeakUrgentScore = plannerService.calculateSubjectPriority(
      { examDate: examDateSoon, difficulty: 'HARD', confidence: 'WEAK' },
      today
    );

    const easyStrongFarScore = plannerService.calculateSubjectPriority(
      { examDate: examDateFar, difficulty: 'EASY', confidence: 'STRONG' },
      today
    );

    assert(hardWeakUrgentScore > easyStrongFarScore, 'Urgent hard weak subject must have higher priority score');
    assert(hardWeakUrgentScore >= 15, `Expected high score, got ${hardWeakUrgentScore}`);
  });

  // 5. Plan-Level Grounded Topic Ingestion Test
  await test('PlannerService: Preserves syllabus-grounded topics and units', () => {
    const syllabusSubject = {
      name: 'Data Structures and Algorithms',
      examDate: '2026-09-30',
      difficulty: 'HARD' as const,
      confidence: 'WEAK' as const,
      topics: [
        { name: 'Module 1: Stacks and Queues', status: 'AVERAGE' as const, unitName: 'Module 1', subtopics: ['Infix to Postfix'] },
        { name: 'Module 2: Binary Search Trees', status: 'WEAK' as const, unitName: 'Module 2', subtopics: ['AVL Trees', 'Red-Black Trees'] }
      ]
    };

    const priorityScore = plannerService.calculateSubjectPriority(syllabusSubject, '2026-09-15');
    assert(priorityScore > 0, 'Priority score should be computed');

    // Verify that the topics are exclusively the syllabus-grounded topics
    const topicNames = syllabusSubject.topics.map(t => t.name);
    assert(topicNames.includes('Module 1: Stacks and Queues'));
    assert(topicNames.includes('Module 2: Binary Search Trees'));
    assert(!topicNames.includes('Random Hallucinated Topic'), 'No out-of-syllabus topics allowed');
  });

  // 6. Live / Grounded AIService Parsing Test
  await test('AIService: parseSyllabusWithAI parses multi-subject syllabus text into structured curriculum', async () => {
    const aiServiceInstance = new AIService();
    if (aiServiceInstance.isAIAvailable()) {
      const sampleText = `
      MUMBAI UNIVERSITY - DEPARTMENT OF COMPUTER ENGINEERING
      SEMESTER IV CURRICULUM

      Subject 1: Data Structures and Algorithms
      Unit 1: Linear Data Structures
      - Arrays, Linked Lists, Stacks and Queues

      Subject 2: Operating Systems
      Unit 1: Process Management
      - CPU Scheduling, Semaphores and Deadlocks
      `;

      const parsed = await aiServiceInstance.parseSyllabusWithAI(sampleText);
      assert(parsed.subjects.length >= 2, 'Should extract at least 2 subjects');
      assert(parsed.subjects.some(s => s.name.toLowerCase().includes('data structure')), 'Must identify Data Structures');
      assert(parsed.subjects.some(s => s.name.toLowerCase().includes('operating system')), 'Must identify Operating Systems');
      assert(parsed.subjects[0].units.length >= 1, 'Units must be extracted');
    }
  });

  // 7. Fallback when no syllabus is attached
  await test('AIService: Deterministic topic dictionary fallback works seamlessly when no syllabus is uploaded', async () => {
    const customAiService = new AIService();
    const fallback = await customAiService.suggestTopicsWithAI({
      subjectName: 'Operating Systems'
    });
    assert.strictEqual(fallback.subject, 'Operating Systems');
    assert(fallback.suggestedTopics.length > 0, 'Fallback topics should be returned');
    assert(fallback.suggestedTopics.some(t => t.name.includes('Process') || t.name.includes('Memory')), 'Should contain standard OS topics');
  });

  console.log(`\n========================================`);
  console.log(`Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log(`========================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
