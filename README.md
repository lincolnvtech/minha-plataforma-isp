# Matrix - Sistema de Gestão para Provedores (ISP)

Um painel de gestão completo para provedores de internet (ISP), desenvolvido do zero com Python, Flask e JavaScript, inspirado em sistemas como SGP, IXC e Hubsoft.

![Screenshot do Painel](URL_DA_SUA_IMAGEM_AQUI)
*Adicione um screenshot da sua aplicação aqui. Você pode fazer upload da imagem para o próprio repositório do GitHub e colar o link.*

---

## 🚀 Sobre o Projeto

O projeto **Matrix** foi criado para ser uma solução de gestão 100% customizável para provedores de internet, focando em simplicidade, robustez e controle total sobre o ambiente. Ele integra as principais funcionalidades administrativas e operacionais em uma interface web moderna e intuitiva.

## ✨ Funcionalidades

- **🔐 Autenticação:** Tela de login segura com senhas criptografadas (hash).
- **👤 Gestão de Usuários:** CRUD completo para os administradores do painel.
- **📋 Gestão de Planos:** CRUD completo para os planos de serviço (velocidade, preço, etc.).
- **👥 Gestão de Clientes:** CRUD completo para os assinantes do provedor.
- **🎫 Sistema de Tickets:** Funcionalidade para abrir, listar e fechar tickets de suporte.
- **🖥️ Interface SPA-like:** Navegação entre os módulos sem recarregar a página, com um visual profissional baseado em Bootstrap.

## 🛠️ Tecnologias Utilizadas

- **Backend:** Python 3, Flask, Gunicorn, Werkzeug
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5
- **Banco de Dados:** MariaDB (MySQL)
- **Servidor Web:** Nginx (Proxy Reverso)
- **Ambiente de Produção:** Debian 12, Systemd

---

## ⚙️ Guia de Instalação (Deploy)

Passos para instalar o projeto em um novo servidor Debian 12.

### 1. Pré-requisitos
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install git python3 python3-pip python3-venv mariadb-server nginx ufw -y
