from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
import os
import ocr
import agentic
import mapper
from dotenv import load_dotenv
import json
import uuid
from datetime import datetime
import re
import time
import logging
import threading
import queue
import concurrent.futures
try:
    import jwt
except ImportError:
    import PyJWT as jwt
from functools import wraps
from flask_bcrypt import Bcrypt
from datetime import timedelta

# Import database and authentication modules
import database
# Initialize database first - this needs to happen before importing the collections
database.init_db()
from database import (
    extracted_texts_collection,
    evaluations_collection,
    question_papers_collection,
    users_collection
)
from auth import create_user, authenticate_user, token_required, admin_required, JWT_SECRET

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Use the same JWT_SECRET from auth.py to ensure consistent token handling
app.config['JWT_SECRET'] = JWT_SECRET
bcrypt = Bcrypt(app)

# Configure CORS for deployment - allow requests from any origin
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3002", "http://127.0.0.1:3002", "https://ai-examiner-nu.vercel.app/", "https://ai-examiner-v3mh.onrender.com", "*"],
        "allow_headers": [
            "Content-Type", 
            "Authorization", 
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Headers",
            "Access-Control-Allow-Methods",
            "Cache-Control",
            "Pragma"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "supports_credentials": True,
        "expose_headers": ["Content-Type", "Authorization"],
        "max_age": 86400
    }
})

# Register endpoint
@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        
        # Validate input
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400
            
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400
        
        username = data['username']
        email = data['email']
        password = data['password']
        
        # Check if username or email already exists
        if users_collection.find_one({"username": username}):
            return jsonify({"success": False, "message": "Username already exists"}), 409
            
        if users_collection.find_one({"email": email}):
            return jsonify({"success": False, "message": "Email already exists"}), 409
        
        # Create user
        user_id = str(uuid.uuid4())
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        user_data = {
            "id": user_id,
            "username": username,
            "email": email,
            "password": hashed_password,
            "role": "user",
            "created_at": datetime.now().isoformat()
        }
        
        users_collection.insert_one(user_data)
        
        # Generate JWT token using the same secret and format as in auth.py
        payload = {
            'id': user_id,
            'username': username,
            'email': email,
            'role': "user",
            'exp': (datetime.now() + timedelta(days=1)).timestamp()
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        
        # Handle string vs bytes output for different PyJWT versions
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        
        logger.info(f"User registered successfully: {username}")
        logger.info(f"Generated token (first 10 chars): {token[:10]}...")
        
        return jsonify({
            "success": True,
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "role": "user"
            }
        })
    except Exception as e:
        logger.error(f"Error in register: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Registration failed: {str(e)}"
        }), 500

# Login endpoint
@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate a user."""
    try:
        data = request.get_json()
        
        # Validate input
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400
            
        # Check if we have email and password
        if 'email' not in data or not data['email']:
            return jsonify({"success": False, "message": "Email is required"}), 400
            
        if 'password' not in data or not data['password']:
            return jsonify({"success": False, "message": "Password is required"}), 400
        
        email = data['email']
        password = data['password']
        
        # Find user by email
        user = users_collection.find_one({"email": email})
        
        if not user:
            return jsonify({"success": False, "message": "Invalid email or password"}), 401
        
        # Check password
        if not bcrypt.check_password_hash(user['password'], password):
            return jsonify({"success": False, "message": "Invalid email or password"}), 401
        
        # Generate JWT token using the same secret and format as in auth.py
        payload = {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role'],
            'exp': (datetime.now() + timedelta(days=1)).timestamp()
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        
        # Handle string vs bytes output for different PyJWT versions
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        
        logger.info(f"User logged in successfully: {user['username']}")
        logger.info(f"Generated token (first 10 chars): {token[:10]}...")
        
        return jsonify({
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user['id'],
                "username": user['username'],
                "email": user['email'],
                "role": user['role']
            }
        })
    except Exception as e:
        logger.error(f"Error in login: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Login failed: {str(e)}"
        }), 500

@app.route('/api/auth/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get the current user's profile"""
    try:
        user = {
            "id": current_user["id"],
            "username": current_user["username"],
            "email": current_user["email"],
            "role": current_user["role"]
        }
        return jsonify({"success": True, "user": user}), 200
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        return jsonify({"error": f"Error getting user profile: {str(e)}"}), 500

@app.route('/api/process-file', methods=['POST', 'OPTIONS'])
def process_file():
    """Process a file using OCR and return the extracted text."""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cache-Control,Pragma')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response
    
    # Token validation for POST requests
    token = None
    auth_header = request.headers.get('Authorization')
    
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(" ")[1]
    
    if not token:
        logger.warning("No token provided for process-file")
        return jsonify({"error": "Authentication token is missing"}), 401
    
    try:
        # Decode and validate token
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        current_user = users_collection.find_one({"id": data["id"]})
        
        if not current_user:
            logger.warning(f"User ID from token not found: {data.get('id')}")
            return jsonify({"error": "Invalid user"}), 401
        
        # Original function logic
        try:
            if 'file' not in request.files:
                return jsonify({"error": "No file part"}), 400
                
            file = request.files['file']
            
            if file.filename == '':
                return jsonify({"error": "No selected file"}), 400
                
            # Debug: log the file details
            logger.info(f"Processing file: {file.filename}, size: {file.content_length} bytes")
            
            # Save the file temporarily
            temp_path = f"temp_{file.filename}"
            file.save(temp_path)
            
            # Process the file with OCR
            result = ocr.process_file(temp_path)
            
            # Clean up the temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            # Create a text ID for this extraction
            text_id = str(uuid.uuid4())
            
            # Create document for MongoDB
            extracted_text_doc = {
                "id": text_id,
                "extractedText": result.get("text", ""),
                "timestamp": datetime.now().isoformat(),
                "fileName": file.filename,
                "confidence": result.get("confidence", 0),
                "sections": result.get("sections", []),
                "userId": current_user["id"]
            }
            
            # Store in MongoDB
            extracted_texts_collection.insert_one(extracted_text_doc)
            
            logger.info(f"Successfully extracted text with ID {text_id}, sections: {len(result.get('sections', []))}")
            
            # Return the text ID and extraction result
            return jsonify({
                "success": True,
                "text_id": text_id,
                "extractedText": result.get("text", ""),
                "confidence": result.get("confidence", 0),
                "sections": result.get("sections", []),
                "message": "File processed successfully"
            })
            
        except Exception as e:
            # Log the error
            logger.error(f"Error processing file: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            
            # Clean up any temporary files
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.remove(temp_path)
                
            return jsonify({
                "error": f"Error processing file: {str(e)}"
            }), 500
    
    except Exception as jwt_error:
        logger.error(f"JWT validation error in process-file: {str(jwt_error)}")
        return jsonify({"error": "Invalid token"}), 401

@app.route('/api/process-complete', methods=['POST'])
def process_complete():
    """Process a file with OCR and evaluation in one step."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    try:
        # Save the file temporarily
        temp_path = f"temp_{file.filename}"
        file.save(temp_path)
        
        # 1. Process the file with OCR
        ocr_result = ocr.process_file(temp_path)
        
        # 2. Process the OCR result with evaluation
        question_paper_id = request.form.get('questionPaperId', None)
        question_paper_text = None
        if question_paper_id:
            question_paper = question_papers_collection.find_one({"id": question_paper_id})
            if question_paper:
                question_paper_text = json.dumps(question_paper)
            
        # Get the evaluation file path
        evaluation_file_path = agentic.evaluate_answers(ocr_result["text"], file.filename, question_paper_text)
        
        # Read the evaluation file content
        with open(evaluation_file_path, 'r', encoding='utf-8') as file:
            markdown_content = file.read()
        
        # Generate filename for ID
        evaluation_filename = os.path.basename(evaluation_file_path)
        
        # Create result object in the format expected by the frontend
        evaluation_result = {
            "id": f"file_{evaluation_filename}",
            "fileName": file.filename,
            "timestamp": datetime.now().isoformat(),
            "markdownContent": markdown_content
        }
        
        # 3. Add evaluation to the OCR result
        ocr_result["evaluation"] = evaluation_result
        
        # Clean up the temporary file
        os.remove(temp_path)
        
        return jsonify(ocr_result)
    except Exception as e:
        logger.error(f"Error in complete processing: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/evaluate', methods=['POST', 'OPTIONS'])
def evaluate_answers():
    """Evaluate answers from OCR text."""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cache-Control,Pragma')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response
    
    # Token validation for POST requests
    token = None
    auth_header = request.headers.get('Authorization')
    
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(" ")[1]
    
    if not token:
        logger.warning("No token provided for evaluate")
        return jsonify({"error": "Authentication token is missing"}), 401
    
    try:
        # Decode and validate token
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        current_user = users_collection.find_one({"id": data["id"]})
        
        if not current_user:
            logger.warning(f"User ID from token not found: {data.get('id')}")
            return jsonify({"error": "Invalid user"}), 401
        
        # Original function logic
        try:
            data = request.get_json()
            
            # Log the received payload for debugging
            logger.info(f"Received evaluation request")
            
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            # Get text either directly or from text_id
            answer_text = None
            file_name = data.get("fileName", "Unknown")
            
            # Check if we have direct text
            if "text" in data:
                answer_text = data["text"]
            # Or if we have a text_id to lookup
            elif "text_id" in data:
                text_id = data["text_id"]
                
                # Look up in MongoDB
                extracted_text_doc = extracted_texts_collection.find_one(
                    {"id": text_id, "userId": current_user["id"]}
                )
                
                if extracted_text_doc:
                    answer_text = extracted_text_doc.get("extractedText", "")
                    file_name = extracted_text_doc.get("fileName", file_name)
                else:
                    return jsonify({"error": f"Text ID not found: {text_id}"}), 404
            else:
                return jsonify({"error": "Missing required field: either text or text_id"}), 400
            
            # Check if we have mapped question-answers or need to process through a question paper
            question_paper_text = None
            question_answers = None
            
            # If we have mapped question_answers, use those
            if "question_answers" in data:
                question_answers = data["question_answers"]
                
                # Filter out answers that are empty or not found
                filtered_qa = []
                for qa in question_answers:
                    if qa.get('answer') and qa['answer'].strip() and qa['answer'] != "No answer found":
                        filtered_qa.append(qa)
                
                question_answers = filtered_qa
                logger.info(f"Using {len(question_answers)} valid question-answer pairs")
                
                if len(question_answers) == 0:
                    return jsonify({
                        "success": True,
                        "evaluation": "# No Valid Answers to Evaluate\n\nThe system could not find valid answers to any of the questions in the paper. Please check if the uploaded document contains the answers or try a different document.",
                        "score": "0",
                        "id": str(uuid.uuid4())
                    })
            
            # If we have a question paper object in the request
            if "question_paper" in data:
                question_paper_data = data["question_paper"]
                logger.info(f"Using provided question paper: {question_paper_data.get('title', 'Untitled')}")
                question_paper_text = json.dumps(question_paper_data)
            
            # If we have a question paper ID, try to fetch it
            elif "question_paper_id" in data:
                question_paper_id = data["question_paper_id"]
                if question_paper_id and question_paper_id != 'default':
                    # Look up in MongoDB
                    question_paper_doc = question_papers_collection.find_one(
                        {"id": question_paper_id, "userId": current_user["id"]}
                    )
                    
                    if question_paper_doc:
                        question_paper_text = json.dumps(question_paper_doc)
            
            try:
                # Direct evaluation without timeouts
                if question_answers and len(question_answers) > 0:
                    # Use question_answers for structured evaluation
                    evaluation_result = agentic.evaluate_structured_answers(question_answers, file_name)
                else:
                    # Use traditional evaluation method
                    evaluation_result = agentic.evaluate_answers(answer_text, file_name, question_paper_text)
                
            except Exception as eval_error:
                logger.error(f"Error during evaluation: {str(eval_error)}")
                # Provide a graceful response
                return jsonify({
                    "success": True,
                    "evaluation": f"# Evaluation Error\n\nThere was an error during the evaluation process: {str(eval_error)}.\n\nPlease try again or contact support if the issue persists.",
                    "score": "N/A",
                    "id": str(uuid.uuid4())
                })
            
            # Handle the evaluation result
            if isinstance(evaluation_result, dict):
                if evaluation_result.get("success", False):
                    evaluation_file_path = evaluation_result.get("evaluation_path")
                else:
                    error_message = evaluation_result.get("message", "Unknown error in evaluation")
                    logger.error(f"Evaluation error: {error_message}")
                    return jsonify({
                        "success": True,
                        "evaluation": f"# Evaluation Failed\n\n{error_message}\n\nPlease try again or contact support.",
                        "score": "N/A",
                        "id": str(uuid.uuid4())
                    })
            
            # Extract the evaluation content and score
            evaluation_content = None
            if isinstance(evaluation_result, str):
                evaluation_content = evaluation_result
            elif isinstance(evaluation_result, dict) and "evaluation_content" in evaluation_result:
                evaluation_content = evaluation_result["evaluation_content"]
            elif evaluation_file_path and os.path.exists(evaluation_file_path):
                with open(evaluation_file_path, 'r', encoding='utf-8') as eval_file:
                    evaluation_content = eval_file.read()
            
            if not evaluation_content:
                evaluation_content = "# Evaluation Failed\n\nNo evaluation content was generated."
            
            # Parse the score from the evaluation content
            score = "N/A"
            score_match = re.search(r'Score: (\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)', evaluation_content)
            if score_match:
                score = f"{score_match.group(1)}/{score_match.group(2)}"
            
            # Generate a unique ID for the evaluation
            evaluation_id = str(uuid.uuid4())
            
            # Create evaluation document for MongoDB
            evaluation_doc = {
                "id": evaluation_id,
                "markdownContent": evaluation_content,
                "score": score,
                "fileName": file_name,
                "timestamp": datetime.now().isoformat(),
                "userId": current_user["id"]
            }
            
            # Store in MongoDB
            evaluations_collection.insert_one(evaluation_doc)
            
            # Return the evaluation response
            return jsonify({
                "success": True,
                "evaluation": evaluation_content,
                "score": score,
                "id": evaluation_id
            })
            
        except Exception as e:
            logger.error(f"Error in evaluate_answers: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return jsonify({
                "success": False,
                "error": f"Error processing evaluation: {str(e)}"
            }), 500
    
    except Exception as jwt_error:
        logger.error(f"JWT validation error in evaluate: {str(jwt_error)}")
        return jsonify({"error": "Invalid token"}), 401

@app.route('/api/evaluations', methods=['GET', 'POST', 'OPTIONS'])
def evaluations_handler():
    """Handle evaluations requests - GET to retrieve all, POST to save a new one."""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cache-Control,Pragma')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        return response
    
    # Token validation for GET and POST requests
    token = None
    auth_header = request.headers.get('Authorization')
    
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(" ")[1]
    
    if not token:
        logger.warning("No token provided for evaluations endpoint")
        return jsonify({"error": "Authentication token is missing"}), 401
    
    try:
        # Decode and validate token
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        current_user = users_collection.find_one({"id": data["id"]})
        
        if not current_user:
            logger.warning(f"User ID from token not found: {data.get('id')}")
            return jsonify({"error": "Invalid user"}), 401
        
        # Handle GET request - get all evaluations
        if request.method == 'GET':
            try:
                evaluation_list = []
                
                # Query MongoDB for the user's evaluations
                cursor = evaluations_collection.find({"userId": current_user["id"]})
                
                # Convert MongoDB documents to list
                for doc in cursor:
                    evaluation_list.append({
                        "id": doc["id"],
                        "fileName": doc.get("fileName", "Unknown"),
                        "timestamp": doc.get("timestamp", ""),
                        "markdownContent": doc.get("markdownContent", ""),
                        "score": doc.get("score", "N/A")
                    })
                    
                return jsonify(evaluation_list)
            except Exception as e:
                logger.error(f"Error getting evaluations: {str(e)}")
                return jsonify({"error": f"Error getting evaluations: {str(e)}"}), 500
        
        # Handle POST request - save a new evaluation
        elif request.method == 'POST':
            try:
                data = request.get_json()
                
                if not data:
                    return jsonify({"error": "No data provided"}), 400
                
                # Generate a unique ID for the evaluation if not provided
                evaluation_id = data.get("id", str(uuid.uuid4()))
                
                # Create evaluation document for MongoDB
                evaluation_doc = {
                    "id": evaluation_id,
                    "markdownContent": data.get("markdownContent", data.get("evaluation", "")),
                    "score": data.get("score", "N/A"),
                    "fileName": data.get("fileName", "Unknown"),
                    "timestamp": data.get("timestamp", datetime.now().isoformat()),
                    "userId": current_user["id"]
                }
                
                # Store in MongoDB - use upsert to update if exists or insert if new
                evaluations_collection.update_one(
                    {"id": evaluation_id, "userId": current_user["id"]},
                    {"$set": evaluation_doc},
                    upsert=True
                )
                
                logger.info(f"Saved evaluation with ID: {evaluation_id}")
                
                # Return success response
                return jsonify({
                    "success": True,
                    "message": "Evaluation saved successfully",
                    "id": evaluation_id
                })
                
            except Exception as e:
                logger.error(f"Error saving evaluation: {str(e)}")
                return jsonify({
                    "success": False,
                    "error": f"Error saving evaluation: {str(e)}"
                }), 500
    
    except Exception as jwt_error:
        logger.error(f"JWT validation error: {str(jwt_error)}")
        return jsonify({"error": "Invalid token"}), 401

@app.route('/api/evaluation/<evaluation_id>', methods=['GET'])
@token_required
def get_evaluation(current_user, evaluation_id):
    """Get a specific evaluation by ID."""
    try:
        # Query MongoDB for the evaluation
        doc = evaluations_collection.find_one({"id": evaluation_id, "userId": current_user["id"]})
        
        if doc:
            return jsonify({
                "id": doc["id"],
                "fileName": doc.get("fileName", "Unknown"),
                "timestamp": doc.get("timestamp", ""),
                "markdownContent": doc.get("markdownContent", ""),
                "score": doc.get("score", "N/A")
            })
            
        return jsonify({"error": "Evaluation not found"}), 404
    except Exception as e:
        logger.error(f"Error getting evaluation: {str(e)}")
        return jsonify({"error": f"Error getting evaluation: {str(e)}"}), 500

@app.route('/api/evaluation/<evaluation_id>', methods=['DELETE'])
@token_required
def delete_evaluation(current_user, evaluation_id):
    """Delete an evaluation by ID."""
    try:
        # Delete from MongoDB
        result = evaluations_collection.delete_one({"id": evaluation_id, "userId": current_user["id"]})
        
        # Check if we found and deleted the document
        if result.deleted_count > 0:
            return jsonify({"success": True})
            
        return jsonify({"error": "Evaluation not found"}), 404
    except Exception as e:
        logger.error(f"Error deleting evaluation: {str(e)}")
        return jsonify({"error": f"Error deleting evaluation: {str(e)}"}), 500

@app.route('/api/clear-evaluations', methods=['DELETE'])
@token_required
def clear_evaluations(current_user):
    """Clear all evaluations for the current user."""
    try:
        # Delete all evaluations for this user from MongoDB
        result = evaluations_collection.delete_many({"userId": current_user["id"]})
        
        return jsonify({
            "success": True,
            "message": f"Deleted {result.deleted_count} evaluations",
        })
    except Exception as e:
        logger.error(f"Error clearing evaluations: {str(e)}")
        return jsonify({"error": f"Error clearing evaluations: {str(e)}"}), 500

@app.route('/api/extracted-texts', methods=['GET'])
@token_required
def get_extracted_texts(current_user):
    """Get all extracted texts for the current user."""
    try:
        # Query MongoDB for the user's extracted texts
        cursor = extracted_texts_collection.find({"userId": current_user["id"]})
        texts_list = []
        
        # Convert MongoDB documents to list
        for doc in cursor:
            texts_list.append({
                "id": doc["id"],
                "fileName": doc.get("fileName", "Unknown"),
                "timestamp": doc.get("timestamp", ""),
                "extractedText": doc.get("extractedText", "")
            })
            
        return jsonify(texts_list)
    except Exception as e:
        logger.error(f"Error getting extracted texts: {str(e)}")
        return jsonify({"error": f"Error getting extracted texts: {str(e)}"}), 500

@app.route('/api/extracted-text/<text_id>', methods=['GET'])
@token_required
def get_extracted_text(current_user, text_id):
    """Get a specific extracted text by ID."""
    try:
        # Query MongoDB for the specific text
        doc = extracted_texts_collection.find_one({"id": text_id, "userId": current_user["id"]})
        
        if doc:
            return jsonify({
                "id": doc["id"],
                "fileName": doc.get("fileName", "Unknown"),
                "timestamp": doc.get("timestamp", ""),
                "extractedText": doc.get("extractedText", ""),
                "confidence": doc.get("confidence", 0),
                "sections": doc.get("sections", [])
            })
            
        return jsonify({"error": "Extracted text not found"}), 404
    except Exception as e:
        logger.error(f"Error getting extracted text: {str(e)}")
        return jsonify({"error": f"Error getting extracted text: {str(e)}"}), 500

@app.route('/api/extracted-text/<id>', methods=['DELETE'])
@token_required
def delete_extracted_text(current_user, id):
    """Delete an extracted text."""
    try:
        # Delete from MongoDB
        result = extracted_texts_collection.delete_one({"id": id, "userId": current_user["id"]})
        
        # Check if document was found and deleted
        if result.deleted_count > 0:
            return jsonify({"success": True})
            
        return jsonify({"error": "Text not found"}), 404
    except Exception as e:
        logger.error(f"Error deleting extracted text: {str(e)}")
        return jsonify({"error": f"Error deleting extracted text: {str(e)}"}), 500

@app.route('/api/clear-extracted-texts', methods=['DELETE'])
@token_required
def clear_extracted_texts(current_user):
    """Clear all extracted texts for the current user."""
    try:
        # Delete all extracted texts for this user from MongoDB
        result = extracted_texts_collection.delete_many({"userId": current_user["id"]})
        
        return jsonify({
            "success": True,
            "message": f"Deleted {result.deleted_count} extracted texts",
        })
    except Exception as e:
        logger.error(f"Error clearing extracted texts: {str(e)}")
        return jsonify({"error": f"Error clearing extracted texts: {str(e)}"}), 500

@app.route('/api/process-question-paper', methods=['POST'])
@token_required
def process_question_paper(current_user):
    """Process an uploaded question paper file (markdown or text) and extract questions with marks."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    try:
        # Save the file temporarily
        temp_path = f"temp_{file.filename}"
        file.save(temp_path)
        
        try:
            # Read the file content
            with open(temp_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Parse the content to extract questions and marks
            questions = extract_questions_from_markdown(content)
            
            # If no questions were found, create a basic template
            if not questions:
                logger.info("No questions found in the file, creating template")
                template_content = """# Question Paper

1. Sample question [10]
2. Another sample question [20]

Total Marks: 30
"""
                questions = extract_questions_from_markdown(template_content)
            
            # Calculate total marks
            total_marks = sum(q.get("marks", 0) for q in questions)
            
            # Create a question paper ID
            paper_id = str(uuid.uuid4())
            
            # Create MongoDB document
            question_paper_doc = {
                "id": paper_id,
                "fileName": file.filename,
                "timestamp": datetime.now().isoformat(),
                "questions": questions,
                "totalMarks": total_marks,
                "userId": current_user["id"]
            }
            
            # Store in MongoDB
            question_papers_collection.insert_one(question_paper_doc)
            
            return jsonify(question_paper_doc)
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    except Exception as e:
        # Get detailed error information
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Error processing question paper: {str(e)}\n{error_details}")
        
        return jsonify({
            "error": f"Error processing question paper: {str(e)}",
            "details": error_details
        }), 500

@app.route('/api/question-papers', methods=['GET'])
@token_required
def get_question_papers(current_user):
    """Get all available question papers for the current user."""
    try:
        paper_list = []
        
        # Query MongoDB for the user's question papers
        cursor = question_papers_collection.find({"userId": current_user["id"]})
        
        # Convert MongoDB documents to list
        for doc in cursor:
            paper_list.append({
                "id": doc["id"],
                "fileName": doc.get("fileName", "Untitled"),
                "timestamp": doc.get("timestamp", ""),
                "questions": doc.get("questions", []),
                "totalMarks": doc.get("totalMarks", 0)
            })
        
        return jsonify(paper_list)
    except Exception as e:
        logger.error(f"Error getting question papers: {str(e)}")
        return jsonify({"error": f"Error getting question papers: {str(e)}"}), 500

@app.route('/api/question-paper/<paper_id>', methods=['GET'])
@token_required
def get_question_paper(current_user, paper_id):
    """Get a specific question paper by ID."""
    try:
        # Query MongoDB for the paper
        doc = question_papers_collection.find_one({"id": paper_id, "userId": current_user["id"]})
        
        if doc:
            return jsonify({
                "id": doc["id"],
                "fileName": doc.get("fileName", "Untitled"),
                "timestamp": doc.get("timestamp", ""),
                "questions": doc.get("questions", []),
                "totalMarks": doc.get("totalMarks", 0)
            })
            
        return jsonify({"error": "Question paper not found"}), 404
    except Exception as e:
        logger.error(f"Error getting question paper: {str(e)}")
        return jsonify({"error": f"Error getting question paper: {str(e)}"}), 500

@app.route('/api/question-paper/<paper_id>', methods=['DELETE'])
@token_required
def delete_question_paper(current_user, paper_id):
    """Delete a question paper by ID."""
    try:
        # Delete from MongoDB
        result = question_papers_collection.delete_one({"id": paper_id, "userId": current_user["id"]})
        
        # Check if we found and deleted the document
        if result.deleted_count > 0:
            return jsonify({"success": True})
            
        return jsonify({"error": "Question paper not found"}), 404
    except Exception as e:
        logger.error(f"Error deleting question paper: {str(e)}")
        return jsonify({"error": f"Error deleting question paper: {str(e)}"}), 500

@app.route('/api/question-paper', methods=['POST'])
@token_required
def save_question_paper(current_user):
    """Save a question paper (create or update)."""
    try:
        # Get the question paper data from the request
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # Check required fields
        if 'questions' not in data:
            return jsonify({"error": "Questions are required"}), 400
            
        # Generate an ID if it's a new paper
        if 'id' not in data or not data['id']:
            data['id'] = str(uuid.uuid4())
            
        # Add user ID and timestamp
        data['userId'] = current_user["id"]
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now().isoformat()
            
        # Calculate total marks if not provided
        if 'totalMarks' not in data:
            data['totalMarks'] = sum(q.get("marks", 0) for q in data['questions'])
            
        # Set a filename if not provided
        if 'fileName' not in data or not data['fileName']:
            data['fileName'] = f"QuestionPaper_{data['id'][:8]}.md"
            
        # If updating, use upsert to create if it doesn't exist
        question_papers_collection.update_one(
            {"id": data['id'], "userId": current_user["id"]},
            {"$set": data},
            upsert=True
        )
        
        return jsonify({
            "success": True,
            "message": "Question paper saved successfully",
            "id": data['id']
        })
        
    except Exception as e:
        logger.error(f"Error saving question paper: {str(e)}")
        return jsonify({"error": f"Error saving question paper: {str(e)}"}), 500

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Simple health check endpoint to verify server is running."""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cache-Control,Pragma')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response
        
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/process-markdown', methods=['POST'])
def process_markdown():
    """Process markdown content and extract questions with marks."""
    data = request.get_json()
    
    if not data or 'markdown' not in data:
        return jsonify({"error": "Missing required field: markdown"}), 400
    
    try:
        # Extract questions from the markdown
        questions = extract_questions_from_markdown(data['markdown'])
        
        # Return structured questions
        return jsonify({"questions": questions})
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Error processing markdown: {str(e)}\n{error_details}")
        
        return jsonify({
            "error": f"Error processing markdown: {str(e)}",
            "details": error_details
        }), 500

@app.route('/api/map-questions-answers-advanced', methods=['POST'])
def map_questions_answers_advanced():
    """Map questions to answers using Gemini's advanced understanding capabilities."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Get the question paper text or ID
        question_paper_text = data.get("question_paper_text")
        question_paper_id = data.get("question_paper_id")
        
        # Get the answer text or extracted text ID
        answer_text = data.get("answer_text")
        text_id = data.get("text_id")
        
        # Get optional parameters
        handle_noise = data.get("handle_noise", True)  # Default to true
        is_md_format = data.get("is_md_format", True)  # Default to true for compatibility
        
        # Validate input combinations
        if not (question_paper_text or question_paper_id):
            return jsonify({"error": "Either question_paper_text or question_paper_id must be provided"}), 400
            
        if not (answer_text or text_id):
            return jsonify({"error": "Either answer_text or text_id must be provided"}), 400
        
        # Get question paper text if ID was provided
        if question_paper_id and not question_paper_text:
            question_paper = question_papers_collection.find_one({"id": question_paper_id})
            if not question_paper:
                return jsonify({"error": f"Question paper ID not found: {question_paper_id}"}), 404
            question_paper_text = question_paper.get("content", "")
        
        # Get answer text if ID was provided
        if text_id and not answer_text:
            extracted_text = extracted_texts_collection.find_one({"id": text_id})
            if not extracted_text:
                return jsonify({"error": f"Text ID not found: {text_id}"}), 404
            answer_text = extracted_text["extractedText"]
        
        # Process the mapping using our unified mapper
        start_time = time.time()
        qa_mapping = run_with_timeout(mapper.map_answers,
            args=(question_paper_text, answer_text, is_md_format, handle_noise),
            timeout=300  # 5 minutes
        )
        processing_time = time.time() - start_time
        
        # Validate we have some mapped QA pairs
        if len(qa_mapping) == 0:
            return jsonify({
                "success": False,
                "message": "Could not map any questions to answers.",
                "mappings": [],
                "processing_time_seconds": processing_time
            }), 200
        
        # Log the success for debugging
        logger.info(f"Successfully mapped {len(qa_mapping)} questions to answers using advanced mapping in {processing_time:.2f} seconds")
        
        # Return the mapped QA pairs
        return jsonify({
            "success": True,
            "message": f"Successfully mapped {len(qa_mapping)} questions to answers",
            "mappings": qa_mapping,
            "processing_time_seconds": processing_time
        })
        
    except TimeoutError:
        logger.error("Mapping questions to answers timed out")
        return jsonify({
            "success": False, 
            "message": "Mapping questions to answers timed out",
            "mappings": []
        }), 200  # Return 200 instead of 500 to avoid connection errors
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Error in map_questions_answers_advanced: {str(e)}\n{error_details}")
        return jsonify({
            "success": False, 
            "message": f"Error mapping questions to answers: {str(e)}",
            "mappings": []
        }), 200  # Return 200 instead of 500 to avoid connection errors

@app.route('/api/map-questions-answers', methods=['POST', 'OPTIONS'])
def map_questions_answers():
    """Map questions to answers in extracted text."""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cache-Control,Pragma')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response
    
    # For actual POST requests, apply token validation
    token = None
    
    # Check for token in headers
    auth_header = request.headers.get('Authorization')
    
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(" ")[1]
    
    if not token:
        logger.warning("No token provided for map-questions-answers")
        return jsonify({"error": "Authentication token is missing"}), 401
    
    try:
        # Decode and validate token
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        current_user = users_collection.find_one({"id": data["id"]})
        
        if not current_user:
            logger.warning(f"User ID from token not found: {data.get('id')}")
            return jsonify({"error": "Invalid user"}), 401
        
        # Continue with the original function logic
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({"error": "No data provided"}), 400
                
            # Get the text ID and questions
            text_id = data.get('text_id')
            questions = data.get('questions', [])
            
            if not text_id:
                return jsonify({"error": "Missing text_id parameter"}), 400
                
            if not questions or not isinstance(questions, list):
                return jsonify({"error": "Missing or invalid questions parameter"}), 400
            
            # Get the extracted text from the database
            extracted_text_doc = extracted_texts_collection.find_one(
                {"id": text_id, "userId": current_user["id"]}
            )
            
            if not extracted_text_doc:
                return jsonify({"error": f"Text ID not found: {text_id}"}), 404
                
            answer_text = extracted_text_doc.get("extractedText", "")
            
            # Format questions for mapper
            question_paper_text = {
                "title": "Questions",
                "totalMarks": sum(q.get("marks", 0) for q in questions),
                "questions": [
                    {
                        "id": str(i+1),
                        "text": q.get("question", ""),
                        "marks": q.get("marks", 0)
                    }
                    for i, q in enumerate(questions)
                ]
            }
            
            # Convert to JSON string for mapping
            question_paper_json = json.dumps(question_paper_text)
            
            # Use our mapping function without timeout
            try:
                start_time = time.time()
                # Direct call to mapper without timeout
                qa_mapping = mapper.map_answers(question_paper_json, answer_text, True, True)
                processing_time = time.time() - start_time
                
                # If no mappings were found
                if len(qa_mapping) == 0:
                    return jsonify({
                        "success": False,
                        "message": "Could not map any questions to answers.",
                        "mappings": [],
                        "processing_time_seconds": processing_time
                    }), 200
                
                # Return the mapped QA pairs
                return jsonify({
                    "success": True,
                    "message": f"Successfully mapped {len(qa_mapping)} questions to answers",
                    "mappings": qa_mapping,
                    "processing_time_seconds": processing_time
                })
                
            except Exception as e:
                logger.error(f"Error in mapper.map_answers: {str(e)}")
                return jsonify({
                    "success": False, 
                    "message": f"Error mapping questions to answers: {str(e)}",
                    "mappings": []
                }), 200
                
        except Exception as e:
            logger.error(f"Error in map_questions_answers: {str(e)}")
            return jsonify({
                "success": False, 
                "message": f"Error mapping questions to answers: {str(e)}",
                "mappings": []
            }), 200
    
    except Exception as jwt_error:
        logger.error(f"JWT validation error: {str(jwt_error)}")
        return jsonify({"error": "Invalid token"}), 401

def extract_questions_from_markdown(content):
    """Extract questions and their marks from markdown content."""
    questions = []
    
    # Try first pattern: "1. Question text [5]" or "- Question text [10]"
    question_pattern = r'(?:^|\n)(?:\d+\.|\-|\*)\s*(.*?)\s*\[(\d+)\]'
    matches = re.findall(question_pattern, content)
    
    # If no matches found, try an alternative pattern
    if not matches:
        alternative_pattern = r'(?:^|\n)(?:\d+\.|\-|\*)\s*(.*?)\s*(?:\[|（|Marks:)(\d+)(?:\]|）| marks)'
        matches = re.findall(alternative_pattern, content, re.IGNORECASE)
    
    for idx, match in enumerate(matches):
        question_text, marks = match
        questions.append({
            "id": str(idx + 1),  # Use sequential IDs for clarity
            "text": question_text.strip(),
            "marks": int(marks)
        })
    
    # If still no questions found, try to parse the whole file as one question per line
    if not questions:
        lines = content.strip().split('\n')
        for idx, line in enumerate(lines):
            # Try to find marks in square brackets anywhere in the line
            marks_match = re.search(r'\[(\d+)\]', line)
            if marks_match:
                marks_text = marks_match.group(0)
                marks = int(marks_match.group(1))
                # Remove the marks from the text
                question_text = line.replace(marks_text, '').strip()
                if question_text:
                    questions.append({
                        "id": str(idx + 1),
                        "text": question_text,
                        "marks": marks
                    })
    
    return questions

def run_with_timeout(func, args=(), kwargs={}, timeout=60):
    """Run a function with a timeout."""
    result_queue = queue.Queue()
    
    # Define a wrapper function that puts the result in a queue
    def wrapper():
        try:
            result = func(*args, **kwargs)
            result_queue.put(result)
        except Exception as e:
            result_queue.put(e)
    
    # Start the function in a separate thread
    thread = threading.Thread(target=wrapper)
    thread.daemon = True
    thread.start()
    
    # Wait for the result with timeout
    try:
        result = result_queue.get(timeout=timeout)
        if isinstance(result, Exception):
            raise result
        return result
    except queue.Empty:
        # If queue.get times out, raise TimeoutError
        raise TimeoutError(f"Function execution timed out after {timeout} seconds")

@app.route('/api/demo-login', methods=['POST', 'OPTIONS'])
def demo_login():
    """Create and authenticate a demo user."""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cache-Control,Pragma')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response
    
    try:
        # Generate a random username and email
        random_string = generate_random_string(8)
        username = f"demo_{random_string}"
        email = f"demo_{random_string}@example.com"
        password = generate_random_string(12)
        
        # Check if user with this username or email already exists
        existing_user = users_collection.find_one({"$or": [{"username": username}, {"email": email}]})
        
        if existing_user:
            # If demo user already exists, use it
            demo_user = existing_user
        else:
            # Create a new demo user
            user_id = str(uuid.uuid4())
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            
            demo_user = {
                "id": user_id,
                "username": username,
                "email": email,
                "password": hashed_password,
                "role": "demo",
                "created_at": datetime.now().isoformat()
            }
            
            users_collection.insert_one(demo_user)
        
        # Generate JWT token using the same secret and format as in auth.py
        payload = {
            'id': demo_user['id'],
            'username': demo_user['username'],
            'email': demo_user['email'],
            'role': demo_user['role'],
            'exp': (datetime.now() + timedelta(days=1)).timestamp()
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        
        # Handle string vs bytes output for different PyJWT versions
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        
        logger.info(f"Demo user created and logged in successfully: {demo_user['username']}")
        logger.info(f"Generated token (first 10 chars): {token[:10]}...")
        
        return jsonify({
            "success": True,
            "message": "Demo login successful",
            "token": token,
            "user": {
                "id": demo_user['id'],
                "username": demo_user['username'],
                "email": demo_user['email'],
                "role": demo_user['role']
            }
        })
    except Exception as e:
        logger.error(f"Error in demo login: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Demo login failed: {str(e)}"
        }), 500

def generate_random_string(length):
    """Generate a random string of fixed length."""
    import random
    import string
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

if __name__ == '__main__':
    # Use PORT environment variable if available (for Render compatibility)
    port = int(os.environ.get("PORT", 3000))
    host = '0.0.0.0'
    
    logger.info(f"Starting server on {host}:{port}")
    
    # Run the Flask app
    app.run(host=host, port=port, debug=False)
