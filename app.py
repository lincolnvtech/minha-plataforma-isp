# app.py - Versão com CRUD de Clientes, Tickets, Planos e Usuários (Corrigido)
import json
from datetime import date, datetime
from decimal import Decimal
import telnetlib
import time

import mysql.connector
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

# --- CONFIGURAÇÃO ---
app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    'host': 'localhost',
    'user': 'isp_user',
    'password': 'LLfbq1601',
    'database': 'isp_manager'
}

MIKROTIK_HOST = '127.0.0.1'
MIKROTIK_USER = 'api_user'
MIKROTIK_PASSWORD = 'senha_da_api'
OLT_HOST = "127.0.0.1"
OLT_USER = "admin"
OLT_PASSWORD = "senha_da_olt"

# --- FUNÇÕES AUXILIARES ---
def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def default_converter(o):
    if isinstance(o, (date, datetime)):
        return o.isoformat()
    if isinstance(o, Decimal):
        return float(o)

# --- ROTAS DA API ---

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

        # ESTA É A LINHA QUE FOI CORRIGIDA
        return jsonify({
            "mensagem": "Login bem-sucedido!",
            "usuario": {"id": usuario['id'], "nome": usuario['nome'], "email": usuario['email']}
        }), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

# --- ROTAS DE USUÁRIOS ---

@app.route('/usuarios', methods=['GET'])
def listar_usuarios():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, nome, email FROM usuarios ORDER BY id DESC")
        usuarios = cursor.fetchall()
        return jsonify(usuarios)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

@app.route('/usuarios', methods=['POST'])
def criar_usuario():
    dados = request.get_json()
    nome = dados.get('nome')
    email = dados.get('email')
    senha = dados.get('senha')

    if not nome or not email or not senha:
        return jsonify({"erro": "Nome, email e senha são obrigatórios"}), 400

    senha_hash = generate_password_hash(senha)
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "INSERT INTO usuarios (nome, email, senha_hash) VALUES (%s, %s, %s)"
        val = (nome, email, senha_hash)
        cursor.execute(sql, val)
        conn.commit()
        return jsonify({"mensagem": "Usuário criado com sucesso!"}), 201
    except mysql.connector.Error as err:
        if conn: conn.rollback()
        if err.errno == 1062:
            return jsonify({"erro": "Este e-mail já está em uso."}), 409
        return jsonify({"erro": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

@app.route('/usuarios/<int:id>', methods=['PUT'])
def atualizar_usuario(id):
    dados = request.get_json()
    nome = dados.get('nome')
    email = dados.get('email')
    senha = dados.get('senha')

    if not nome or not email:
        return jsonify({"erro": "Nome e email são obrigatórios"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if senha:
            senha_hash = generate_password_hash(senha)
            sql = "UPDATE usuarios SET nome = %s, email = %s, senha_hash = %s WHERE id = %s"
            val = (nome, email, senha_hash, id)
        else:
            sql = "UPDATE usuarios SET nome = %s, email = %s WHERE id = %s"
            val = (nome, email, id)
        
        cursor.execute(sql, val)
        if cursor.rowcount == 0:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        conn.commit()
        return jsonify({"mensagem": "Usuário atualizado com sucesso!"}), 200
    except mysql.connector.Error as err:
        if conn: conn.rollback()
        if err.errno == 1062:
            return jsonify({"erro": "Este e-mail já está em uso por outro usuário."}), 409
        return jsonify({"erro": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

@app.route('/usuarios/<int:id>', methods=['DELETE'])
def deletar_usuario(id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM usuarios WHERE id = %s", (id,))
        if cursor.rowcount == 0:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        conn.commit()
        return jsonify({"mensagem": "Usuário deletado com sucesso!"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": "Erro ao deletar usuário."}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

# --- ROTAS DE PLANOS, CLIENTES, TICKETS ---
# ... (O resto do código continua igual) ...

# --- Bloco para iniciar a aplicação ---
if __name__ == '__main__':
    print("Iniciando servidor Flask...")
    app.run(host='0.0.0.0', port=5000, debug=True)
