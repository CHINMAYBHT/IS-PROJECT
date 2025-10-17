# Chat App

This is a simple chat application that uses Ollama for AI responses.

## Architecture

- **Client**: A React-based frontend application that provides the user interface.
- **Backend**: A Flask-based backend application that handles chat sessions and interacts with Ollama.
- **Ollama**: A local language model server that provides AI responses.

## Getting Started

Follow these steps to set up and run the application:

### Prerequisites

- Docker and Docker Compose
- Node.js and npm (for client development)
- Python and pip (for backend development)

### Setup

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Start the services using Docker Compose**:

    ```bash
    docker-compose up --build
    ```

    This will start the Ollama, backend, and client services.

3.  **Access the application**:

    Open your browser and navigate to `http://localhost:3000` (or the port specified in your client configuration).

## Usage

-   **Start a new chat**: Click on the "New Chat" button.
-   **Send messages**: Type your message in the input field and press Enter or click the "Send" button.
-   **View chat history**: Your chat history will be displayed in the main chat window.

## Project Structure

-   `client_demo/`: Contains the Flask backend application.
-   `Frontend/`: Contains the React frontend application.
-   `docker-compose.yml`: Defines the services for Docker Compose.
-   `README.md`: This file.