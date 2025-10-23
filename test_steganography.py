#!/usr/bin/env python3
"""
Test script for steganography functionality
Demonstrates hiding and revealing text in images
"""

from Backend.encryption.steganography import hide_text_in_image, reveal_text_from_image, validate_image_for_steganography
from PIL import Image
import base64
import io

def create_test_image(width=100, height=100, color=(255, 255, 255)):
    """Create a simple test image"""
    img = Image.new('RGB', (width, height), color)
    return img

def image_to_base64(image):
    """Convert PIL Image to base64 string"""
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    img_bytes = buffer.getvalue()
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    return img_base64

def base64_to_image(base64_string):
    """Convert base64 string back to PIL Image"""
    img_bytes = base64.b64decode(base64_string)
    img = Image.open(io.BytesIO(img_bytes))
    return img

def test_steganography():
    """Test steganography functionality"""
    print("🔍 STEGANOGRAPHY TEST FUNCTION")
    print("=" * 50)

    # Step 1: Create a test image
    print("📷 Creating test image...")
    test_image = create_test_image(200, 200, (173, 216, 230))  # Light blue
    print("✅ Test image created (200x200 pixels, light blue)")

    # Step 2: Convert to base64
    print("\n🔄 Converting image to base64...")
    image_base64 = image_to_base64(test_image)
    print(f"✅ Image converted to base64 ({len(image_base64)} characters)")

    # Step 3: Validate image for steganography
    print("\n⚖️  Validating image for steganography...")
    validation_result = validate_image_for_steganography(image_base64)
    if validation_result.get('success'):
        max_chars = validation_result.get('max_chars', 0)
        print(f"✅ Image is valid for steganography (max {max_chars} characters)")
    else:
        print(f"❌ Image validation failed: {validation_result.get('error')}")
        return

    # Step 4: Test text to hide
    secret_message = "Hello! This is a secret message hidden in an image using steganography. 🔒✨"
    print(f"\n📝 Secret message to hide: \"{secret_message}\"")
    print(f"📊 Message length: {len(secret_message)} characters")

    # Check if message fits
    if len(secret_message) > max_chars:
        print(f"⚠️  Warning: Message ({len(secret_message)} chars) exceeds max capacity ({max_chars} chars)")
        secret_message = secret_message[:max_chars]  # Truncate
        print(f"✂️  Truncated message: \"{secret_message}\" ")

    # Step 5: Hide text in image
    print("\n🖼️  Hiding text in image using steganography...")
    hide_result = hide_text_in_image(image_base64, secret_message)

    if hide_result.get('success'):
        stego_image_base64 = hide_result.get('steganographic_image')
        print(f"✅ Text successfully hidden! Steganographic image size: {len(stego_image_base64)} characters")

        # Verify the steganographic image looks different (size might differ due to encoding)
        if len(stego_image_base64) != len(image_base64):
            print("📊 Steganographic image differs from original (as expected)")

    else:
        print(f"❌ Failed to hide text: {hide_result.get('error')}")
        return

    # Step 6: Reveal hidden text from steganographic image
    print("\n🔓 Revealing hidden text from steganographic image...")
    reveal_result = reveal_text_from_image(stego_image_base64)

    if reveal_result.get('success'):
        revealed_message = reveal_result.get('hidden_text')
        print(f"✅ Hidden text revealed: \"{revealed_message}\"")

        # Step 7: Verify the messages match
        if revealed_message == secret_message:
            print("🎉 SUCCESS: Original message matches revealed message!")
            print("🔐 STEGANOGRAPHY IS WORKING CORRECTLY!")

            # Additional verification
            print("\n📋 VERIFICATION DETAILS:")
            print(f"   Original message length: {len(secret_message)}")
            print(f"   Revealed message length: {len(revealed_message)}")
            print(f"   Messages identical: {secret_message == revealed_message}")

        else:
            print(f"❌ MISMATCH: Messages don't match!")
            print(f"   Expected: '{secret_message}'")
            print(f"   Got:      '{revealed_message}'")

    else:
        print(f"❌ Failed to reveal text: {reveal_result.get('error')}")

    print("\n" + "=" * 50)
    print("🏁 STEGANOGRAPHY TEST COMPLETED")

if __name__ == "__main__":
    try:
        test_steganography()
    except Exception as e:
        print(f"❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
