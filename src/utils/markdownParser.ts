
interface Question {
  id: string;
  question: string;
  marks: number;
}

export interface ParsedQuestionPaper {
  title: string;
  totalMarks: number;
  questions: Question[];
}

export function parseMarkdown(markdown: string): ParsedQuestionPaper {
  console.log("Parsing markdown:", markdown.substring(0, 100) + "...");

  const lines = markdown.trim().split('\n');
  let title = 'Untitled Question Paper';
  const questions: Question[] = [];
  let totalMarks = 0;

  // Extract title (first h1 or first line if no h1)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('# ')) {
      title = line.substring(2).trim();
      break;
    }
  }
  
  // If no title found, use the first non-empty line as title
  if (title === 'Untitled Question Paper') {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.match(/^\*\*Q\d+\)?\*\*/)) {
        title = line;
        break;
      }
    }
  }

  // Regular expressions for different question formats
  // Standard format: 1. Question [5]
  const standardQuestionRegex = /^\s*(\d+)[\.\)]\s+(.+)/i;
  
  // Q format: Q1), Q2), etc.
  const qFormatRegex = /^\s*\*\*Q(\d+)\)?\*\*\s*$/i;
  
  // Subquestion format: a), b), c)
  const subQuestionRegex = /^\s*([a-z])\)\s+(.+)/i;
  
  // Marks regex: [5], [10 marks], etc.
  const marksRegex = /\[(\d+)(?:\s*(?:marks|mark|m)?)?\]\s*$/i;

  // OR separator
  const orSeparatorRegex = /^\s*\*\*OR\*\*\s*$/i;

  let currentMainQuestion = '';
  let currentMainQuestionNumber = 0;
  let inQuestion = false;
  let isSubQuestion = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue; // Skip empty lines
    
    // Check if this is a main question (Q1, Q2, etc.)
    const qMatch = qFormatRegex.exec(line);
    if (qMatch) {
      currentMainQuestion = `Q${qMatch[1]}`;
      currentMainQuestionNumber = parseInt(qMatch[1], 10);
      inQuestion = true;
      isSubQuestion = false;
      continue;
    }
    
    // Check if this is an OR separator
    if (orSeparatorRegex.test(line)) {
      continue; // Skip OR separators
    }
    
    // Check if this is a subquestion (a, b, c, etc.)
    const subMatch = subQuestionRegex.exec(line);
    if (subMatch && inQuestion) {
      const subQuestionLetter = subMatch[1];
      let subQuestionText = subMatch[2].trim();
      let marks = 0;
      
      // Extract marks if present
      const marksMatch = marksRegex.exec(subQuestionText);
      if (marksMatch) {
        marks = parseInt(marksMatch[1], 10);
        subQuestionText = subQuestionText.replace(marksRegex, '').trim();
      }
      
      // Create a question ID that combines main question and subquestion
      const questionId = `q-${currentMainQuestionNumber}-${subQuestionLetter}`;
      
      // Add the question
      const fullQuestionText = `${currentMainQuestion} ${subQuestionLetter}) ${subQuestionText}`;
      questions.push({
        id: questionId,
        question: fullQuestionText,
        marks: marks
      });
      
      totalMarks += marks;
      isSubQuestion = true;
      
      // Look ahead to collect multi-line content for this subquestion
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        
        // Stop if we hit a new subquestion, main question, or OR separator
        if (subQuestionRegex.test(nextLine) || qFormatRegex.test(nextLine) || orSeparatorRegex.test(nextLine) || !nextLine) {
          break;
        }
        
        // Check if this line contains marks (if marks weren't found earlier)
        if (marks === 0) {
          const nextLineMarksMatch = marksRegex.exec(nextLine);
          if (nextLineMarksMatch) {
            marks = parseInt(nextLineMarksMatch[1], 10);
            // Update the question with the marks
            const updatedQuestion = questions[questions.length - 1];
            updatedQuestion.marks = marks;
            totalMarks += marks;
            j++;
            continue;
          }
        }
        
        // Add this line to the current subquestion
        const updatedQuestion = questions[questions.length - 1];
        updatedQuestion.question += '\n' + nextLine;
        j++;
      }
      
      // Skip the lines we've processed
      i = j - 1;
      continue;
    }
    
    // Handle standard numbered questions if not in Q-format
    const standardMatch = standardQuestionRegex.exec(line);
    if (standardMatch && !inQuestion) {
      let questionText = standardMatch[2].trim();
      let questionNumber = parseInt(standardMatch[1], 10);
      let marks = 0;
      
      // Extract marks if present
      const marksMatch = marksRegex.exec(questionText);
      if (marksMatch) {
        marks = parseInt(marksMatch[1], 10);
        questionText = questionText.replace(marksRegex, '').trim();
      }
      
      // Add the question
      questions.push({
        id: `q-${questionNumber}`,
        question: `${questionNumber}. ${questionText}`,
        marks: marks
      });
      
      totalMarks += marks;
      
      // Process multi-line questions
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        
        // Stop if we hit a new question
        if (standardQuestionRegex.test(nextLine) || qFormatRegex.test(nextLine) || !nextLine) {
          break;
        }
        
        // Check if this line contains marks (if marks weren't found earlier)
        if (marks === 0) {
          const nextLineMarksMatch = marksRegex.exec(nextLine);
          if (nextLineMarksMatch) {
            marks = parseInt(nextLineMarksMatch[1], 10);
            // Update the question with the marks
            const updatedQuestion = questions[questions.length - 1];
            updatedQuestion.marks = marks;
            totalMarks += marks;
            j++;
            continue;
          }
        }
        
        // Add this line to the current question
        const updatedQuestion = questions[questions.length - 1];
        updatedQuestion.question += '\n' + nextLine;
        j++;
      }
      
      // Skip the lines we've processed
      i = j - 1;
    }
    
    // If the line doesn't match any format but contains marks, try to extract it as a standalone question
    if (!isSubQuestion && !standardQuestionRegex.test(line) && !qFormatRegex.test(line) && !subQuestionRegex.test(line)) {
      const marksMatch = marksRegex.exec(line);
      if (marksMatch) {
        const marks = parseInt(marksMatch[1], 10);
        const questionText = line.replace(marksRegex, '').trim();
        
        if (questionText) {
          questions.push({
            id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            question: questionText,
            marks: marks
          });
          
          totalMarks += marks;
        }
      }
    }
  }

  // If no questions were found but there are lines with marks, try to extract them
  if (questions.length === 0) {
    console.log("No questions found with primary approach, trying fallback...");
    // Fallback: Look for any line with marks
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const marksMatch = marksRegex.exec(line);
      if (marksMatch) {
        const marks = parseInt(marksMatch[1], 10);
        const questionText = line.replace(marksRegex, '').trim();
        
        if (questionText) {
          questions.push({
            id: `q-${i}`,
            question: questionText,
            marks: marks
          });
          
          totalMarks += marks;
        }
      }
    }
  }

  console.log("Parsed questions:", questions.length);
  console.log("Total marks:", totalMarks);
  
  return {
    title,
    totalMarks,
    questions,
  };
}

/**
 * Parses a manual question paper input where each line is a question with marks
 * Format: "Question text [marks]"
 */
export function parseManualInput(input: string): ParsedQuestionPaper {
  const lines = input.trim().split('\n');
  let title = 'Manual Question Paper';
  const questions: Question[] = [];
  let totalMarks = 0;
  
  // Find title if it exists (first line starting with # or first line)
  if (lines.length > 0) {
    if (lines[0].startsWith('# ')) {
      title = lines[0].substring(2).trim();
      lines.shift(); // Remove the title line
    } else {
      // Use first line as title if it doesn't look like a question
      const firstLine = lines[0].trim();
      const marksRegex = /\[(\d+)\s*(?:marks|mark|m)?\]\s*$/i;
      if (!firstLine.match(marksRegex) && !firstLine.match(/^\d+[\.\)]/)) {
        title = firstLine;
        lines.shift();
      }
    }
  }
  
  // Parse each line as a question
  const marksRegex = /\[(\d+)\s*(?:marks|mark|m)?\]\s*$/i;
  
  lines.forEach((line, index) => {
    line = line.trim();
    if (!line) return; // Skip empty lines
    
    let questionText = line;
    let marks = 0;
    
    // Look for marks at the end of the line
    const marksMatch = marksRegex.exec(line);
    if (marksMatch) {
      marks = parseInt(marksMatch[1], 10);
      questionText = line.replace(marksRegex, '').trim();
    }
    
    // If the line starts with a number and period/parenthesis, format it properly
    const questionNumberMatch = /^(\d+)[\.\)]/.exec(questionText);
    if (!questionNumberMatch) {
      // If no question number, add one
      questionText = `${index + 1}. ${questionText}`;
    }
    
    questions.push({
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      question: questionText,
      marks
    });
    
    totalMarks += marks;
  });
  
  return {
    title,
    totalMarks,
    questions
  };
}

/**
 * Converts a parsed question paper back to markdown format
 */
export function questionPaperToMarkdown(paper: ParsedQuestionPaper): string {
  let markdown = `# ${paper.title}\n\n`;
  
  paper.questions.forEach((question, index) => {
    markdown += `${index + 1}. ${question.question} [${question.marks}]\n\n`;
  });
  
  return markdown;
}
