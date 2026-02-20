@echo off
chcp 65001 > nul
color 0A
cls

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║   LAR DE SAO FRANCISCO — MODO MISSAO OFFLINE            ║
echo  ║   Preparando o laptop para a missao...                  ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ── Navega para a pasta do projeto ──────────────────────────
cd /d "%~dp0"

:: ── Verifica Privilégios de Administrador ────────────────────
net session >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERRO] Este script precisa ser executado como ADMINISTRADOR.
    echo.
    echo  1. Feche esta janela.
    echo  2. Clique com o botao DIREITO no arquivo.
    echo  3. Selecione "Executar como administrador".
    echo.
    pause
    exit /b 1
)

:: ── Verifica se Node.js está instalado ──────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERRO] Node.js nao encontrado!
    echo  Instale em: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: ── Verifica Java (Necessário para Firestore/Auth) ────────────────
where java >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERRO] Java nao encontrado!
    echo  O emulador precisa do Java (JRE ou JDK) instalado.
    echo  Baixe em: https://java.com/pt-BR/download/
    echo.
    pause
    exit /b 1
)

:: ╔══════════════════════════════════════════════════════════╗
:: ║ PASSO 1/4 — Criar Hotspot WiFi                         ║
:: ╚══════════════════════════════════════════════════════════╝
echo  [1/4] Criando rede WiFi da missao...
netsh wlan set hostednetwork mode=allow ssid="MissaoLSF" key="missao2024" > nul 2>&1
netsh wlan start hostednetwork > nul 2>&1

:: Verifica se o hotspot foi criado
netsh wlan show hostednetwork | findstr /i "Started" > nul 2>&1
if %errorlevel% equ 0 (
    echo        OK  Rede WiFi "MissaoLSF" ativa  Senha: missao2024
) else (
    echo        AVISO: Hotspot pode precisar ser ativado manualmente em:
    echo              Configuracoes ^> Rede e Internet ^> Hotspot Movel
)
echo.

:: ── Configura Firewall (Porta 5000: Hosting, 8080: Firestore, 9099: Auth) ──
echo  [Config] Liberando portas no firewall...
netsh advfirewall firewall add rule name="Firebase Local" dir=in action=allow protocol=TCP localport=5000,8080,9099 > nul 2>&1
echo.

:: ╔══════════════════════════════════════════════════════════╗
:: ║ PASSO 2/4 — Exportar dados da nuvem                    ║
:: ╚══════════════════════════════════════════════════════════╝
echo  [2/4] Baixando dados atuais da nuvem...
echo        (Aguarde — isso pode levar 1-2 minutos)
echo.
node --experimental-vm-modules scripts/exportar-missao.js
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERRO] Falha ao exportar dados. Verifique a internet e tente novamente.
    echo.
    pause
    exit /b 1
)
echo.
echo        OK  Dados exportados com sucesso!
echo.

:: ╔══════════════════════════════════════════════════════════╗
:: ║ PASSO 3/4 — Importar dados para o servidor local       ║
:: ╚══════════════════════════════════════════════════════════╝
echo  [3/4] Preparando o servidor local com os dados...
node --experimental-vm-modules scripts/importar-para-emulador.js
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERRO] Falha ao importar dados. Verifique o arquivo de backup.
    echo.
    pause
    exit /b 1
)
echo.
echo        OK  Dados prontos no servidor local!
echo.

:: ╔══════════════════════════════════════════════════════════╗
:: ║ PASSO 4/4 — Iniciar servidor Firebase local            ║
:: ╚══════════════════════════════════════════════════════════╝
echo  [4/4] Iniciando servidor local (Firebase Emulator)...
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                        ║
echo  ║   MISSAO PRONTA!                                       ║
echo  ║                                                        ║
echo  ║   WiFi: MissaoLSF     Senha: missao2024               ║
echo  ║   Acesse nos Tablets:                                  ║
echo  ║   http://192.168.137.1:5000                            ║
echo  ║                                                        ║
echo  ║   ** NAO FECHE ESTA JANELA DURANTE A MISSAO **         ║
echo  ║   (fechar desliga o servidor)                          ║
echo  ║                                                        ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  1. Conecte os tablets no WiFi "MissaoLSF"
echo  2. Abra o Chrome e digite: http://192.168.137.1:5000
echo.

echo  O sistema abrira o Painel de Controle automaticamente em 20 segundos...
echo.

:: Abre o navegador automaticamente após 20 segundos (tempo para o emulador iniciar)
start /min cmd /c "timeout /t 20 >nul && start http://localhost:5000/mission-control"

:: Mantém o emulador rodando (esta janela fica aberta)
call npx firebase-tools emulators:start

:: Se o emulador fechar por erro, pausa para ler a mensagem
echo.
echo  [AVISO] O servidor parou. Verifique se houve algum erro acima.
echo.
pause
