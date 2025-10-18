from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes

class AESCipher:
    def __init__(self,key):
        self.key=key

    def encrypt(self,plaintext):
        iv=get_random_bytes(16)
        padded_msg=pad(plaintext.encode(),AES.block_size)
        cipher=AES.new(self.key,AES.MODE_CBC,iv)
        ciphertext=cipher.encrypt(padded_msg)
        return iv+ciphertext

    def decrypt(self,ciphertext):
        iv=ciphertext[:16]
        actual_ciphertext=ciphertext[16:]
        cipher=AES.new(self.key,AES.MODE_CBC,iv)
        decrypted_msg=cipher.decrypt(actual_ciphertext)
        plaintext=unpad(decrypted_msg,AES.block_size)
        return plaintext.decode()
