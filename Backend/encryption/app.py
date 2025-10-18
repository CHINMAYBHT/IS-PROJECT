from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from Crypto.Random import get_random_bytes
import mysql.connector
import json
from datetime import datetime
from AES import AESCipher
from rsa import rsa_encrypt, rsa_decrypt
# Import original RSA functions for compatibility
def rsa_encrypt_simple(message, public_key):
    n, e = public_key
    encmsg = [pow(ord(char), e, n) for char in message]
    return encmsg

def rsa_decrypt_simple(encrypted_ints, private_key):
    n, d = private_key
    decmsg = "".join(chr(pow(i, d, n)) for i in encrypted_ints)
    return decmsg
import os
from dotenv import load_dotenv

load_dotenv()

# Environment variables
DB_HOST = os.environ['DB_HOST']
DB_USER = os.environ['DB_USER']
DB_PASS = os.environ['DB_PASS']
DB_NAME = os.environ['DB_NAME']

app = Flask(__name__)
CORS(app)

print('🚀 Starting Python Encryption Server...')
print('💾 Initializing encryption service...')
print('')

# Database configuration (same as main app)
DB_CONFIG = {
    'host': DB_HOST,
    'user': DB_USER,
    'password': DB_PASS,
    'database': DB_NAME
}

def get_db_connection():
    """Get MySQL database connection"""
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except mysql.connector.Error as err:
        print(f'❌ [DATABASE] Connection error: {err}')
        return None

# AES-256 encryption/decryption functions
def generate_key():
    return get_random_bytes(32)  # 256-bit key

def encrypt_message(message: str, key: bytes) -> dict:
    """Encrypt a message using AES-256-CBC"""
    try:
        cipher = AESCipher(key)
        encrypted_combined = cipher.encrypt(message)
        
        # Extract IV and encrypted data from combined result
        iv_b64 = base64.b64encode(encrypted_combined[:16]).decode('utf-8')
        encrypted_data_b64 = base64.b64encode(encrypted_combined[16:]).decode('utf-8')

        return {
            'encrypted_data': encrypted_data_b64,
            'iv': iv_b64,
            'success': True
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def decrypt_message(encrypted_data: str, iv: str, key: bytes) -> dict:
    """Decrypt a message using AES-256-CBC"""
    try:
        # Decode from base64
        encrypted_bytes = base64.b64decode(encrypted_data)
        iv_bytes = base64.b64decode(iv)

        # Recombine IV and encrypted data
        combined = iv_bytes + encrypted_bytes

        cipher = AESCipher(key)
        decrypted_message = cipher.decrypt(combined)

        return {
            'decrypted_data': decrypted_message,
            'success': True
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# Store encryption keys for sessions (in production, use secure key management)
encryption_keys = {}

@app.route('/api/encryption/generate-key', methods=['POST'])
def generate_encryption_key():
    """Generate a new AES encryption key for a session and encrypt it with client's RSA public key"""
    print('🔑 [GENERATE KEY] Request received...')

    # Get session data from request
    session_id = request.json.get('session_id')
    user_id = request.json.get('user_id')
    client_public_key = request.json.get('public_key')  # Client's RSA public key

    if not session_id or not user_id or not client_public_key or len(client_public_key) != 2:
        print('❌ [GENERATE KEY] Missing session ID, user ID, or invalid client public key')
        return jsonify({'success': False, 'error': 'Session ID, user ID, and valid client public key required'}), 400

    print(f'🔑 [GENERATE KEY] Generating AES-256 key for session: {session_id}')

    # Generate the AES encryption key
    aes_key = generate_key()

    # Convert AES key to base64 string for RSA encryption
    aes_key_b64 = base64.b64encode(aes_key).decode('utf-8')

    try:
        # Parse client's RSA public key [n_str, e_str] to integers
        n = int(client_public_key[0])
        e = int(client_public_key[1])
        client_public_key_int = (n, e)

        # Encrypt the AES key using client's RSA public key (simple char-by-char)
        rsa_encrypted_aes_key = rsa_encrypt_simple(aes_key_b64, client_public_key_int)
        print(f'🔐 [GENERATE KEY] AES key encrypted with client\'s RSA public key')
    except Exception as e:
        print(f'❌ [GENERATE KEY] RSA encryption failed: {e}')
        return jsonify({'success': False, 'error': 'Failed to encrypt AES key with RSA'}), 500

    # Store plain AES key in memory for fast access
    encryption_keys[session_id] = aes_key

    # Store in database for persistence (only store the base64 encoded AES key)
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()

            # Create session data JSON with AES key and algorithm info
            session_data = json.dumps({
                'encryption_key': aes_key_b64,
                'algorithm': 'AES-256-CBC',
                'session_id': session_id
            })

            # Insert into sessions table
            cursor.execute("""
                INSERT INTO sessions (id, user_id, session_data, created_at)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                session_data = VALUES(session_data),
                created_at = VALUES(created_at)
            """, (session_id, user_id, session_data, datetime.now()))

            conn.commit()
            cursor.close()

            print(f'💾 [GENERATE KEY] AES key stored in database for session: {session_id}')

        except mysql.connector.Error as err:
            print(f'❌ [GENERATE KEY] Database error: {err}')
            return jsonify({'success': False, 'error': f'Database error: {err}'}), 500
        finally:
            conn.close()

    print(f'✅ [GENERATE KEY] AES key generated, encrypted with RSA, and prepared for client')
    print(f'📊 [GENERATE KEY] Total active sessions: {len(encryption_keys)}')

    # Return the RSA-encrypted AES key to client
    return jsonify({
        'success': True,
        'encrypted_aes_key': str(rsa_encrypted_aes_key),  # RSA-encrypted AES key as string
        'session_id': session_id
    })

@app.route('/api/encryption/encrypt', methods=['POST'])
def encrypt_data():
    """Encrypt data using AES-256"""
    print('🔐 [ENCRYPT] Encryption request received...')
    data = request.json

    if not all(k in data for k in ['message', 'session_id']):
        print('❌ [ENCRYPT] Missing required fields: message or session_id')
        return jsonify({'success': False, 'error': 'Message and session_id required'}), 400

    session_id = data['session_id']
    message = data['message']

    if session_id not in encryption_keys:
        print(f'❌ [ENCRYPT] Invalid session: {session_id}')
        return jsonify({'success': False, 'error': 'Invalid session'}), 401

    print(f'🔐 [ENCRYPT] Encrypting {len(message)} characters for session: {session_id}')
    key = encryption_keys[session_id]
    result = encrypt_message(message, key)

    if result['success']:
        print('✅ [ENCRYPT] Encryption successful')
        return jsonify(result)
    else:
        print(f'❌ [ENCRYPT] Encryption failed: {result["error"]}')
        return jsonify(result), 500

@app.route('/api/encryption/decrypt', methods=['POST'])
def decrypt_data():
    """Decrypt data using AES-256"""
    print('🔓 [DECRYPT] Decryption request received...')
    data = request.json

    if not all(k in data for k in ['encrypted_data', 'iv', 'session_id']):
        print('❌ [DECRYPT] Missing required fields: encrypted_data, iv, or session_id')
        return jsonify({'success': False, 'error': 'Encrypted data, IV, and session_id required'}), 400

    session_id = data['session_id']
    encrypted_data = data['encrypted_data']
    iv = data['iv']

    # Check if key is in memory, otherwise load from database
    if session_id not in encryption_keys:
        print(f'🔑 [DECRYPT] Session {session_id} not in memory, loading from database...')
        key = load_session_key(session_id)
        if not key:
            print(f'❌ [DECRYPT] Session key not found in database: {session_id}')
            return jsonify({'success': False, 'error': 'Invalid session'}), 401
        encryption_keys[session_id] = key
        print(f'✅ [DECRYPT] Loaded key for session: {session_id}')
    else:
        key = encryption_keys[session_id]

    print(f'🔓 [DECRYPT] Decrypting data ({len(encrypted_data)} chars) for session: {session_id}')
    result = decrypt_message(encrypted_data, iv, key)

    if result['success']:
        print('✅ [DECRYPT] Decryption successful')
        return jsonify(result)
    else:
        print(f'❌ [DECRYPT] Decryption failed: {result["error"]}')
        return jsonify(result), 500


def load_session_key(session_id):
    """Load session key from database"""
    conn = get_db_connection()
    if not conn:
        return None

    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT session_data FROM sessions WHERE id = %s",
            (session_id,)
        )
        row = cursor.fetchone()
        if not row:
            return None

        import json
        session_data = json.loads(row[0])
        key_b64 = session_data.get('encryption_key')
        if key_b64:
            import base64
            key = base64.b64decode(key_b64)
            return key
        return None
    except Exception as e:
        print(f'❌ [LOAD SESSION KEY] Database error: {e}')
        return None
    finally:
        conn.close()

@app.route('/api/encryption/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    print('🏥 [HEALTH] Health check requested')
    active_sessions = len(encryption_keys)
    print(f'🏥 [HEALTH] Service healthy - {active_sessions} active encryption sessions')

    return jsonify({
        'status': 'healthy',
        'service': 'encryption-service',
        'active_sessions': active_sessions
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
