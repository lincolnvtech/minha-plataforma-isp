from werkzeug.security import generate_password_hash
# Coloque a senha que você quer usar para logar
senha_plana = '1234'
hash_da_senha = generate_password_hash(senha_plana)
print(hash_da_senha)
