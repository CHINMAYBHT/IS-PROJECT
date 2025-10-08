## How it works 
- client and server both need seperate private n public key for rsa.

- For msg exchange we use AES. AES is sym key cipher hence shared key. 

- Initially client verifies with the server using digital signature.

- To share this key we use RSA. In RSA we dont need to share anything, we create our private and public key, send our public key so that the other person can decrypt our msg and then send our msg using our public key. 

- The other person decrypts using the public key shared to them. 
    
- Then every session client sends his rsa key to the server, the server encrypts the aes key in it and sends it backt to client, client decrypts it using his private rsa key. 

- Next ready to exchange msg using RSA keys.


- Client sends msg using AES shared key, server decrypts and sends it to the model, gets response, encrypt using shared AES key, send to client. 

- Server stores in database by encrypting the msg again. 



## Hashing

- Use bcrypt/Argon2 for passwords (not MD5/SHA-1)
    - MD5 is completely broken (collision attacks since 2004)
    - SHA-1 is also considered cryptographically broken (practical collision attacks demonstrated in 2017)
    - store hashed, when client enters password, hash it and compare.
    - Argon2 is the winner of password hashing competition.
- Always salt your hashes
- Use HMAC for message authentication
- Store only hashed values, never raw data
- Use different salts for different users/messages










## What all implemented 


- Secure Key Exchange:
    - Asymmetric encryption is used first to securely exchange a symmetric key
    This combines the benefits of both: strong security of asymmetric with speed of symmetric



- Authentication:
    - Private keys can sign messages to prove identity
    - Public keys can verify these signatures
    - This ensures you're talking to the right server (not an imposter)



- Perfect Forward Secrecy:
    - Even if an attacker records encrypted traffic and later gets the private key, they can't decrypt past sessions
    Each session gets a new symmetric key



- Non-repudiation:
    - When you sign something with your private key, it serves as proof that you created it
    In your project, the flow is typically:


# Flow 

## 1. Initial Setup
- **Client** generates RSA key pair:
  - `public_key_client`
  - `private_key_client`
- **Server** generates RSA key pair:
  - `public_key_server`
  - `private_key_server`

## 2. Authentication & Key Exchange
1. Client connects to server
2. Server sends its public key to client
   - `server → client: public_key_server`
3. Client verifies server's identity (using certificates)
4. Client sends its public key to server
   - `client → server: public_key_client`
5. Server generates new AES session key
   - `AES_key = generate_AES_key()`
6. Server encrypts AES key with client's public key
   - `encrypted_AES = RSA_encrypt(AES_key, public_key_client)`
7. Server sends encrypted AES key to client
   - `server → client: encrypted_AES`
8. Client decrypts to get AES key
   - `AES_key = RSA_decrypt(encrypted_AES, private_key_client)`

## 3. Secure Message Exchange

### Client → Server
1. Client encrypts message:
   - `encrypted_msg = AES_encrypt(message, AES_key)`
2. Sends to server:
   - `client → server: encrypted_msg`
3. Server decrypts:
   - `message = AES_decrypt(encrypted_msg, AES_key)`

### Server → Client
1. Server gets response from LLM
2. Encrypts response:
   - `encrypted_response = AES_encrypt(response, AES_key)`
3. Sends to client:
   - `server → client: encrypted_response`
4. Client decrypts:
   - `response = AES_decrypt(encrypted_response, AES_key)`

## 4. Message Storage
- Server encrypts conversation:
  - `encrypted_storage = AES_encrypt(conversation, SERVER_STORAGE_KEY)`
- Stores in database

## 5. Session Management
- New session: Generate new `AES_key`
- Session resumption: Use existing session key
- Session end: Clear `AES_key` from memory

## 6. Security Features
- Perfect Forward Secrecy (new session key per session)
- End-to-end encryption for messages
- Server-side storage encryption
- Mutual authentication
- Secure key exchange
- Protection against replay attacks