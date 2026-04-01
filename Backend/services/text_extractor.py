"""
Text extraction service for PDF and DOCX documents
"""
import PyPDF2
from docx import Document
import os


class TextExtractor:
    """Extract text from various document formats (PDF, DOCX, TXT)"""

    @staticmethod
    def extract_from_pdf(file_path):
        """
        Extract text from PDF file

        Args:
            file_path: Path to PDF file

        Returns:
            str: Extracted text content
        """
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                num_pages = len(pdf_reader.pages)

                for page_num in range(num_pages):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text() + "\n"

            return text.strip()
        except Exception as e:
            print(f"Error extracting PDF {file_path}: {e}")
            return ""

    @staticmethod
    def extract_from_docx(file_path):
        """
        Extract text from DOCX file

        Args:
            file_path: Path to DOCX file

        Returns:
            str: Extracted text content
        """
        try:
            doc = Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text.strip()
        except Exception as e:
            print(f"Error extracting DOCX {file_path}: {e}")
            return ""

    @staticmethod
    def extract_from_txt(file_path):
        """
        Read text from TXT file

        Args:
            file_path: Path to TXT file

        Returns:
            str: File content
        """
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read().strip()
        except Exception as e:
            print(f"Error reading TXT {file_path}: {e}")
            return ""

    @staticmethod
    def extract_text(file_path):
        """
        Auto-detect file type and extract text

        Args:
            file_path: Path to document file

        Returns:
            str: Extracted text content
        """
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            return ""

        # Get file extension
        ext = os.path.splitext(file_path)[1].lower()

        # Extract based on file type
        if ext == '.pdf':
            return TextExtractor.extract_from_pdf(file_path)
        elif ext in ['.docx', '.doc']:
            return TextExtractor.extract_from_docx(file_path)
        elif ext == '.txt':
            return TextExtractor.extract_from_txt(file_path)
        else:
            # For code files or unknown types, try reading as text
            try:
                return TextExtractor.extract_from_txt(file_path)
            except:
                print(f"Unsupported file format: {ext}")
                return ""

    @staticmethod
    def is_valid_content(text, min_words=10):
        """
        Check if extracted text is valid (has enough content)

        Args:
            text: Extracted text
            min_words: Minimum number of words required

        Returns:
            bool: True if content is valid
        """
        if not text or not text.strip():
            return False

        word_count = len(text.split())
        return word_count >= min_words
