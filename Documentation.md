# EvaluRead - LMS AutoGrader

## Overview

EvaluRead is an automated answer evaluation system that leverages OCR (Optical Character Recognition) and AI to streamline the grading process for educators. The application processes scanned answer sheets or digital documents, extracts text through OCR, maps answers to questions, and utilizes Google's Gemini AI model to provide comprehensive evaluations.

## Process Workflow

### 1. Document Upload and Processing
- Users upload answer documents (PDF or images) through the web interface
- The system processes the document using OCR to extract text
- The extracted text is structured into sections (questions and answers)

### 2. Question Paper Management
- Users can create and manage question papers
- Question papers include question text and maximum marks for each question
- The system extracts questions from markdown or text formats

### 3. Answer Mapping
- The system maps extracted answers to corresponding questions
- Advanced mapping is performed using AI to understand context and structure

### 4. Evaluation
- Multi-agent evaluation system with different AI "professor" perspectives:
  - Theoretical Evaluator: Assesses theoretical knowledge
  - Practical Evaluator: Focuses on practical application
  - Holistic Evaluator: Provides comprehensive assessment
  - Consensus Evaluator: Combines perspectives for final evaluation
- Each evaluator provides feedback and proposed grades
- Final grade is determined through consensus

### 5. Results Presentation
- Results are presented in markdown format
- Evaluation includes feedback, scores, and improvement suggestions
- Results can be saved, viewed, and analyzed later

## Key Features

### OCR Capabilities
- PDF and image processing
- Multi-page document support
- Section parsing for structured content extraction

### AI-Powered Evaluation
- Google Gemini AI integration
- Multi-perspective evaluation system
- Contextual understanding of answers

### Question Paper Management
- Creation and storage of question papers
- Automatic extraction of questions and marks
- Reusable question paper templates

### Evaluation Management
- Storage of evaluation results
- Historical view of evaluations
- Deletion and management capabilities

### Analytics
- Performance tracking across evaluations
- Insights into grading patterns
- Visualization of evaluation data

### User Interface
- Modern, responsive web interface
- Dashboard for quick access to features
- Easy navigation between different sections

## Code Structure

### Backend (Flask Server)

#### Core Modules:
- **app.py**: Main Flask application with API endpoints
- **agentic.py**: AI evaluation system implementation
- **ocr.py**: OCR processing logic
- **gemini_ocr.py**: Gemini AI integration for OCR
- **mapper.py**: Question-answer mapping algorithms
- **prompts.py**: AI prompts and professor definitions
- **pdf_utils.py**: PDF handling utilities

#### Key API Endpoints:
- `/api/process-file`: OCR processing endpoint
- `/api/process-complete`: Combined OCR and evaluation
- `/api/evaluate`: Evaluation of answers
- `/api/question-papers`: Question paper management
- `/api/evaluations`: Evaluation management

### Frontend (React with TypeScript)

#### Core Structure:
- **App.tsx**: Main application component with routing
- **context/**: Application context providers
- **components/**: Reusable UI components
- **pages/**: Main application pages
- **services/**: API integration services
- **utils/**: Utility functions

#### Key Components:
- **Dashboard**: Main user interface
- **UploadEvaluateContainer**: File upload and processing
- **QuestionPapersContainer**: Question paper management
- **EvaluationHistory**: History of evaluations
- **AnalyticsContainer**: Data analytics and visualization

## Technical Implementation Details

### OCR Implementation
The OCR system uses Google's Gemini AI for text extraction from images and PDFs. The system:
1. Processes PDFs by converting them to images
2. Sends images to Gemini for text extraction
3. Parses the extracted text into structured sections
4. Identifies question and answer pairs

### AI Evaluation System
The evaluation system implements a multi-agent approach:
1. Different AI "professors" evaluate answers from different perspectives
2. Each professor identifies key points and determines if they're addressed
3. Professors propose grades based on their evaluation criteria
4. A consensus evaluator combines the perspectives for a final evaluation
5. The system generates detailed feedback and justifications for grades

### Question-Answer Mapping
The system uses sophisticated mapping techniques:
1. Pattern matching for basic question-answer identification
2. AI-based matching for complex documents
3. Contextual understanding to associate the right answers with questions

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js and npm/yarn
- Google Gemini API key

### Installation
1. Clone the repository
2. Install backend dependencies: `pip install -r server/requirements.txt`
3. Install frontend dependencies: `npm install` or `yarn install`
4. Create a `.env` file with your Gemini API key: `GEMINI_API_KEY=your-api-key`

### Running the Application
1. Start the backend server: `python server/app.py`
2. Start the frontend: `npm run dev` or `yarn dev`
3. Access the application at: `http://localhost:5173`

## Future Enhancements
- Integration with learning management systems
- Batch processing of multiple answer sheets
- Enhanced analytics for educational insights
- Support for additional languages and subjects
- Customizable evaluation criteria
