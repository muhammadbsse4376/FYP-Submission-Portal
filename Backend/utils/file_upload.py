import os
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "zip", "rar"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB (deprecated, use config values instead)


def allowed_file(filename):
    """Check if the filename has an allowed extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_file_size(file, max_size=None):
    """
    Validate that the file size does not exceed the limit.
    
    Args:
        file: FileStorage object
        max_size: Maximum size in bytes (uses MAX_FILE_SIZE if not provided)
    
    Returns:
        True if valid, False otherwise.
    """
    if not file or not file.filename:
        return False
    
    if max_size is None:
        max_size = MAX_FILE_SIZE
    
    # Seek to end to get file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset to beginning
    
    return file_size <= max_size


def save_file(file, prefix="", max_size=None):
    """
    Save an uploaded file to the uploads folder.
    
    Args:
        file: FileStorage object to save
        prefix: Prefix for the saved filename
        max_size: Maximum allowed file size in bytes
    
    Returns:
        Saved filename if successful, None if invalid
    
    Raises:
        ValueError: If file size exceeds limit
    """
    if not file or not file.filename:
        return None

    if not allowed_file(file.filename):
        return None
    
    if max_size is None:
        max_size = MAX_FILE_SIZE
    
    if not validate_file_size(file, max_size):
        size_mb = max_size / (1024 * 1024)
        raise ValueError(f"File size exceeds maximum allowed size of {size_mb:.1f}MB")

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    from datetime import datetime
    timestamp = int(datetime.utcnow().timestamp())
    filename = secure_filename(file.filename)
    if prefix:
        filename = f"{prefix}_{timestamp}_{filename}"
    else:
        filename = f"{timestamp}_{filename}"

    file.save(os.path.join(UPLOAD_FOLDER, filename))
    return filename
