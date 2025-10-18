from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from Crypto.Hash import SHA256
import base64

# Generate RSA key pair
def generate_keys(key_size=2048):
    key = RSA.generate(key_size)
    return key

# Create RSA public key from n and e integers
def rsa_public_key_from_ne(n, e):
    component = RSA.construct((int(n), int(e)))
    return component

# Encrypt message with OAEP padding using RSA public key (n, e)
def rsa_encrypt(message, public_key_tuple):
    n, e = public_key_tuple
    pub_key = rsa_public_key_from_ne(n, e)
    cipher = PKCS1_OAEP.new(pub_key, hashAlgo=SHA256)
    message_bytes = message.encode('utf-8')
    encrypted_bytes = cipher.encrypt(message_bytes)
    # Convert to integer for compatibility with existing code
    c = int.from_bytes(encrypted_bytes, 'big')
    return c

# Decrypt message with OAEP padding using RSA private key (n, d)
def rsa_decrypt(encrypted_int, private_key_tuple):
    n, d = private_key_tuple
    priv_key = RSA.construct((int(n), int(d)))
    cipher = PKCS1_OAEP.new(priv_key, hashAlgo=SHA256)
    # Convert back to bytes
    encrypted_bytes = encrypted_int.to_bytes((encrypted_int.bit_length() + 7) // 8, 'big')
    decrypted_bytes = cipher.decrypt(encrypted_bytes)
    return decrypted_bytes.decode('utf-8')
