# 🍅 Tomatinho Pomodoro - Extensão para Navegadores

Uma extensão fofa, moderna e produtiva para navegadores baseados em Chromium, projetada para auxiliar no foco profundo, organização de tarefas e eliminação de distrações sem sobrecarregar sua mente.

---

## 🌟 Funcionalidades Incluídas

1. **⏱️ Temporizador & Core**:
   - Ciclos clássicos: **Foco (25 min)**, **Pausa Curta (5 min)** e **Pausa Longa (15 min a cada 4 ciclos)**.
   - Anel de progresso circular fluido com cores dinâmicas (vermelho no foco, verde no descanso).
   - **Badge inteligente no ícone do navegador**: exibe os minutos restantes diretamente na barra de ferramentas do navegador.
   - **Notificações nativas no Windows**: avisos do sistema quando o tempo acabar.
   - **Persistência total**: opera em segundo plano via `chrome.alarms` e `storage`, sem travar ou perder tempo mesmo ao fechar o popup.

2. **🚫 Bloqueador de Distrações (Website Blocker)**:
   - Bloqueio dinâmico com **Declarative Net Request** (super rápido e sem consumo de memória).
   - Botões de 1 clique para sites populares: **YouTube, X/Twitter, Instagram, Reddit, TikTok**.
   - Permite cadastrar qualquer domínio personalizado.
   - **Tela amigável do tomatinho (`blocked.html`)** com frases motivacionais e contador de tempo.
   - **Desbloqueio automático** durante as pausas ou quando o timer é pausado.

3. **✅ Gerenciador de Tarefas Integrado**:
   - Criação de metas com estimativa de pomodoros (🍅 1 a 6).
   - Botão para definir qual é a tarefa ativa (aparece destacada no temporizador).
   - Checkbox estilizado para marcar tarefas concluídas.

4. **🎵 Áudio Procedural (Web Audio API)**:
   - **Alarmes ao finalizar**:
     - *Sino Tibetano Zen 🥣* (som calmante de tigela meditativa).
     - *Bipe Harmonioso 🎵* (acorde suave ascendente).
     - *Marimba Acústica 🪵* (som amigável e percussivo).
   - **Som Ambiente contínuo durante o foco**:
     - *Chuva Suave 🌧️*
     - *Foco Cozy / Ruído Marrom ☕*
     - *Ondas do Mar 🌊*
   - Controle individual de volume e botão de teste rápido.

5. **🎨 Temas e Visual Bonitinho**:
   - Design minimalista, acolhedor e focado na produtividade.
   - Suporte a 3 temas: **Claro (Padrão Acolhedor)**, **Escuro (Dark Mode)** e **Pastel**.
   - Ícone de tomatinho com folhas verdes e bochechas rosadas.

6. **📊 Estatísticas e Ofensiva (Streaks)**:
   - Contador de dias seguidos focando (*Ofensiva 🔥*).
   - Total de pomodoros e tempo focado no dia de hoje.
   - Mini gráfico de barras com a produtividade dos últimos 7 dias.

---

## 🚀 Como Instalar no navegador (Passo a Passo)

A extensão é 100% nativa em HTML, CSS e JavaScript (Manifest V3) e **não requer instalação do Node.js nem build**:

1. Abra o seu navegador **navegador**.
2. Na barra de endereços, digite:
   ```text
   navegador://extensions
   ```
   *(ou acesse pelo menu do navegador no canto superior esquerdo: **Ferramentas** > **Extensões**)*.
3. No canto superior direito da página de extensões, ative a chave **"Modo do desenvolvedor"** (*Developer mode*).
4. Clique no botão **"Carregar sem compactação"** (*Load unpacked*) que aparecerá no canto superior esquerdo.
5. Navegue até a pasta da extensão e selecione-a:
   ```text
   C:\Users\LuísFernandodaConcei\.gemini\antigravity\scratch\pomodoro-extension
   ```
6. Pronto! O ícone do **Tomatinho 🍅** aparecerá na barra de ferramentas do seu navegador.
   - *Dica:* Clique no ícone de quebra-cabeça na barra do navegador e fixe o Tomatinho para tê-lo sempre à vista!

---

## 📁 Estrutura do Projeto

```
pomodoro-extension/
├── manifest.json            # Manifesto V3 com permissões seguras
├── background/
│   └── service-worker.js    # Gerenciador de alarmes, badge, bloqueador e regras DNR
├── offscreen/
│   ├── offscreen.html       # Documento offscreen para reprodução de áudio
│   └── audio.js             # Web Audio API sintetizada (alarmes e ruídos ambientes)
├── blocked/
│   ├── blocked.html         # Tela amigável de bloqueio
│   ├── blocked.css          # Estilo suave e motivacional da tela de bloqueio
│   └── blocked.js           # Contador em tempo real e citações inspiradoras
├── popup/
│   ├── popup.html           # Interface em abas (Timer, Tarefas, Bloqueador, Sons, Stats, Ajustes)
│   ├── popup.css            # Estilos com suporte a Dark Mode e tema Pastel
│   └── popup.js             # Sincronização em tempo real com o background
├── icons/
│   ├── tomato.svg           # Vetor original do Tomatinho
│   ├── icon-16.png          # Ícone para favicons/toolbar pequena
│   ├── icon-32.png          # Ícone para resolução padrão
│   ├── icon-48.png          # Ícone para gerenciador de extensões
│   └── icon-128.png         # Ícone de alta resolução para Chrome Web Store e notificações
└── README.md                # Este guia
```
