from werkzeug.security import generate_password_hash

# ↓↓↓↓ COLOQUE A SENHA QUE VOCÊ VAI USAR PARA LOGAR AQUI ↓↓↓↓
senha_plana = 'LLfbq1601'

hash_da_senha = generate_password_hash(senha_plana)
print(hash_da_senha)
