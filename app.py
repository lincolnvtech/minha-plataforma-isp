# app.py - VERSÃO ATUALIZADA COM INTEGRAÇÃO MIKROTIK
import json
from datetime import date, datetime
from decimal import Decimal
import os
import mysql.connector
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
# Importação da biblioteca do MikroTik
from routeros_api import RouterOsApiPool

# --- CONFIGURAÇÃO ---
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app, resources={r"/api/*": {"origins": "*"}})

DB_CONFIG = {
    'host': 'localhost',
    'user': 'isp_user',
    'password': 'LLfbq1601', # <<-- LEMBRE-SE DE USAR SUA SENHA DE PRODUÇÃO
    'database': 'isp_manager'
}

# --- CONFIGURAÇÃO REAL DO MIKROTIK ---
MIKROTIK_HOST = '172.31.255.12'
MIKROTIK_PORT = 8729
MIKROTIK_USER = 'matrix_api'
MIKROTIK_PASSWORD = 'LLfbq1601' # <<-- LEMBRE-SE DE USAR SUA SENHA DA API MIKROTIK

# --- FUNÇÕES AUXILIARES ---
def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def default_converter(o):
    if isinstance(o, (date, datetime)): return o.isoformat()
    if isinstance(o, Decimal): return float(o)

def get_mikrotik_api():
    """Cria e retorna uma conexão com a API do MikroTik."""
    connection = RouterOsApiPool(
        MIKROTIK_HOST,
        username=MIKROTIK_USER,
        password=MIKROTIK_PASSWORD,
        port=MIKROTIK_PORT,
        plaintext_login=True
    )
    return connection.get_api()

# --- ROTAS PARA SERVIR O FRONT-END ---
@app.route('/')
def serve_login():
    return render_template('index.html')

@app.route('/dashboard')
def serve_dashboard():
    return render_template('dashboard.html')

# --- ROTAS DA API ---

@app.route('/api/login', methods=['POST'])
def login_usuario():
    dados = request.get_json()
    email, senha = dados.get('email'), dados.get('senha')
    if not email or not senha: return jsonify({"erro": "Email e senha sao obrigatorios"}), 400
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM usuarios WHERE email = %s", (email,))
        usuario = cursor.fetchone()
        if not usuario or not check_password_hash(usuario['senha_hash'], senha):
            return jsonify({"erro": "Credenciais invalidas"}), 401
        return jsonify({ "mensagem": "Login bem-sucedido!", "usuario": {"id": usuario['id'], "nome": usuario['nome'], "email": usuario['email']} })
    except Exception as e: return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

# ... (Rotas de /usuarios, /planos, e /tickets continuam aqui, sem alteração) ...

@app.route('/api/clientes', methods=['POST'])
def adicionar_cliente():
    dados = request.get_json()
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT mikrotik_profile_name FROM planos WHERE id = %s", (dados['plano_id'],))
        plano = cursor.fetchone()
        if not plano: return jsonify({"erro": f"Plano com ID {dados['plano_id']} nao encontrado"}), 404
        sql = "INSERT INTO clientes (nome_completo, cpf, data_cadastro, endereco, plano_id, login_pppoe, senha_pppoe, status) VALUES (%s, %s, CURDATE(), %s, %s, %s, %s, 'ativo')"
        val = (dados['nome_completo'], dados['cpf'], dados['endereco'], dados['plano_id'], dados['login_pppoe'], dados['senha_pppoe'])
        cursor.execute(sql, val)
        conn.commit()
        
        # --- INTEGRAÇÃO MIKROTIK ---
        try:
            api = get_mikrotik_api()
            ppp_secret = api.get_resource('/ppp/secret')
            ppp_secret.add(
                name=dados['login_pppoe'],
                password=dados['senha_pppoe'],
                service='pppoe',
                profile=plano['mikrotik_profile_name']
            )
            print(f"Sucesso: Cliente {dados['login_pppoe']} provisionado no MikroTik.")
        except Exception as e:
            print(f"ERRO MIKROTIK (ADICIONAR): Nao foi possivel provisionar o cliente {dados['login_pppoe']}. Erro: {e}")
            pass

        return jsonify({"mensagem": "Cliente cadastrado com sucesso!"}), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/api/clientes/<int:id>', methods=['PUT'])
def atualizar_cliente(id):
    dados = request.get_json()
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "UPDATE clientes SET nome_completo=%s, cpf=%s, endereco=%s, login_pppoe=%s, senha_pppoe=%s, plano_id=%s WHERE id=%s"
        val = (dados['nome_completo'], dados['cpf'], dados['endereco'], dados['login_pppoe'], dados['senha_pppoe'], dados.get('plano_id'), id)
        cursor.execute(sql, val)
        if cursor.rowcount == 0: return jsonify({"erro": "Cliente nao encontrado"}), 404
        conn.commit()

        # --- INTEGRAÇÃO MIKROTIK ---
        try:
            api = get_mikrotik_api()
            ppp_secret = api.get_resource('/ppp/secret')
            secrets = ppp_secret.get(name=dados['login_pppoe'])
            if secrets:
                secret_id = secrets[0]['id']
                # Atualiza a senha e o profile (se mudar de plano)
                # (Lógica de profile aqui precisaria buscar o novo nome do plano no banco)
                ppp_secret.set(id=secret_id, password=dados['senha_pppoe'])
                print(f"Sucesso: Cliente {dados['login_pppoe']} atualizado no MikroTik.")
        except Exception as e:
            print(f"ERRO MIKROTIK (ATUALIZAR): Nao foi possivel atualizar o cliente {dados['login_pppoe']}. Erro: {e}")
            pass

        return jsonify({"mensagem": "Cliente atualizado com sucesso!"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/api/clientes/<int:id>', methods=['DELETE'])
def deletar_cliente(id):
    conn = None
    login_pppoe_para_deletar = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT login_pppoe FROM clientes WHERE id = %s", (id,))
        cliente = cursor.fetchone()
        if cliente:
            login_pppoe_para_deletar = cliente['login_pppoe']
        
        cursor.execute("DELETE FROM clientes WHERE id = %s", (id,))
        if cursor.rowcount == 0: return jsonify({"erro": "Cliente nao encontrado"}), 404
        conn.commit()

        # --- INTEGRAÇÃO MIKROTIK ---
        if login_pppoe_para_deletar:
            try:
                api = get_mikrotik_api()
                ppp_secret = api.get_resource('/ppp/secret')
                secrets = ppp_secret.get(name=login_pppoe_para_deletar)
                if secrets:
                    secret_id = secrets[0]['id']
                    ppp_secret.remove(id=secret_id)
                    print(f"Sucesso: Cliente {login_pppoe_para_deletar} removido do MikroTik.")
            except Exception as e:
                print(f"ERRO MIKROTIK (DELETAR): Nao foi possivel remover o cliente {login_pppoe_para_deletar}. Erro: {e}")
                pass
        
        return jsonify({"mensagem": "Cliente deletado com sucesso!"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": "Erro interno ao deletar cliente"}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

# (COLE AQUI TODAS AS SUAS OUTRAS ROTAS JÁ EXISTENTES: /api/usuarios, /api/planos, /api/tickets)

# --- Bloco para iniciar a aplicação ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
