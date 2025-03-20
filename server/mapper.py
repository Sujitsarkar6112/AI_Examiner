import os
import logging
import re
import json
import time
from dotenv import load_dotenv
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize the model at module level
model = None

def get_gemini_model():
    """Initialize and return the Gemini model."""
    global model
    
    try:
        if model is not None:
            return model
        
        # Load environment variables if not already done
        load_dotenv()
        
        # Get API key from environment - check multiple possible environment variable names
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("API key not found in environment variables (checked GOOGLE_API_KEY, GEMINI_API_KEY)")
            raise ValueError("API key environment variable not set")
            
        # Configure the API
        genai.configure(api_key=api_key)
        
        # Use the specified model name
        gemini_model_name = "gemini-2.0-flash-thinking-exp-01-21"
        
        # Initialize the model
        model = genai.GenerativeModel(gemini_model_name)
        logger.info(f"Gemini model successfully initialized with model: {gemini_model_name}")
        
        return model
        
    except Exception as e:
        logger.error(f"Error initializing Gemini model: {e}")
        return None

def extract_json_from_text(text):
    """
    Extract a JSON object or array from a text that might contain other content.
    
    Args:
        text (str): Text potentially containing JSON
        
    Returns:
        dict/list: Parsed JSON data or None if extraction fails
    """
    if not text:
        return None
        
    try:
        # First try direct JSON parsing
        return json.loads(text)
    except:
        pass
    
    try:
        # Look for JSON within code blocks
        code_block_pattern = r'```(?:json)?\s*([\s\S]*?)\s*```'
        matches = re.findall(code_block_pattern, text)
        
        for match in matches:
            try:
                return json.loads(match)
            except:
                continue
                
        # Look for arrays within the text
        array_pattern = r'\[\s*{[\s\S]*}\s*\]'
        array_matches = re.findall(array_pattern, text)
        
        for match in array_matches:
            try:
                return json.loads(match)
            except:
                continue
                
        # Look for any JSON-like structure
        json_pattern = r'({[\s\S]*}|\[[\s\S]*\])'
        json_matches = re.findall(json_pattern, text)
        
        for match in json_matches:
            try:
                return json.loads(match)
            except:
                continue
                
        return None
    except Exception as e:
        logger.error(f"Error extracting JSON: {e}")
        return None

def map_answers(question_paper_text, answer_text, is_md_format=False, handle_noise=True):
    """
    Main function for mapping questions to answers using a single prompt approach.
    
    Args:
        question_paper_text (str): The text content of the question paper or markdown questions
        answer_text (str): The extracted text containing student answers
        is_md_format (bool): Whether the questions are in Markdown format
        handle_noise (bool): Whether to try handling noise in the extracted text
        
    Returns:
        list: A list of dictionaries with the mapped questions and answers
    """
    if not get_gemini_model():
        logger.error("Gemini model not initialized")
        return []
    
    try:
        start_time = time.time()
        logger.info("Starting question-answer mapping with single prompt approach")
        
        # Trim inputs if they're very long to avoid token limits
        max_qp_chars = 8000
        max_ans_chars = 16000
        
        if len(question_paper_text) > max_qp_chars:
            logger.warning(f"Question paper text too long ({len(question_paper_text)} chars), trimming to {max_qp_chars}")
            question_paper_text = question_paper_text[:max_qp_chars]
            
        if len(answer_text) > max_ans_chars:
            logger.warning(f"Answer text too long ({len(answer_text)} chars), trimming to {max_ans_chars}")
            answer_text = answer_text[:max_ans_chars]
        
        # Further reduce content if both items together are too large
        total_chars = len(question_paper_text) + len(answer_text)
        max_total_chars = 22000
        
        if total_chars > max_total_chars:
            # Proportionally reduce both texts
            reduction_ratio = max_total_chars / total_chars
            new_qp_length = int(len(question_paper_text) * reduction_ratio)
            new_ans_length = int(len(answer_text) * reduction_ratio)
            
            logger.warning(f"Combined text too long ({total_chars} chars), reducing to {max_total_chars}")
            question_paper_text = question_paper_text[:new_qp_length]
            answer_text = answer_text[:new_ans_length]
        
        # Build the single unified prompt for Gemini
        format_instruction = """
        For Markdown format questions, they might appear as:
        - "1. Question text [5]" (where 5 is the marks)
        - "- Question text [10]" (where 10 is the marks)
        - "## Question text [5]"
        """
        
        noise_handling_instruction = """
        The student answer text may contain noise from the OCR process, such as:
        - Headers, footers, page numbers
        - Irrelevant text or artifacts
        - Formatting issues
        Please use your understanding to filter out this noise and focus on extracting the actual answers.
        """
                
        prompt = f"""
        # Question-Answer Extraction Task

        ## Your Role
        You are an AI expert in academic assessment, tasked with finding answers to specific questions in a student's answer sheet.

        ## Questions
        ```
        {question_paper_text}
        ```

        ## Student Answer Text (may contain noise or irrelevant text)
        ```
        {answer_text}
        ```

        ## Your Task
        1. First, identify all questions from the provided questions section.
        2. Then, for each identified question, find the corresponding answer in the student's answer text.
        3. You must intelligently handle any noise, irrelevant text, or potential OCR errors.
        4. Use semantic understanding rather than just pattern matching to identify which text corresponds to which question.
        
        {format_instruction if is_md_format else ""}
        {noise_handling_instruction if handle_noise else ""}

        ## Response Format
        Return a JSON array with this exact structure:
        ```
        [
          {{
            "questionNumber": <number>,
            "question": "<question text>",
            "maxMarks": <number>,
            "answer": "<extracted answer text>"
          }},
          ...
        ]
        ```

        Return only the JSON array with NO additional explanation or text.
        """
        
        logger.info("Sending unified mapping request to Gemini")
        
        # Try multiple times with exponential backoff
        max_retries = 3
        retry_delay = 2  # Initial delay in seconds
        
        for attempt in range(max_retries):
            try:
                response = get_gemini_model().generate_content(prompt)
                
                # Extract the JSON part from the response
                response_text = response.text
                
                # Try to extract JSON from the text
                qa_mapping = extract_json_from_text(response_text)
                
                if qa_mapping and isinstance(qa_mapping, list):
                    # Validate the structure
                    valid_items = []
                    for item in qa_mapping:
                        if (isinstance(item, dict) and 
                            "questionNumber" in item and 
                            "question" in item and 
                            "maxMarks" in item and 
                            "answer" in item):
                            valid_items.append(item)
                    
                    if valid_items:
                        processing_time = time.time() - start_time
                        logger.info(f"Successfully mapped {len(valid_items)} questions to answers in {processing_time:.2f} seconds")
                        return valid_items
                
                logger.warning(f"Invalid response format on attempt {attempt + 1}, retrying...")
                
                # Exponential backoff
                time.sleep(retry_delay)
                retry_delay *= 2
                
            except Exception as e:
                logger.error(f"Error on attempt {attempt + 1}: {e}")
                time.sleep(retry_delay)
                retry_delay *= 2
        
        logger.error("All mapping attempts failed, returning empty result")
        return []
        
    except Exception as e:
        logger.error(f"Error in answer mapping: {e}")
        return []

def find_answer_for_question(question, answer_text):
    """
    Find the most likely answer to a specific question within the answer text.
    This is now a wrapper around the map_answers function for backward compatibility.
    
    Args:
        question (str): The question to find an answer for
        answer_text (str): The extracted text containing potential answers
        
    Returns:
        str: The identified answer text, or empty string if no answer found
    """
    try:
        # Create a simplified question paper with just this question
        question_paper = f"1. {question} [1]"
        
        # Use the main mapping function
        results = map_answers(question_paper, answer_text, False, True)
        
        # Extract the answer if found
        if results and len(results) > 0 and "answer" in results[0]:
            return results[0]["answer"]
        
        return ""
    except Exception as e:
        logger.error(f"Error finding answer for question: {e}")
        return ""
