"""
PDF Utilities Module - Handles PDF processing separately from OCR functionality
"""

import fitz  # PyMuPDF
from PIL import Image
import io

def pdf_to_images(pdf_path, dpi=300):
    """
    Convert a PDF file to a list of PIL Image objects.
    
    Args:
        pdf_path (str): Path to the PDF file
        dpi (int): Resolution for the image conversion (higher = better quality but larger files)
        
    Returns:
        list: List of PIL Image objects, one per page
    """
    images = []
    try:
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            # Adjust the scale factor based on DPI (1.5 is approximately 144 DPI)
            # For 300 DPI, use 3.125 (300/96)
            scale_factor = dpi / 96
            pix = page.get_pixmap(matrix=fitz.Matrix(scale_factor, scale_factor))
            img_bytes = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_bytes))
            images.append(img)
        doc.close()
    except Exception as e:
        print(f"Error converting PDF to images: {e}")
        raise Exception(f"Failed to convert PDF to images: {str(e)}")
    
    return images
