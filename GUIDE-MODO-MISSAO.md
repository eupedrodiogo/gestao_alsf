# Modo Missão (Simples e Automático)

Este modo permite usar o sistema sem internet, conectando os tablets diretamente ao Laptop Coordenador.

## 1. Laptop Coordenador (Início)
1. Execute o arquivo **`INICIAR-MISSAO.bat`**.
2. **Aguarde cerca de 20 segundos**. O sistema irá preparar tudo.
3. **Automaticamente**, o navegador abrirá com o **Painel de Controle da Missão**.
4. Mantenha a janela preta aberta (ela é o servidor).

**No Painel de Controle, você verá:**
- Nome da Rede Wi-Fi (`MissaoLSF`) e Senha (`missao2024`).
- Endereço para os tablets (`http://192.168.137.1:5000`).
- Status do servidor.

## 2. Tablets (Voluntários)
1. Conecte no Wi-Fi **"MissaoLSF"**.
2. Abra o Google Chrome.
3. Digite o endereço exibido no Painel de Controle (ex: `http://192.168.137.1:5000`).

## 3. Finalizar
1. No Laptop, execute o arquivo **`FINALIZAR-MISSAO.bat`** (disponível na pasta do projeto).
2. Isso salvará todos os dados capturados e desligará o servidor.
