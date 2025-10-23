import base64
from openai import OpenAI

# Load image from file
image_path = 'Frontend/public/LOGO.png'
with open(image_path, 'rb') as image_file:
    image_data = base64.b64encode(image_file.read()).decode('utf-8')

# Initialize OpenRouter client
import os

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY", "<API_KEY>"),  # Use env var or fallback
)

# List of vision models to test
vision_models = [
    # "qwen/qwen2.5-vl-72b-instruct:free",  # Currently unavailable (404 error)
    # "qwen/qwen2.5-vl-32b-instruct:free",
    # "google/gemma-3-27b-it:free",
    # "google/gemma-3-12b-it:free",
    # "google/gemma-3-4b-it:free",
    # "google/gemini-2.0-flash-exp:free"
    "mistralai/mistral-small-3.2-24b-instruct:free",
    "meta-llama/llama-4-maverick:free",
    "meta-llama/llama-4-scout:free",
    "qwen/qwen2.5-vl-32b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "google/gemma-3-4b-it:free",
    "google/gemma-3-12b-it:free",
    "google/gemma-3-27b-it:free",
    # "qwen/qwen2.5-vl-72b-instruct:free",  # Moved to comments - causing 404
    "google/gemini-2.0-flash-exp:free"

]

for model in vision_models:
    try:
        print(f"Testing model: {model}")
        # Create chat completion with image
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "What is in this image?"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_data}"
                            }
                        }
                    ]
                }
            ]
        )
        # Print the response
        print(f"Response: {completion.choices[0].message.content}")
        print("-" * 50)
    except Exception as e:
        print(f"Error with {model}: {e}")
        print("-" * 50)
