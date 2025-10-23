#!/usr/bin/env python3
"""
Steganography service for hiding text in images using LSB (Least Significant Bit) steganography.
This service allows covert communication by embedding secret messages within images.
"""

import base64
import io
import tempfile
import os
from PIL import Image
import traceback
from stegano.lsb import hide, reveal


def hide_text_in_image(image_base64, secret_text):
    """
    Hide text in an image using steganography.

    Args:
        image_base64 (str): Base64 encoded image
        secret_text (str): Text to hide in the image

    Returns:
        dict: Result with steganographic image or error
    """
    temp_input = None
    temp_output = None

    try:
        # Decode base64 to PIL Image
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))

        # Convert to RGB if necessary
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # Hide text using stegano LSB steganography directly on PIL Image
        secret_image = hide(image, secret_text)

        # Encode back to base64
        buffer = io.BytesIO()
        secret_image.save(buffer, format="PNG")
        buffer.seek(0)
        encoded_image = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return {
            'success': True,
            'steganographic_image': encoded_image
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Steganography hiding failed: {str(e)}'
        }


def reveal_text_from_image(image_base64):
    """
    Reveal hidden text from a steganographic image.

    Args:
        image_base64 (str): Base64 encoded steganographic image

    Returns:
        dict: Result with hidden text or error
    """
    try:
        # Decode base64 to PIL Image
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))

        # Reveal hidden text using stegano LSB steganography
        hidden_text = reveal(image)

        return {
            'success': True,
            'hidden_text': hidden_text or ''
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Steganography reveal failed: {str(e)}'
        }


def validate_image_for_steganography(image_base64):
    """
    Validate if an image can be used for steganography and return capacity info.

    Args:
        image_base64 (str): Base64 encoded image

    Returns:
        dict: Validation result with success/max_chars format
    """
    try:
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))

        # Check image mode
        width, height = image.size

        # Convert to RGB if necessary (works best for LSB steganography)
        if image.mode not in ("RGB", "RGBA", "P"):
            image = image.convert("RGB")

        # Check minimum size for meaningful capacity
        if width < 10 or height < 10:
            return {
                'success': False,
                'error': 'Image too small for steganography'
            }

        # Calculate maximum text capacity (very conservative estimate)
        pixel_count = width * height
        max_chars = pixel_count // 8  # 1 bit per pixel for ASCII text

        return {
            'success': True,
            'max_chars': max_chars
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Image validation failed: {str(e)}'
        }
