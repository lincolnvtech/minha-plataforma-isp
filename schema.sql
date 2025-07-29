CREATE TABLE planos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_plano VARCHAR(100) NOT NULL,
    velocidade_upload INT NOT NULL,
    velocidade_download INT NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    mikrotik_profile_name VARCHAR(100) NOT NULL
);

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    data_cadastro DATE NOT NULL,
    endereco TEXT,
    plano_id INT,
    login_pppoe VARCHAR(100) UNIQUE NOT NULL,
    senha_pppoe VARCHAR(100) NOT NULL,
    status ENUM('ativo', 'bloqueado', 'desativado') DEFAULT 'ativo',
    confianca_usado_em DATE,
    FOREIGN KEY (plano_id) REFERENCES planos(id)
);
