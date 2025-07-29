# app.py
from flask import Flask, request, jsonify
import mysql.connector
from routeros_api import RouterOsApiPool
# import telnetlib # Descomente quando for testar a OLT
# from datetime import date, timedelta # Descomente para usar as funções de data

# --- CONFIGURAÇÃO ---
app = Flask(__name__)

# Configs do Banco de Dados Local
DB_CONFIG = {
    'host': 'localhost',
    'user': 'isp_user',
    'password': 'LLfbq1601', # A senha que você criou para o isp_user
    'database': 'isp_manager'
}

# --- ATENÇÃO ---
# IPs para o ambiente de TESTE LOCAL.
# A aplicação tentará conectar, mas falhará sem a VPN. Isso é esperado.
# No servidor de produção, você substituirá pelos IPs reais.
MIKROTIK_HOST = '127.0.0.1' # IP de exemplo
MIKROTIK_USER = 'api_user'
MIKROTIK_PASSWORD = 'senha_da_api'

OLT_HOST = "127.0.0.1" # IP de exemplo
OLT_USER = "admin"
OLT_PASSWORD = "senha_da_olt"

# --- ROTAS DA API ---

@app.route('/')
def index():
    return "API da Plataforma ISP no ar!"

@app.route('/clientes', methods=['POST'])
def adicionar_cliente():
    dados = request.get_json()
    conn = None
    try:
        # Conecta ao banco de dados local
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        # Busca o plano para obter o nome do profile do MikroTik
        cursor.execute("SELECT mikrotik_profile_name FROM planos WHERE id = %s", (dados['plano_id'],))
        plano = cursor.fetchone()
        if not plano:
            return jsonify({"erro": f"Plano com ID {dados['plano_id']} não encontrado"}), 404

        # Insere o novo cliente no banco de dados
        sql = "INSERT INTO clientes (nome_completo, cpf, data_cadastro, endereco, plano_id, login_pppoe, senha_pppoe) VALUES (%s, %s, CURDATE(), %s, %s, %s, %s)"
        val = (dados['nome_completo'], dados['cpf'], dados['endereco'], dados['plano_id'], dados['login_pppoe'], dados['senha_pppoe'])
        cursor.execute(sql, val)
        conn.commit()
        
        print(f"SUCESSO: Cliente {dados['nome_completo']} inserido no banco de dados com ID: {cursor.lastrowid}")

        # Tenta provisionar no MikroTik (vai falhar no ambiente de teste, o que é OK)
        try:
            pool_mikrotik = RouterOsApiPool(MIKROTIK_HOST, username=MIKROTIK_USER, password=MIKROTIK_PASSWORD, plaintext_login=True)
            api = pool_mikrotik.get_api()
            api.get_resource('/ppp/secret').add(name=dados['login_pppoe'], password=dados['senha_pppoe'], service='pppoe', profile=plano['mikrotik_profile_name'])
            pool_mikrotik.disconnect()
            print(f"AVISO: Conexão com MikroTik de teste bem-sucedida (isso não deveria acontecer sem VPN).")
        except Exception as e:
            print(f"AVISO ESPERADO: Falha ao conectar ao MikroTik de teste: {e}. O cliente FOI salvo no banco.")

        return jsonify({"mensagem": "Cliente cadastrado no banco de dados com sucesso!"}), 201

    except Exception as e:
        if conn: conn.rollback() # Desfaz a operação no banco em caso de erro
        print(f"ERRO GERAL: {e}")
        return jsonify({"erro": str(e)}), 500
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

# --- Bloco para iniciar a aplicação ---
if __name__ == '__main__':
    # Roda a API na rede local, na porta 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
