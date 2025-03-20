"""
Gemini OCR Module - Handles OCR processing using Google's Gemini API
"""

import os
import json
import time
import re
import io
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv
from prompts import OCR_PROMPT

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")

genai.configure(api_key=GEMINI_API_KEY)

generation_config = {
    "temperature": 0.2,
    "top_p": 0.95,
    "top_k": 32,
    "max_output_tokens": 4096,
}

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-thinking-exp-01-21",
    generation_config=generation_config,
)

def safe_generate_content(prompt, retries=3, sleep_time=2):
    """
    Safely generate content with built-in retry logic.
    
    Args:
        prompt: The prompt to send to Gemini
        retries: Number of retry attempts
        sleep_time: Time to wait between retries in seconds
        
    Returns:
        Generated text or None if all attempts fail
    """
    for attempt in range(1, retries + 1):
        try:
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            else:
                print(f"Warning: Received empty response on attempt {attempt}. Retrying...")
        except Exception as e:
            print(f"Error on attempt {attempt}: {e}\nRetrying...")

        time.sleep(sleep_time)

    return None

def extract_text_from_image(image):
    """
    Extract text from an image using Gemini Vision API.
    
    Args:
        image: PIL Image object or path to an image file
        
    Returns:
        Extracted text as string
    """
    # Handle both PIL Image objects and image paths
    if isinstance(image, str):
        # If image is a file path
        with open(image, "rb") as img_file:
            img_data = img_file.read()
    else:
        # If image is a PIL Image object
        img_buffer = io.BytesIO()
        image.save(img_buffer, format="PNG")
        img_data = img_buffer.getvalue()
        img_buffer.close()
    
    prompt = [
        OCR_PROMPT,
        {"mime_type": "image/png", "data": img_data}
    ]

    text = safe_generate_content(prompt, retries=3, sleep_time=2)

    if text is None:
        return "ERROR: Unable to process image after multiple retries."
    else:
        return text

def process_image(image):
    """
    Process a single image with OCR.
    
    Args:
        image: PIL Image object or path to an image file
        
    Returns:
        Extracted text as string
    """
    start_time = time.time()
    extracted_text = extract_text_from_image(image)
    end_time = time.time()
    elapsed_time = round(end_time - start_time, 2)
    
    print(f"Processed image in {elapsed_time} seconds.")
    return extracted_text

def process_images(images):
    """
    Process multiple images and combine their text.
    
    Args:
        images: List of PIL Image objects
        
    Returns:
        Combined extracted text as string
    """
    combined_text = ""
    for i, img in enumerate(images):
        page_text = process_image(img)
        combined_text += f"\n\n--- Page {i+1} ---\n\n{page_text}"
        # Small pause to avoid rate limits
        if i < len(images) - 1:
            time.sleep(1)
    
    return combined_text.strip()
