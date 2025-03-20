# EvaluRead - Answer Evaluation System

EvaluRead is a modern web application designed to automate and streamline the process of evaluating student answers. It uses advanced text processing and AI to extract text from PDFs, map answers to questions, and provide detailed evaluations.

## Features

- **PDF Processing**: Upload and extract text from PDF files
- **Question Paper Management**: Create and manage question papers with marking schemes
- **Automated Answer Mapping**: Automatically map extracted answers to questions
- **AI-Powered Evaluation**: Evaluate answers using advanced AI algorithms
- **History & Analytics**: Track evaluation history and view analytics
- **Responsive UI**: Modern, responsive interface built with React and Tailwind CSS

## Tech Stack

- **Frontend**:
  - React with TypeScript
  - Tailwind CSS for styling
  - Shadcn UI components
  - React Router for navigation
  - Context API for state management

- **Backend**:
  - Python with Flask
  - MongoDB for data storage
  - JWT for authentication
  - OCR capabilities for text extraction

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- MongoDB

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/evaluread.git
   cd evaluread
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd server
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Create a `.env` file in the server directory with:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```

5. Start the development servers:
   
   Frontend:
   ```bash
   npm run dev
   ```

   Backend:
   ```bash
   cd server
   python app.py
   ```

## Project Structure

```
evaluread/
├── src/
│   ├── components/        # React components
│   ├── context/          # Context providers
│   ├── pages/            # Page components
│   ├── services/         # API services
│   └── utils/            # Utility functions
├── server/
│   ├── app.py           # Flask application
│   └── requirements.txt # Python dependencies
└── public/              # Static assets
```

## Key Features

### 1. Document Upload & Processing
- Support for PDF files
- Text extraction using OCR
- Real-time processing status

### 2. Question Paper Management
- Create and edit question papers
- Set marks for each question
- Organize by subjects/topics

### 3. Answer Evaluation
- Automated answer mapping
- AI-powered evaluation
- Manual review capabilities

### 4. Analytics & History
- Evaluation history tracking
- Performance analytics
- Export capabilities

## Deployment

### Frontend
The frontend is deployed on Vercel at [https://ai-examiner-nu.vercel.app/](https://ai-examiner-nu.vercel.app/).

### Backend
The backend is deployed on Render at [https://ai-examiner-v3mh.onrender.com](https://ai-examiner-v3mh.onrender.com).

#### Deploying to Render
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
4. Add the following environment variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `JWT_SECRET`: Secret key for JWT token generation
   - `GOOGLE_API_KEY`: Your Google API key
   - `DB_NAME`: Database name (e.g., LMS_APP)
   - `MONGO_URI`: MongoDB connection string

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Shadcn UI](https://ui.shadcn.com/) for the beautiful UI components
- [React](https://reactjs.org/) for the frontend framework
- [Flask](https://flask.palletsprojects.com/) for the backend framework 