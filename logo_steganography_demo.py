#!/usr/bin/env python3
"""
Logo Steganography Demo - Complete Working Example
Uses the actual logo file with hidden message "Hi i am logo"
Saves both steganographic and retrieved images
"""

from Backend.encryption.steganography import hide_text_in_image, reveal_text_from_image
from PIL import Image
import base64
import os

def load_logo_image():
    """Load the logo image from Frontend/public/LOGO.png"""
    logo_path = os.path.join("Frontend", "public", "LOGO.png")

    if not os.path.exists(logo_path):
        print(f"❌ Logo file not found at: {logo_path}")
        return None

    try:
        image = Image.open(logo_path)
        print("✅ Logo loaded successfully")
        print(f"   Dimensions: {image.size[0]}x{image.size[1]} pixels")
        print(f"   Mode: {image.mode}")
        return image
    except Exception as e:
        print(f"❌ Failed to load logo: {e}")
        return None

def image_to_base64(img):
    """Convert PIL Image to base64 string"""
    from io import BytesIO
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_bytes = buffer.getvalue()
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    return img_base64

def base64_to_image(base64_string):
    """Convert base64 string back to PIL Image"""
    from io import BytesIO
    img_bytes = base64.b64decode(base64_string)
    img = Image.open(BytesIO(img_bytes))
    return img

def demo_logo_steganography():
    print("🖼️  LOGO STEGANOGRAPHY DEMO")
    print("=" * 50)

    # Load the logo
    print("Loading logo image...")
    logo_image = load_logo_image()
    if not logo_image:
        return

    # Convert to base64
    print("\nConverting logo to base64...")
    logo_base64 = image_to_base64(logo_image)
    print(f"✅ Logo converted ({len(logo_base64)} characters)")

    # Define secret message
    secret_message = "Hi i am logo"
    print(f"\n📝 Secret message: '{secret_message}'")

    # Hide message in logo
    print("\n🖼️  Hiding message in logo...")
    hide_result = hide_text_in_image(logo_base64, secret_message)

    if hide_result['success']:
        stego_base64 = hide_result['steganographic_image']
        print("✅ Message hidden successfully!")

        # Save the steganographic image (with hidden data)
        print("\n💾 Saving steganographic image...")
        stego_image = base64_to_image(stego_base64)
        stego_path = "steganographic_logo.png"
        stego_image.save(stego_path)
        print(f"✅ Saved: {stego_path}")

        # Retrieve the hidden message
        print("\n🔓 Retrieving hidden message...")
        reveal_result = reveal_text_from_image(stego_base64)

        if reveal_result['success']:
            extracted_message = reveal_result['hidden_text']
            print(f"✅ Extracted message: '{extracted_message}'")

            # Verify it matches
            if extracted_message == secret_message:
                print("🎉 SUCCESS! Messages match perfectly!")

                # Also create a text file with the results
                print("\n📝 Creating results file...")
                with open("steganography_results.txt", "w") as f:
                    f.write("STE GANOGRAPHY RESULTS\n")
                    f.write("=====================\n\n")
                    f.write(f"Original logo: Frontend/public/LOGO.png\n")
                    f.write(f"Steganographic logo: {stego_path}\n")
                    f.write(f"Hidden message: '{secret_message}'\n")
                    f.write(f"Extracted message: '{extracted_message}'\n")
                    f.write(f"Success: {'YES' if extracted_message == secret_message else 'NO'}\n")

                print("✅ Results saved to: steganography_results.txt")

                print("\n📊 SUMMARY:")
                print("=" * 30)
                print(f"🔵 Original Image: Frontend/public/LOGO.png")
                print(f"🟡 Hidden Image: {stego_path}")
                print(f"💬 Secret Message: '{secret_message}'")
                print(f"✅ Verified: Messages Match!")
                print(f"🔐 Technology: LSB Steganography")

            else:
                print("❌ ERROR: Messages don't match!")
                print(f"   Expected: '{secret_message}'")
                print(f"   Got:      '{extracted_message}'")
        else:
            print(f"❌ Failed to reveal message: {reveal_result['error']}")

    else:
        print(f"❌ Failed to hide message: {hide_result['error']}")

    print("\n" + "=" * 50)
    print("🏁 LOGO STEGANOGRAPHY DEMO COMPLETED")

if __name__ == "__main__":
    demo_logo_steganography()
