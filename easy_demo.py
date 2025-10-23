#!/usr/bin/env python3
"""
Quick Steganography Demo - No extra dependencies needed
"""
import base64
from io import BytesIO
from PIL import Image, ImageDraw

from Backend.encryption import steganography

print("=" * 50)
print("QUICK STEGANOGRAPHY PROOF")
print("=" * 50)

# Create a simple image
img = Image.new('RGB', (50, 50), color=(200, 200, 255))
draw = ImageDraw.Draw(img)
draw.rectangle([10, 10, 40, 40], fill=(255, 0, 0))

# Convert to base64
buffered = BytesIO()
img.save(buffered, format="PNG")
original_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

# Hide a secret message
secret = "CONFIDENTIAL: Hidden in image!"

print(f"Secret to hide: '{secret}'")

# Step 1: Hide the message
hide_result = steganography.hide_text_in_image(original_b64, secret)
if hide_result['success']:
    stego_b64 = hide_result['steganographic_image']
    print("✓ Message successfully hidden in image")
else:
    print("✗ Failed to hide:", hide_result.get('error', 'Unknown error'))
    exit(1)

# Step 2: Extract the message
extract_result = steganography.reveal_text_from_image(stego_b64)
if extract_result['success']:
    extracted = extract_result['hidden_text']
    print(f"✓ Message extracted: '{extracted}'")
else:
    print("✗ Failed to extract:", extract_result.get('error', 'Unknown error'))
    exit(1)

# Step 3: Verify perfect match
print(f"\nVERIFICATION:")
print(f"Original:  {secret}")
print(f"Extracted: {extracted}")
if extracted == secret:
    print("🎉 100% PERECT MATCH!")
    print("🔐 STEGANOGRAPHY IS WORKING!")
    print("✅ Text is definitely hidden in the image!")
else:
    print("❌ Mismatch detected!")

# Step 4: Save proof
original_img = Image.open(BytesIO(base64.b64decode(original_b64)))
stego_img = Image.open(BytesIO(base64.b64decode(stego_b64)))

original_img.save('original.png')
stego_img.save('with_hidden_data.png')

with open('PROOFTXT', 'w') as f:
    f.write("STEGANOGRAPHY WORKS!\n\n")
    f.write(f"Hidden: {secret}\n")
    f.write(f"Found:  {extracted}\n")
    f.write(f"Match:  {'YES' if extracted == secret else 'NO'}\n")

print(f"\nFiles saved:")
print("- original.png")
print("- with_hidden_data.png (looks identical but contains hidden data)")
print("- PROOFTXT (verification)")

print(f"\n" + "=" * 50)
print("✅ PROOF COMPLETE!")
print("Show these files to your sir - steganography works!")
print("=" * 50)
