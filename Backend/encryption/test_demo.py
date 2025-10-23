#!/usr/bin/env python3
"""
Steganography Demo/Test - Direct functionality test
Shows hiding and revealing text in images
"""

from steganography import hide_text_in_image, reveal_text_from_image, validate_image_for_steganography
from PIL import Image
import base64
import io

def create_simple_image():
    """Create a 100x100 blue image"""
    return Image.new('RGB', (100, 100), color=(0, 100, 200))

def image_to_base64(img):
    """Convert PIL image to base64"""
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def demo_steganography():
    print("🔐 STEGANOGRAPHY DEMONSTRATION")
    print("=" * 40)

    # Create test image
    print("Creating test image...")
    image = create_simple_image()
    print(f"✅ Created {image.size[0]}x{image.size[1]} image")

    # Convert to base64
    print("\nConverting image to base64...")
    image_data = image_to_base64(image)
    print(f"✅ Image converted ({len(image_data)} chars)")

    # Test message (using ASCII only for better compatibility)
    message = "Secret: Hello World!"
    print(f"\n📝 Message to hide: '{message}'")

    # Validate image
    print("\n🔍 Validating image...")
    validation = validate_image_for_steganography(image_data)
    if validation['success']:
        print(f"✅ Image OK - can hide {validation['max_chars']} chars")
    else:
        print(f"❌ Validation failed: {validation['error']}")
        return

    # Check message fits
    if len(message) > validation['max_chars']:
        print("⚠️  Message too long, truncating...")
        message = message[:validation['max_chars']]
        print(f"✂️  Now: '{message}'")

    # Hide message
    print("\n🖼️  Hiding message in image...")
    result = hide_text_in_image(image_data, message)
    if result['success']:
        hidden_image = result['steganographic_image']
        print("✅ Message successfully hidden!")
        print(f"   Hidden image size: {len(hidden_image)} chars")
    else:
        print(f"❌ Failed to hide: {result['error']}")
        return

    # Reveal message
    print("\n🔓 Extracting hidden message...")
    reveal_result = reveal_text_from_image(hidden_image)
    if reveal_result['success']:
        extracted = reveal_result['hidden_text']
        print(f"✅ Extracted: '{extracted}'")

        # Verify
        if extracted == message:
            print("🎉 PERFECT! Messages match exactly!")
            print("🔐 STEGANOGRAPHY IS WORKING!")
        else:
            print("❌ Messages don't match!")
    else:
        print(f"❌ Failed to extract: {reveal_result['error']}")

    print("\n" + "=" * 40)
    print("🏁 DEMO COMPLETED")

if __name__ == "__main__":
    demo_steganography()
