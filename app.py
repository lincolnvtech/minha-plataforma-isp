# app.py - Versão com Autenticação de Login
import json
from datetime import date, datetime
from decimal import Decimal
import telnetlib
import time

import mysql.connector
from flask import Flask, jsonify, request
from flask_cors import CORS
# Importações para hashing de senha
from werkzeug.security import generate_password_hash, check_password_hash

# --- CONFIGURAÇÃO ---
app = Flask(__name__)
CORS(app)

# ... (DB_CONFIG, MIKROTIK_CONFIG, etc. continuam iguais) ...
DB_CONFIG = {
    'host': 'localhost',
    'user': 'isp_user',
    'password': 'LLfbq1601',
    'database': 'isp_manager'
}

# --- FUNÇÕES AUXILIARES ---
def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def default_converter(o):
    if isinstance(o, (date, datetime)):
        return o.isoformat()
    if isinstance(o, Decimal):
        return float(o)

# --- NOVA ROTA DE LOGIN ---
@app.route('/login', methods=['POST'])
def login_usuario():
    dados = request.get_json()
    email = dados.get('email')
    senha = dados.get('senha')

    if not email or not senha:
        return jsonify({"erro": "Email e senha são obrigatórios"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM usuarios WHERE email = %s", (email,))
        usuario = cursor.fetchone()

        if not usuario or not check_password_hash(usuario['senha_hash'], senha):
            return jsonify({"erro": "Credenciais inválidas"}), 401

        # Login bem-sucedido
        return jsonify({
            "mensagem": "Login bem-sucedido!",
            "usuario": {"id": usuario['id'], "nome": usuario['nome'], "email": usuario['email']}
        }), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

# --- ROTAS DE CLIENTES, PLANOS, TICKETS ---
# ... (Todas as suas rotas existentes continuam aqui, sem nenhuma alteração) ...
# (GET /planos, POST /planos, GET /clientes, etc.)

# --- Bloco para iniciar a aplicação ---
if __name__ == '__main__':
    print("Iniciando servidor Flask...")
    app.run(host='0.0.0.0', port=5000, debug=True)
