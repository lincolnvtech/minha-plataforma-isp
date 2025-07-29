# app.py - Versão Completa e Atualizada
import telnetlib
import time
from datetime import date, timedelta

import mysql.connector
from flask import Flask, jsonify, request
from flask_cors import CORS
from routeros_api import RouterOsApiPool

# --- CONFIGURAÇÃO ---
app = Flask(__name__)
CORS(app)  # Habilita o CORS para permitir requisições do front-end

# Configs do Banco de Dados Local
DB_CONFIG = {
    'host': 'localhost',
    'user': 'isp_user',
    'password': 'LLfbq1601',  # Use a senha correta que você definiu
    'database': 'isp_manager'
}

# --- ATENÇÃO: IPs de TESTE LOCAL ---
# No servidor de produção, você substituirá pelos IPs reais da sua rede.
MIKROTIK_HOST = '127.0.0.1'  # Em produção será: '172.31.255.12'
MIKROTIK_USER = 'api_user'
MIKROTIK_PASSWORD = 'senha_da_api'

OLT_HOST = "127.0.0.1"  # Em produção será: '10.10.250.2'
OLT_USER = "admin"
OLT_PASSWORD = "senha_da_olt"

# --- FUNÇÕES AUXILIARES ---

def get_db_connection():
    """Retorna uma nova conexão com o banco de dados."""
    return mysql.connector.connect(**DB_CONFIG)

def calcular_juros_multa(valor_original, data_vencimento, data_pagamento):
    """Calcula multa de 2% e juros de 0.033% ao dia."""
    if data_pagamento <= data_vencimento:
        return 0.0
    dias_atraso = (data_pagamento - data_vencimento).days
    multa = float(valor_original) * 0.02
    juros = float(valor_original) * 0.00033 * dias_atraso
    return round(multa + juros, 2)


# --- ROTAS DA API ---

@app.route('/')
def index():
    return "<h1>API da Plataforma ISP no ar!</h1>"


@app.route('/clientes', methods=['GET'])
def listar_clientes():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Query SQL para selecionar todos os clientes e juntar com o nome do plano
        query = """
            SELECT c.id, c.nome_completo, c.cpf, c.login_pppoe, c.status, p.nome_plano
            FROM clientes c
            LEFT JOIN planos p ON c.plano_id = p.id
            ORDER BY c.id DESC
        """
        cursor.execute(query)
        clientes = cursor.fetchall()
        return jsonify(clientes)

    except Exception as e:
        print(f"Erro ao listar clientes: {e}")
        return jsonify({"erro": "Erro interno ao buscar clientes"}), 500
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
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
        if not plano:
            return jsonify({"erro": f"Plano com ID {dados['plano_id']} não encontrado"}), 404

        sql = "INSERT INTO clientes (nome_completo, cpf, data_cadastro, endereco, plano_id, login_pppoe, senha_pppoe) VALUES (%s, %s, CURDATE(), %s, %s, %s, %s)"
        val = (dados['nome_completo'], dados['cpf'], dados['endereco'], dados['plano_id'], dados['login_pppoe'], dados['senha_pppoe'])
        cursor.execute(sql, val)
        conn.commit()
        
        print(f"SUCESSO: Cliente {dados['nome_completo']} inserido no banco de dados.")

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


@app.route('/olt/autorizar', methods=['POST'])
def autorizar_onu():
    dados = request.get_json()
    try:
        tn = telnetlib.Telnet(OLT_HOST, timeout=10)
        tn.read_until(b"Username: ")
        tn.write(OLT_USER.encode('ascii') + b"\n")
        tn.read_until(b"Password: ")
        tn.write(OLT_PASSWORD.encode('ascii') + b"\n")
        time.sleep(1)
        tn.write(b"enable\n")
        time.sleep(1)
        tn.write(b"config\n")
        time.sleep(1)
        
        comando_interface = f"interface gpon 0/{dados['pon_port']}\n".encode('ascii')
        tn.write(comando_interface)
        time.sleep(1)
        
        comando_autorizar = f"ont add {dados['ont_id']} mac {dados['mac_address']} ont-profile ont-profile-bridge\n".encode('ascii')
        tn.write(comando_autorizar)
        time.sleep(1)
        
        tn.write(b"exit\n")
        tn.write(b"exit\n")
        tn.write(b"exit\n")
        
        return jsonify({"mensagem": f"Comandos de autorização para MAC {dados['mac_address']} enviados para a OLT."}), 200
    except Exception as e:
        return jsonify({"erro": f"Falha na automação da OLT: {str(e)}"}), 500


@app.route('/clientes/<int:cliente_id>/desbloqueio-confianca', methods=['POST'])
def desbloqueio_confianca(cliente_id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT confianca_usado_em, login_pppoe, plano_id, status FROM clientes WHERE id = %s", (cliente_id,))
        cliente = cursor.fetchone()

        if not cliente: return jsonify({"erro": "Cliente não encontrado"}), 404
        if cliente['status'] != 'bloqueado': return jsonify({"erro": "Cliente não está bloqueado"}), 400
        
        hoje = date.today()
        if cliente['confianca_usado_em'] and cliente['confianca_usado_em'].month == hoje.month:
            return jsonify({"erro": "Desbloqueio em confiança já utilizado este mês."}), 403

        cursor.execute("SELECT mikrotik_profile_name FROM planos WHERE id = %s", (cliente['plano_id'],))
        plano = cursor.fetchone()
        if not plano: return jsonify({"erro": "Plano do cliente não encontrado"}), 500
        
        try:
            pool_mikrotik = RouterOsApiPool(MIKROTIK_HOST, username=MIKROTIK_USER, password=MIKROTIK_PASSWORD, plaintext_login=True)
            api = pool_mikrotik.get_api()
            ppp_secrets = api.get_resource('/ppp/secret')
            secret_list = ppp_secrets.get(name=cliente['login_pppoe'])
            if secret_list:
                secret_id = secret_list[0]['id']
                ppp_secrets.set(id=secret_id, profile=plano['mikrotik_profile_name'])
                pool_mikrotik.disconnect()
                
                cursor.execute("UPDATE clientes SET status = 'ativo', confianca_usado_em = %s WHERE id = %s", (hoje, cliente_id))
                conn.commit()
                return jsonify({"mensagem": "Sua conexão foi reestabelecida temporariamente."})
            else:
                return jsonify({"erro": "Falha ao comunicar com o servidor."}), 500
        except Exception as e:
            print(f"AVISO: Falha ao desbloquear no MikroTik de teste: {e}.")
            return jsonify({"erro": "Falha ao comunicar com o servidor."}), 500
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- Bloco para iniciar a aplicação ---
if __name__ == '__main__':
    print("Iniciando servidor Flask...")
    app.run(host='0.0.0.0', port=5000, debug=True)
