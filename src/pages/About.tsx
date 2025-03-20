import React from 'react';

const About: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-blue-600">About Me</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>
        <div className="space-y-4">
          <div>
            <span className="font-semibold">Name:</span>
            <span className="ml-2">Sujit Sarkar</span>
          </div>
          <div>
            <span className="font-semibold">Education:</span>
            <span className="ml-2">Master's in Data Science</span>
          </div>
          <div>
            <span className="font-semibold">Location:</span>
            <span className="ml-2">Pune, Maharashtra</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-semibold mb-4">About the Application</h2>
        <p className="text-gray-700 mb-4">
          This application is designed to streamline the process of evaluating answer sheets using advanced AI technology. 
          It combines Optical Character Recognition (OCR) with Large Language Models to provide accurate and consistent 
          evaluations of student responses.
        </p>
        
        <h3 className="text-xl font-semibold mb-3">Key Features:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Automated answer sheet processing using OCR technology</li>
          <li>AI-powered evaluation system for consistent grading</li>
          <li>Detailed feedback generation for each answer</li>
          <li>Support for multiple question formats</li>
          <li>Secure user authentication and data management</li>
          <li>Comprehensive analytics and reporting</li>
        </ul>
      </div>
    </div>
  );
};

export default About; 