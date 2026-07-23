import io
import fitz
import pytesseract
from PIL import Image
from app.core.config import get_settings

settings = get_settings()

def extract_text_from_pdf(file_bytes):
    doc = fitz.open(stream=file_bytes,filetype="pdf")

    text = ""
    for page in doc:
        text =  text + page.get_text()

    if len(text.strip()) > settings.pdf_text_min_length :
        doc.close()
        return text, "text_extraction"

    ocr_text = ""
    for page in doc:
        pixmap =  page.get_pixmap(dpi=settings.ocr_dpi)
        image_bytes = pixmap.tobytes("png")
        image = Image.open(io.BytesIO(image_bytes))
        ocr_text += pytesseract.image_to_string(image)

    doc.close()
    return ocr_text, "ocr_extraction"
