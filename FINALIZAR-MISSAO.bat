@echo off
chcp 65001 > nul
color 0B
cls

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║   LAR DE SAO FRANCISCO — FIM DA MISSAO                 ║
echo  ║   Enviando dados para a nuvem...                       ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ── Navega para a pasta do projeto ──────────────────────────
cd /d "%~dp0"

echo  IMPORTANTE: Este laptop precisa estar conectado a internet.
echo  Conecte ao WiFi normal (com internet) antes de continuar.
echo.
echo  Pressione qualquer tecla quando a internet estiver disponivel...
pause > nul
echo.

:: ╔══════════════════════════════════════════════════════════╗
:: ║ PASSO 1/2 — Sincronizar dados para a nuvem            ║
:: ╚══════════════════════════════════════════════════════════╝
echo  [1/2] Enviando dados da missao para a nuvem...
echo        (Aguarde — isso pode levar alguns minutos)
echo.
node --experimental-vm-modules scripts/sincronizar-pos-missao.js
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERRO] Falha ao sincronizar. Verifique a internet e tente novamente.
    echo  ** NAO DESLIGUE O LAPTOP antes de tentar novamente! **
    echo.
    pause
    exit /b 1
)
echo.
echo        OK  Dados sincronizados com sucesso!
echo.

:: ╔══════════════════════════════════════════════════════════╗
:: ║ PASSO 2/2 — Desligar hotspot WiFi                     ║
:: ╚══════════════════════════════════════════════════════════╝
echo  [2/2] Desligando rede WiFi da missao...
netsh wlan stop hostednetwork > nul 2>&1
echo        OK  Rede WiFi desligada.
echo.

echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                        ║
echo  ║   MISSAO CONCLUIDA!                                    ║
echo  ║                                                        ║
echo  ║   Todos os dados foram enviados para a nuvem.         ║
echo  ║   Pode fechar o emulador e desligar o laptop.         ║
echo  ║                                                        ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
pause
