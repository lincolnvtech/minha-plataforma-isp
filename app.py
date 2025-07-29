# app.py - VERSÃO DEFINITIVA COM TODAS AS ROTAS
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

DB_CONFIG = { 'host': 'localhost', 'user': 'isp_user', 'password': 'LLfbq1601', 'database': 'isp_manager' }

# --- FUNÇÃO AUXILIAR DE CONVERSÃO JSON ---
def default_converter(o):
    if isinstance(o, (date, datetime)): return o.isoformat()
    if isinstance(o, Decimal): return float(o)

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

# --- ROTA DE LOGIN ---
@app.route('/login', methods=['POST'])
def login_usuario():
    dados = request.get_json()
    email = dados.get('email')
    senha = dados.get('senha')
    if not email or not senha: return jsonify({"erro": "Email e senha são obrigatórios"}), 400
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM usuarios WHERE email = %s", (email,))
        usuario = cursor.fetchone()
        if not usuario or not check_password_hash(usuario['senha_hash'], senha):
            return jsonify({"erro": "Credenciais inválidas"}), 401
        return jsonify({ "mensagem": "Login bem-sucedido!", "usuario": {"id": usuario['id'], "nome": usuario['nome'], "email": usuario['email']} }), 200
    except Exception as e: return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

# --- ROTAS DE PLANOS ---
@app.route('/planos', methods=['GET'])
def listar_planos():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM planos ORDER BY id DESC")
        planos = cursor.fetchall()
        response_body = json.dumps(planos, default=default_converter)
        return app.response_class(response=response_body, status=200, mimetype='application/json')
    except Exception as e: return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/planos', methods=['POST'])
def criar_plano():
    dados = request.get_json()
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "INSERT INTO planos (nome_plano, velocidade_download, velocidade_upload, preco, mikrotik_profile_name) VALUES (%s, %s, %s, %s, %s)"
        val = (dados['nome_plano'], dados['velocidade_download'], dados['velocidade_upload'], dados['preco'], dados['mikrotik_profile_name'])
        cursor.execute(sql, val)
        conn.commit()
        return jsonify({"mensagem": "Plano criado com sucesso!"}), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/planos/<int:id>', methods=['PUT'])
def atualizar_plano(id):
    dados = request.get_json()
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "UPDATE planos SET nome_plano = %s, velocidade_download = %s, velocidade_upload = %s, preco = %s, mikrotik_profile_name = %s WHERE id = %s"
        val = (dados['nome_plano'], dados['velocidade_download'], dados['velocidade_upload'], dados['preco'], dados['mikrotik_profile_name'], id)
        cursor.execute(sql, val)
        if cursor.rowcount == 0: return jsonify({"erro": "Plano não encontrado"}), 404
        conn.commit()
        return jsonify({"mensagem": "Plano atualizado com sucesso!"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/planos/<int:id>', methods=['DELETE'])
def deletar_plano(id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM planos WHERE id = %s", (id,))
        if cursor.rowcount == 0: return jsonify({"erro": "Plano não encontrado"}), 404
        conn.commit()
        return jsonify({"mensagem": "Plano deletado com sucesso!"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": "Erro ao deletar plano. Verifique se ele não está em uso."}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

# --- ROTAS DE CLIENTES ---
@app.route('/clientes', methods=['GET'])
def listar_clientes():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = "SELECT c.id, c.nome_completo, c.cpf, c.login_pppoe, c.status, p.nome_plano FROM clientes c LEFT JOIN planos p ON c.plano_id = p.id ORDER BY c.id DESC"
        cursor.execute(query)
        clientes = cursor.fetchall()
        response_body = json.dumps(clientes, default=default_converter)
        return app.response_class(response=response_body, status=200, mimetype='application/json')
    except Exception as e: return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/clientes/<int:id>', methods=['GET'])
def obter_cliente(id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM clientes WHERE id = %s", (id,))
        cliente = cursor.fetchone()
        if not cliente: return jsonify({"erro": "Cliente não encontrado"}), 404
        response_body = json.dumps(cliente, default=default_converter)
        return app.response_class(response=response_body, status=200, mimetype='application/json')
    except Exception as e: return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/clientes', methods=['POST'])
def adicionar_cliente():
    dados = request.get_json()
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT mikrotik_profile_name FROM planos WHERE id = %s", (dados['plano_id'],))
        plano = cursor.fetchone()
        if not plano: return jsonify({"erro": f"Plano com ID {dados['plano_id']} não encontrado"}), 404
        sql = "INSERT INTO clientes (nome_completo, cpf, data_cadastro, endereco, plano_id, login_pppoe, senha_pppoe) VALUES (%s, %s, CURDATE(), %s, %s, %s, %s)"
        val = (dados['nome_completo'], dados['cpf'], dados['endereco'], dados['plano_id'], dados['login_pppoe'], dados['senha_pppoe'])
        cursor.execute(sql, val)
        conn.commit()
        return jsonify({"mensagem": "Cliente cadastrado no banco de dados com sucesso!"}), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/clientes/<int:id>', methods=['PUT'])
def atualizar_cliente(id):
    dados = request.get_json()
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "UPDATE clientes SET nome_completo=%s, cpf=%s, endereco=%s, login_pppoe=%s, senha_pppoe=%s, plano_id=%s WHERE id=%s"
        val = (dados['nome_completo'], dados['cpf'], dados['endereco'], dados['login_pppoe'], dados['senha_pppoe'], dados['plano_id'], id)
        cursor.execute(sql, val)
        if cursor.rowcount == 0: return jsonify({"erro": "Cliente não encontrado"}), 404
        conn.commit()
        return jsonify({"mensagem": "Cliente atualizado com sucesso!"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/clientes/<int:id>', methods=['DELETE'])
def deletar_cliente(id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM clientes WHERE id = %s", (id,))
        if cursor.rowcount == 0: return jsonify({"erro": "Cliente não encontrado"}), 404
        conn.commit()
        return jsonify({"mensagem": "Cliente deletado com sucesso!"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": "Erro interno ao deletar cliente"}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

# --- ROTAS DE TICKETS ---
@app.route('/tickets', methods=['GET'])
def listar_tickets():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = "SELECT t.id, t.assunto, t.status, t.data_abertura, c.nome_completo as cliente_nome FROM tickets t JOIN clientes c ON t.cliente_id = c.id ORDER BY t.id DESC"
        cursor.execute(query)
        tickets = cursor.fetchall()
        response_body = json.dumps(tickets, default=default_converter)
        return app.response_class(response=response_body, status=200, mimetype='application/json')
    except Exception as e: return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/tickets', methods=['POST'])
def abrir_ticket():
    dados = request.get_json()
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "INSERT INTO tickets (cliente_id, assunto, mensagem, data_abertura) VALUES (%s, %s, %s, NOW())"
        val = (dados['cliente_id'], dados['assunto'], dados['mensagem'])
        cursor.execute(sql, val)
        conn.commit()
        return jsonify({"mensagem": "Ticket aberto com sucesso!"}), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/tickets/<int:id>/fechar', methods=['PUT'])
def fechar_ticket(id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "UPDATE tickets SET status = 'fechado', data_fechamento = NOW() WHERE id = %s"
        cursor.execute(sql, (id,))
        if cursor.rowcount == 0: return jsonify({"erro": "Ticket não encontrado"}), 404
        conn.commit()
        return jsonify({"mensagem": "Ticket fechado com sucesso!"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

# --- Bloco para iniciar a aplicação ---
if __name__ == '__main__':
    print("Iniciando servidor Flask...")
    app.run(host='0.0.0.0', port=5000, debug=True)
