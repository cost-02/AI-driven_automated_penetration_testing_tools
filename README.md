# AI-Driven Automated Penetration Testing — Reproducibility Package

Questo pacchetto consente di replicare le sperimentazioni condotte per il progetto **AI-driven automated penetration testing tools**.

L’obiettivo è valutare sei framework di penetration testing basati su agenti LLM:
1. PentestGPT
2. Strix
3. Shannon
4. PentAGI
5. CAI
6. BugTraceAI-CLI / BugTraceAI-WEB

Tutti i test sono stati eseguiti esclusivamente contro un’istanza locale e isolata di **OWASP Juice Shop**.

> ***Avvertenza etica e legale***
> * *Questo materiale è destinato esclusivamente a laboratori autorizzati, macchine virtuali locali o applicazioni volutamente vulnerabili di cui si possiede il controllo.*
> * *Non utilizzare questi strumenti contro sistemi di terzi senza autorizzazione esplicita.*

---

## 1. Ambiente di riferimento

I test originali sono stati eseguiti con la seguente configurazione:

| **Componente** | **Configurazione** |
| :--- | :--- |
| Sistema operativo | Windows 11 |
| Ambiente Linux | WSL2 — Ubuntu 24.04 |
| Containerizzazione | Docker Desktop |
| CPU | AMD Ryzen 5 5600X |
| GPU | AMD Radeon RX 6650 XT, 8 GB VRAM |
| RAM | 32 GB |
| Runtime LLM locale | Ollama |
| Provider cloud aggiuntivo | OpenRouter, solo per BugTraceAI |
| Target | OWASP Juice Shop |

### Modelli locali utilizzati

| **Modello** | **Modalità di esecuzione** | **Note** |
| :--- | :--- | :--- |
| `qwen2.5-coder:7b` | Interamente in VRAM | Circa 29,87 token/s |
| `qwen2.5-coder:14b` | Offloading ibrido GPU/RAM | Circa 10,86 token/s |

### Configurazione BugTraceAI

BugTraceAI è stato testato **esclusivamente tramite OpenRouter**, utilizzando il modello gratuito:

```text
cohere/north-mini-code:free
```

Il tentativo di configurazione di BugTraceAI con Ollama non è stato completato a causa di limiti di compatibilità del framework. Pertanto, non esistono risultati sperimentali per la combinazione BugTraceAI + Ollama.

---

## 2. Prerequisiti

Prima di iniziare, installare e configurare:
1. **Windows 11**
2. **WSL2**
3. **Ubuntu 24.04** da Microsoft Store
4. **Docker Desktop**, con integrazione WSL2 attiva
5. **Ollama per Windows**
6. **Git**
7. **Python 3.10+** o **Python 3.12+**, secondo i requisiti dei singoli tool
8. **Node.js 22+** e **npm**, necessari per alcuni framework

Verificare che Docker sia operativo:

```powershell
docker --version
docker compose version
```

Verificare che Ollama sia operativo:

```powershell
ollama --version
ollama list
```

---

## 3. Scaricare i modelli locali

Aprire PowerShell ed eseguire:

```powershell
ollama pull qwen2.5-coder:7b
ollama pull qwen2.5-coder:14b
```

Verificare che i modelli siano presenti:

```powershell
ollama list
```

Output atteso:

```text
qwen2.5-coder:7b
qwen2.5-coder:14b
```

---

## 4. Avviare il laboratorio Docker

Posizionarsi nella cartella `docker/` del pacchetto:

```powershell
cd .\docker
```

Copiare il file di configurazione di esempio:

```powershell
Copy-Item .env.example .env
```

Avviare il target:

```powershell
docker compose up -d
```

Verificare che il container sia attivo:

```powershell
docker compose ps
```

Output atteso:

```text
lab-target   running   127.0.0.1:3000->3000/tcp
```

Verificare che OWASP Juice Shop risponda:

```powershell
curl.exe -I http://localhost:3000
```

Output atteso:

```text
HTTP/1.1 200 OK
```

Il target è ora disponibile all’indirizzo:

```text
http://localhost:3000
```

Dall’interno dei container Docker, il target è raggiungibile tramite:

```text
[http://host.docker.internal:3000](http://host.docker.internal:3000)
```

---

## 5. Verificare la comunicazione con Ollama

Verificare che Ollama risponda dall’host:

```powershell
curl.exe http://localhost:11434/api/tags
```

Verificare l’endpoint compatibile OpenAI:

```powershell
curl.exe http://localhost:11434/v1/models
```

Se i comandi restituiscono un errore, assicurarsi che Ollama sia in esecuzione e che sia configurato per accettare connessioni da WSL2 e Docker.

---

## 6. Esecuzione dei test

### 6.1 Strix

Posizionarsi nella cartella del progetto:

```powershell
cd ..\configs\strix
```

Consultare il file:

```text
strix-ollama-config.md
```

Avviare Strix con il modello 7B:

```powershell
strix scan --target http://localhost:3000 --model qwen2.5-coder:7b
```

Avviare Strix con il modello 14B:

```powershell
strix scan --target http://localhost:3000 --model qwen2.5-coder:14b
```

Log e output nella cartella:

```text
results-logs\failed-runs\strix
```

---

### 6.2 PentestGPT (Modalità Human-in-the-Loop)

*Nota metodologica:* La sperimentazione con i modelli locali (7B e 14B) documentata nel progetto (Cap. 4.2.3 della tesi) è stata condotta in modalità **Human-in-the-Loop (HITL)**. In questa configurazione, l'operatore umano agisce come *Parsing Module*, eseguendo i comandi suggeriti dall'agente e restituendo output sanitizzati per evitare il *context overflow* del modello.

Creare e attivare un ambiente virtuale Python:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Installare PentestGPT:

```powershell
pip install pentestgpt
```

Configurare le variabili d’ambiente per Ollama (esempio con modello 14B, replicabile con `qwen2.5-coder:7b`):

```powershell
$env:OPENAI_API_KEY="ollama"
$env:OPENAI_API_BASE="http://localhost:11434/v1"
$env:OPENAI_MODEL="qwen2.5-coder:14b"
```

Avviare PentestGPT:

```powershell
pentestgpt
```

**Procedura operativa HITL:**
1. Al prompt iniziale, fornire un contesto strutturato che definisca lo scope (`http://localhost:3000`), i vincoli non-distruttivi e la regola di attendere l'output dell'operatore (vedi `prompt.txt`).
2. Quando il tool richiede l'esecuzione di un comando (es. `nmap` o `curl`), eseguirlo nel terminale di sistema.
3. **Sanitizzare l'output** (rimuovendo il rumore esadecimale, gli header irrilevanti o il codice HTML grezzo) per preservare il contesto del modello.
4. Reinserire l'output pulito nel tool selezionando l'opzione `user-comments` quando richiesto dal parser.

*Artefatto prodotto:* La sessione guidata di successo con il modello 14B è salvata integralmente nel file di log `\results-logs\pentestgpt\14b_ps`. Questo artefatto documenta la validazione della vulnerabilità di *Information Disclosure / Sensitive Data Exposure* su `/ftp/acquisitions.md` e il successivo fenomeno di "meta-loop" del modello 14B nella fase finale di generazione del report (in cui il PTT viene marcato come completato ma il corpo del report in Markdown non viene generato). La replica della medesima sessione guidata con il modello 7B ha confermato la vulnerabilità ma ha evidenziato fenomeni precoci di *amnesia contestuale* e *context bleeding*, con rottura del protocollo di stato e regressione a task di ricognizione già completati, come discusso nelle Sezioni 4.2.3 e 4.4.2 della documentazione.

---

### 6.3 Shannon

Shannon deve essere eseguito da **WSL2 Ubuntu 24.04**, non da PowerShell.

Aprire WSL2:

```powershell
wsl -d Ubuntu-24.04
```

Posizionarsi nella cartella del progetto:

```bash
cd ~/progetti/shannon
```

Configurare il modello 7B:

```bash
export SHANNON_AI_API_KEY=ollama
export SHANNON_AI_MODEL=ollama:qwen2.5-coder:7b
```

Avviare Shannon:

```bash
./shannon start \
   -u "[http://host.docker.internal:3000](http://host.docker.internal:3000)" \
   -r "$HOME/progetti/juice-shop-src-shannon-test" \
   -w "local-qwen25-7b" \
   --models-config "./configs/ollama_7b.json" \
   --follow
```

Per il modello 14B:

```bash
export SHANNON_AI_API_KEY=ollama
export SHANNON_AI_MODEL=ollama:qwen2.5-coder:14b

./shannon start \
   -u "[http://host.docker.internal:3000](http://host.docker.internal:3000)" \
   -r "$HOME/progetti/juice-shop-src-shannon-test" \
   -w "local-qwen25-14b" \
   --models-config "./configs/ollama_14b.json" \
   --follow
```

Log e report nella cartella:

```text
results-logs\failed-runs\shannon
```

---

### 6.4 PentAGI

PentAGI deve essere eseguito da **WSL2 Ubuntu 24.04**.

Posizionarsi nella cartella:

```bash
cd ~/pentagi-lab/pentagi
```

Copiare il file di configurazione:

```bash
cp ../configs/pentagi/pentagi-env.example .env
```

Aprire il file `.env` e configurare:

```env
OPEN_AI_SERVER_URL=[http://host.docker.internal:11434/v1](http://host.docker.internal:11434/v1)
OPEN_AI_MODEL=qwen2.5-coder:7b
```

Avviare PentAGI:

```bash
docker compose up -d
```

Verificare lo stato dei servizi:

```bash
docker compose ps
```

Accedere alla dashboard:
[https://localhost:8443](https://localhost:8443)

Avviare un flow controllato verso:

```text
[http://host.docker.internal:3000](http://host.docker.internal:3000)
```

Salvare log:

```bash
mkdir -p ~/pentagi-lab/export
docker compose logs > ~/pentagi-lab/export/pentagi-container.log
```

Log e report nella cartella:

```text
results-logs\failed-runs\pentagi
```

---

### 6.5 CAI

CAI deve essere eseguito da **WSL2 Ubuntu 24.04**.

Creare e attivare un ambiente virtuale:

```bash
python3 -m venv cai_env
source cai_env/bin/activate
```

Installare CAI:

```bash
pip install cai
```

Configurare Ollama:

```bash
export CAI_MODEL=qwen2.5-coder:7b
export OLLAMA_API_BASE=http://localhost:11434/v1
```

Avviare CAI:

```bash
cai
```

Inserire il prompt presente in:

```text
prompts/cai-prompt.txt
```

Ripetere con:

```bash
export CAI_MODEL=qwen2.5-coder:14b
cai
```

Log e output nella cartella:

```text
results-logs\cai
```

---

### 6.6 BugTraceAI-CLI con OpenRouter

BugTraceAI è stato testato **esclusivamente con OpenRouter**.

Posizionarsi nella cartella:

```bash
cd ~/progetto_pentest/BugTraceAI-CLI
```

Copiare la configurazione:

```bash
cp ../configs/bugtraceai/bugtraceaicli.conf ./bugtraceaicli.conf
```

Configurare la variabile d’ambiente:

```bash
export OPENROUTER_API_KEY="INSERIRE_LA_PROPRIA_API_KEY"
```

Verificare la connessione:

```bash
curl -fsS -X POST http://localhost:8000/api/provider/test \
   -H 'Content-Type: application/json' \
   -d '{"provider":"openrouter-v2"}'
```

Output atteso:

```json
{"success":true,"message":"API Key Valid Response"}
```

Avviare la scansione controllata:

```bash
curl -fsS -X POST http://localhost:8000/api/scans \
   -H 'Content-Type: application/json' \
   -d @../prompts/bugtraceai-prompt.txt
```

Log e report nella cartella:

```text
results-logs\bugtraceai
```

---

## 7. Risultati Attesi e Classificazione

La tabella seguente riassume l'esito operativo della sperimentazione per ciascun framework, distinguendo chiaramente tra vulnerabilità confermate, esecuzioni parziali e fallimenti architetturali.

| **Tool** | **Provider / Modello** | **Risultato atteso (confermato dalla sperimentazione)** |
| :--- | :--- | :--- |
| **BugTraceAI-CLI** | OpenRouter (`cohere/north-mini-code:free`) | **Completata (2 vulnerabilità confermate):** assenza di rate limiting su `/login` (*Missing Rate Limiting*) e mancanza di *security headers*. Il meccanismo di validazione incrociata (tramite template Nuclei) ha scartato automaticamente 4 candidati su 6 iniziali, azzerando i falsi positivi nel report finale. |
| **CAI** | Ollama (`qwen2.5-coder:7b` / `14b`) | **Completata con intervento (1 vulnerabilità confermata):** individuazione del *directory listing* pubblico su `/ftp` e dei metadati del file `/ftp/incident-support.kdbx` (severità *Medium*) mediante analisi assistita con `redteam_agent` e guardrail attivi. Richiede revisione umana per filtrare inferenze non supportate (es. ipotesi di pannello admin dedotta dall'header `X-Recruiting` col 14B) o etichettatura discontinua (col 7B). |
| **PentestGPT** | Ollama (`qwen2.5-coder:7b` / `14b`) | **Completata in modalità guidata HITL (1 vulnerabilità confermata):** *Information Disclosure / Sensitive Data Exposure* tramite accesso non autenticato a `/ftp/acquisitions.md` individuato tramite directory listing su `/ftp`. Nella fase finale di generazione del report, il 14B è entrato in un *meta-loop* omettendo il corpo del report in Markdown, mentre il 7B ha mostrato *amnesia contestuale* e rottura del protocollo di stato. |
| **Strix** | Ollama (`qwen2.5-coder:7b` / `14b`) | **Fallita (0 finding)** in fase di reconnaissance a causa del collasso del tool-calling e del raggiungimento di `MaxTurnsExceeded`. I modelli hanno serializzato la struttura JSON nel campo di testo libero (`content`) anziché invocare nativamente le funzioni API esposte dall'orchestratore. |
| **PentAGI** | Ollama (`qwen2.5-coder:7b` / `14b`) | **Fallita (0 finding)** in fase di reconnaissance. L'orchestratore ha rilevato errori sistematici di formato (`got message instead of tool call`), con il modello che rispondeva in formato discorsivo invece che strutturato. |
| **Shannon** | Ollama (`qwen2.5-coder:7b` / `14b`) | **Fallita (0 finding)** per errori bloccanti di validazione dell’output (`OUTPUT_VALIDATION_FAILED`) nei nodi di exploitation, impedendo la generazione dei Proof-of-Concept funzionanti richiesti dal framework. |

---

## 8. Pulizia dell’ambiente

Per arrestare il laboratorio:

```powershell
cd .\docker
docker compose down
```

Per rimuovere anche i volumi:

```powershell
docker compose down -v
```

Per arrestare PentAGI:

```bash
cd ~/pentagi-lab/pentagi
docker compose down
```

---

## 9. Note sulla riproducibilità

- I risultati possono variare tra esecuzioni a causa della natura stocastica degli LLM.
- Le versioni dei framework, dei modelli e di Ollama devono essere riportate nei log.
- Non modificare contemporaneamente modello, provider e configurazione del target.
- BugTraceAI con OpenRouter e i test locali con Ollama devono essere considerati esperimenti separati.
