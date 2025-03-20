import os
import json
import logging
from PIL import Image
from dotenv import load_dotenv
import gemini_ocr
from pdf_utils import pdf_to_images

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def parse_sections(text):
    """Parse the extracted text into question/answer sections."""
    sections = []
    
    # First try to match Question/Answer pairs with clear markers
    question_matches = [m for m in text.split("\n") if m.strip().lower().startswith(("question", "q ")) and len(m) > 10]
    
    if question_matches:
        current_question = ""
        current_answer = ""
        
        lines = text.split("\n")
        in_question = False
        in_answer = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if line.lower().startswith(("question", "q ")) and len(line) > 10:
                # Save previous Q&A if exists
                if current_question and current_answer:
                    sections.append({
                        "question": current_question.strip(),
                        "answer": current_answer.strip()
                    })
                
                current_question = line
                current_answer = ""
                in_question = True
                in_answer = False
            elif line.lower().startswith(("answer", "a ")) and len(line) > 8:
                in_question = False
                in_answer = True
                current_answer += line.replace("Answer:", "").replace("answer:", "").strip() + " "
            elif in_question:
                current_question += " " + line
            elif in_answer or current_question:  # If we have a question but no answer marker, assume it's the answer
                current_answer += line + " "
        
        # Add the last Q&A pair
        if current_question and current_answer:
            sections.append({
                "question": current_question.strip(),
                "answer": current_answer.strip()
            })
    
    # If no proper Q&A structure was found, try a fallback approach
    if not sections:
        paragraphs = text.split("\n\n")
        for i in range(0, len(paragraphs), 2):
            if i + 1 < len(paragraphs):
                sections.append({
                    "question": f"Question {i//2 + 1}: {paragraphs[i].strip()}",
                    "answer": paragraphs[i+1].strip()
                })
    
    return sections

def process_file(file_path):
    """
    Process a file (PDF or image) with OCR.
    """
    try:
        file_extension = os.path.splitext(file_path)[1].lower()
        file_size = os.path.getsize(file_path)
        file_size_kb = file_size / 1024
        
        logger.info(f"Processing file: {os.path.basename(file_path)} ({file_size_kb:.1f} KB)")
        
        if file_extension == '.pdf':
            # Convert PDF to images
            logger.info("Converting PDF to images...")
            images = pdf_to_images(file_path)
            
            # Process images with Gemini OCR
            logger.info(f"Processing {len(images)} pages with OCR...")
            text_result = gemini_ocr.process_images(images)
            
            # Estimate confidence based on text length (simple heuristic)
            confidence = min(95, 70 + len(text_result) // 1000)
        else:
            # Process a single image
            logger.info("Processing image with OCR...")
            img = Image.open(file_path)
            text_result = gemini_ocr.process_image(img)
            confidence = min(95, 70 + len(text_result) // 1000)
        
        # Parse the text into sections
        logger.info("Parsing text sections...")
        sections = parse_sections(text_result)
        
        logger.info(f"OCR processing complete: {len(text_result)} characters, {len(sections)} sections")
        
        return {
            "text": text_result,
            "confidence": confidence,
            "sections": sections,
            "page_count": len(images) if file_extension == '.pdf' else 1
        }
    except Exception as e:
        logger.error(f"Error in OCR processing: {str(e)}")
        raise Exception(f"Unable to process document: {str(e)}")
