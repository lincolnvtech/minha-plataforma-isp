# app.py - VERSÃO 100% COMPLETA E FINAL
import json
from datetime import date, datetime
from decimal import Decimal
import os
import mysql.connector
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from routeros_api import RouterOsApiPool

# --- CONFIGURAÇÃO ---
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app, resources={r"/api/*": {"origins": "*"}})

DB_CONFIG = {
    'host': 'localhost',
    'user': 'isp_user',
    'password': 'LLfbq1601',
    'database': 'isp_manager'
}

MIKROTIK_HOST = '172.31.255.12'
MIKROTIK_PORT = 8729
MIKROTIK_USER = 'matrix_api'
MIKROTIK_PASSWORD = 'LLfbq1601'

# --- FUNÇÕES AUXILIARES ---
def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def default_converter(o):
    if isinstance(o, (date, datetime)): return o.isoformat()
    if isinstance(o, Decimal): return float(o)

def get_mikrotik_api():
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

@app.route('/api/usuarios', methods=['GET'])
def listar_usuarios():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, nome, email FROM usuarios ORDER BY id DESC")
        return jsonify(cursor.fetchall())
    except Exception as e: return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/api/usuarios', methods=['POST'])
def criar_usuario():
    dados = request.get_json()
    nome, email, senha = dados.get('nome'), dados.get('email'), dados.get('senha')
    if not all([nome, email, senha]): return jsonify({"erro": "Nome, email e senha sao obrigatorios"}), 400
    senha_hash = generate_password_hash(senha)
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO usuarios (nome, email, senha_hash) VALUES (%s, %s, %s)", (nome, email, senha_hash))
        conn.commit()
        return jsonify({"mensagem": "Usuario criado com sucesso!"}), 201
    except mysql.connector.Error as err:
        if conn: conn.rollback()
        if err.errno == 1062: return jsonify({"erro": "Este e-mail ja esta em uso."}), 409
        return jsonify({"erro": str(err)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/api/usuarios/<int:id>', methods=['PUT'])
def atualizar_usuario(id):
    dados = request.get_json()
    nome, email, senha = dados.get('nome'), dados.get('email'), dados.get('senha')
    if not nome or not email: return jsonify({"erro": "Nome e email sao obrigatorios"}), 400
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
        if cursor.rowcount == 0: return jsonify({"erro": "Usuario nao encontrado"}), 404
        conn.commit()
        return jsonify({"mensagem": "Usuario atualizado com sucesso!"}), 200
    except mysql.connector.Error as err:
        if conn: conn.rollback()
        if err.errno == 1062: return jsonify({"erro": "Este e-mail ja esta em uso por outro usuario."}), 409
        return jsonify({"erro": str(err)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/api/usuarios/<int:id>', methods=['DELETE'])
def deletar_usuario(id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM usuarios WHERE id = %s", (id,))
        if cursor.rowcount == 0: return jsonify({"erro": "Usuario nao encontrado"}), 404
        conn.commit()
        return jsonify({"mensagem": "Usuario deletado com sucesso!"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": "Erro ao deletar usuario."}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/api/planos', methods=['GET'])
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

@app.route('/api/planos', methods=['POST'])
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

@app.route('/api/planos/<int:id>', methods=['PUT'])
def atualizar_plano(id):
    dados = request.get_json()
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "UPDATE planos SET nome_plano = %s, velocidade_download = %s, velocidade_upload = %s, preco = %s, mikrotik_profile_name = %s WHERE id = %s"
        val = (dados['nome_plano'], dados['velocidade_download'], dados['velocidade_upload'], dados['preco'], dados['mikrotik_profile_name'], id)
        cursor.execute(sql, val)
        if cursor.rowcount == 0: return jsonify({"erro": "Plano nao encontrado"}), 404
        conn.commit()
        return jsonify({"mensagem": "Plano atualizado com sucesso!"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/api/planos/<int:id>', methods=['DELETE'])
def deletar_plano(id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM planos WHERE id = %s", (id,))
        if cursor.rowcount == 0: return jsonify({"erro": "Plano nao encontrado"}), 404
        conn.commit()
        return jsonify({"mensagem": "Plano deletado com sucesso!"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": "Erro ao deletar plano. Verifique se ele nao esta em uso."}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/api/clientes', methods=['GET'])
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

@app.route('/api/clientes/<int:id>', methods=['GET'])
def obter_cliente(id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM clientes WHERE id = %s", (id,))
        cliente = cursor.fetchone()
        if not cliente: return jsonify({"erro": "Cliente nao encontrado"}), 404
        response_body = json.dumps(cliente, default=default_converter)
        return app.response_class(response=response_body, status=200, mimetype='application/json')
    except Exception as e: return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

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

        try:
            api = get_mikrotik_api()
            ppp_secret = api.get_resource('/ppp/secret')
            ppp_secret.add(name=dados['login_pppoe'], password=dados['senha_pppoe'], service='pppoe', profile=plano['mikrotik_profile_name'])
        except Exception as e:
            print(f"ERRO MIKROTIK (ADICIONAR): {e}")
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

        try:
            api = get_mikrotik_api()
            ppp_secret = api.get_resource('/ppp/secret')
            secrets = ppp_secret.get(name=dados['login_pppoe'])
            if secrets:
                secret_id = secrets[0]['id']
                ppp_secret.set(id=secret_id, password=dados['senha_pppoe'])
        except Exception as e:
            print(f"ERRO MIKROTIK (ATUALIZAR): {e}")
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

        if login_pppoe_para_deletar:
            try:
                api = get_mikrotik_api()
                ppp_secret = api.get_resource('/ppp/secret')
                secrets = ppp_secret.get(name=login_pppoe_para_deletar)
                if secrets:
                    secret_id = secrets[0]['id']
                    ppp_secret.remove(id=secret_id)
            except Exception as e:
                print(f"ERRO MIKROTIK (DELETAR): {e}")
                pass

        return jsonify({"mensagem": "Cliente deletado com sucesso!"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": "Erro interno ao deletar cliente"}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

@app.route('/api/tickets', methods=['GET'])
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

@app.route('/api/tickets', methods=['POST'])
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

@app.route('/api/tickets/<int:id>/fechar', methods=['PUT'])
def fechar_ticket(id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "UPDATE tickets SET status = 'fechado', data_fechamento = NOW() WHERE id = %s"
        cursor.execute(sql, (id,))
        if cursor.rowcount == 0: return jsonify({"erro": "Ticket nao encontrado"}), 404
        conn.commit()
        return jsonify({"mensagem": "Ticket fechado com sucesso!"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

# --- Bloco para iniciar a aplicação ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
