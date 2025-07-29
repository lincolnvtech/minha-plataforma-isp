# app.py CORRIGIDO
import telnetlib
import time
from datetime import date, timedelta

import mysql.connector
from flask import Flask, jsonify, request
from flask_cors import CORS
from routeros_api import RouterOsApiPool

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

# --- MUDANÇA IMPORTANTE ---
# O pool de conexão do MikroTik FOI REMOVIDO DAQUI para não travar a inicialização.

# --- FUNÇÕES AUXILIARES ---
# ... (as funções auxiliares como get_db_connection e calcular_juros_multa continuam iguais) ...
def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

# --- ROTAS DA API ---

@app.route('/')
def index():
    return "<h1>API da Plataforma ISP no ar!</h1>"

@app.route('/clientes', methods=['POST'])
def adicionar_cliente():
    dados = request.get_json()
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT mikrotik_profile_name FROM planos WHERE id = %s", (dados['plano_id'],))
        plano = cursor.fetchone()
        if not plano:
            return jsonify({"erro": f"Plano com ID {dados['plano_id']} não encontrado"}), 404

        sql = "INSERT INTO clientes (nome_completo, cpf, data_cadastro, endereco, plano_id, login_pppoe, senha_pppoe) VALUES (%s, %s, CURDATE(), %s, %s, %s, %s)"
        val = (dados['nome_completo'], dados['cpf'], dados['endereco'], dados['plano_id'], dados['login_pppoe'], dados['senha_pppoe'])
        cursor.execute(sql, val)
        conn.commit()
        
        print(f"SUCESSO: Cliente {dados['nome_completo']} inserido no banco de dados.")

        # --- MUDANÇA AQUI ---
        # A conexão com o MikroTik é criada apenas quando esta função é chamada.
        try:
            pool_mikrotik = RouterOsApiPool(MIKROTIK_HOST, username=MIKROTIK_USER, password=MIKROTIK_PASSWORD, plaintext_login=True)
            api = pool_mikrotik.get_api()
            api.get_resource('/ppp/secret').add(name=dados['login_pppoe'], password=dados['senha_pppoe'], service='pppoe', profile=plano['mikrotik_profile_name'])
            pool_mikrotik.disconnect()
            print("Provisionamento no MikroTik (teste) tentado.")
        except Exception as e:
            print(f"AVISO ESPERADO: Falha ao provisionar no MikroTik de teste: {e}.")
        
        return jsonify({"mensagem": "Cliente cadastrado no banco de dados com sucesso!"}), 201

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

# ... (outras rotas como /olt/autorizar e /desbloqueio-confianca seguiriam o mesmo padrão) ...

# --- Bloco para iniciar a aplicação ---
if __name__ == '__main__':
    print("Iniciando servidor Flask...")
    # debug=True reinicia o servidor automaticamente quando você salva o arquivo.
    app.run(host='0.0.0.0', port=5000, debug=True)
