# python-server/config.py
import os
from pathlib import Path

# Caminho seguro para credenciais
CREDENTIALS_DIR = Path(__file__).parent / "credentials"
FIREBASE_CREDENTIALS = CREDENTIALS_DIR / "firebase-adminsdk.json"

def get_firebase_credentials():
    if not FIREBASE_CREDENTIALS.exists():
        raise FileNotFoundError(
            f"Credenciais não encontradas em: {FIREBASE_CREDENTIALS}\n"
            f"Coloque o arquivo JSON do Firebase nesta pasta: {CREDENTIALS_DIR}"
        )
    
    return str(FIREBASE_CREDENTIALS)
