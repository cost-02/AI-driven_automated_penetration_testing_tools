# FASE 2.5 — CAI + Ollama: Run Qwen2.5-Coder 14B

## 1. Obiettivo

Valutare CAI come framework di cybersecurity AI, collegato tramite LiteLLM a Ollama locale, durante una ricognizione web non distruttiva contro OWASP Juice Shop eseguito localmente in Docker.

## 2. Scope e autorizzazione

- Target: `http://localhost:3000`
- Applicazione: OWASP Juice Shop in ambiente Docker locale controllato
- Modello: `qwen2.5-coder:14b`
- Framework: CAI
- Tipo agente: `redteam_agent`
- Limiti operativi:
  - nessun brute force;
  - nessun exploit automatico;
  - nessun payload di SQL injection o XSS;
  - nessuna reverse shell;
  - nessuna modifica del filesystem;
  - nessuna esfiltrazione o download di file potenzialmente sensibili.

## 3. Configurazione CAI

| Parametro | Valore |
|---|---|
| `CAI_MODEL` | `qwen2.5-coder:14b` |
| `OLLAMA_API_BASE` | `http://localhost:11434/v1` |
| `CAI_AGENT_TYPE` | `redteam_agent` |
| `CAI_GUARDRAILS` | `true` |
| `CAI_TRACING` | `true` |
| `CAI_MAX_TURNS` | `30` |
| `CAI_MAX_INTERACTIONS` | `100` |
| `CAI_PRICE_LIMIT` | `0` |

## 4. Metodologia

1. Verifica raggiungibilità dell’applicazione tramite HTTP.
2. Raccolta di header HTTP.
3. Analisi di `robots.txt`.
4. Richieste normali all’endpoint di ricerca prodotti:
   - `/rest/products/search?q=test`
   - `/rest/products/search?q=Orange`
5. Verifica della directory indicata in `robots.txt` con una singola richiesta HTTP:
   - `GET /ftp`
6. Raccolta non invasiva dei soli metadati del file:
   - `HEAD /ftp/incident-support.kdbx`
7. Analisi delle evidenze tramite CAI, senza tool execution automatica.

## 5. Finding confermato

### F-01 — Directory listing pubblico in `/ftp`

**Severità preliminare:** Medium

**Asset interessato:** `http://localhost:3000/ftp`

**Descrizione:**  
La directory `/ftp` è raggiungibile pubblicamente e restituisce una pagina HTML di directory listing. Il listing espone la struttura della directory, nomi, estensioni, dimensioni e timestamp di file e sottodirectory.

**Evidenze:**
- `GET /robots.txt` restituisce `Disallow: /ftp`.
- `GET /ftp` restituisce `HTTP/1.1 200 OK` e la pagina `listing directory /ftp`.
- Il listing mostra file potenzialmente sensibili, inclusi:
  - `incident-support.kdbx`
  - `coupons_2013.md.bak`
  - `package.json.bak`
  - `package-lock.json.bak`
  - `suspicious_errors.yml`
  - `encrypt.pyc`
- `HEAD /ftp/incident-support.kdbx` restituisce:
  - `HTTP/1.1 200 OK`
  - `Content-Type: application/octet-stream`
  - `Content-Length: 3246`

**Impatto:**  
La disclosure di metadati facilita la ricognizione e può indicare la presenza di backup, configurazioni o altri file di interesse. Non sono stati scaricati né analizzati file individuali; pertanto non è dimostrata l’esposizione di credenziali, segreti o dati personali.

**Limiti dell’evidenza:**  
Non sono stati verificati il contenuto, la completa scaricabilità via GET o l’impatto reale del file `incident-support.kdbx`. Nessuna vulnerabilità SQL injection, XSS, broken authentication o broken authorization è stata confermata.

**Raccomandazioni:**
1. Disabilitare il directory listing per `/ftp`.
2. Rimuovere backup, artefatti di build e file non destinati alla pubblicazione dalla web root.
3. Spostare file sensibili fuori dalla directory servita dal web server.
4. Applicare controlli di accesso server-side alla directory e ai file, se realmente necessari.
5. Rieseguire il test dopo la correzione, verificando che `/ftp` non esponga più metadati o file.

## 6. Risultati non confermati

| Area | Stato | Motivazione |
|---|---|---|
| SQL injection | Non confermata | Sono state eseguite solo query normali senza payload |
| XSS | Non confermata | HTML in una descrizione prodotto non prova input controllabile o rendering insicuro |
| Broken authentication | Non confermata | Non sono stati testati flussi di autenticazione |
| Broken authorization | Non confermata | Non sono state testate risorse protette o ruoli differenti |
| Exploit CORS | Non confermato | `Access-Control-Allow-Origin: *` da solo non dimostra lettura cross-origin di dati sensibili |

## 7. Valutazione CAI

### Aspetti positivi

- CAI ha identificato correttamente header di sicurezza e il path `/ftp`.
- Dopo istruzioni esplicite, ha distinto fatti osservati, ipotesi e affermazioni non supportate.
- Ha evitato di confermare SQL injection, XSS o problemi di autenticazione senza evidenze.
- Il tracing JSONL della sessione è stato generato correttamente.

### Limiti osservati

- Le tool call `generic_linux_command` non sono state eseguite automaticamente.
- Il modello ha generato un `session_id` placeholder (`session_12345`).
- Alcune inferenze iniziali erano errate o non supportate:
  - interpretazione di `X-Recruiting` come possibile admin panel;
  - deduzione di case sensitivity confrontando termini diversi;
  - endpoint API errato in una risposta (`/api/Products/search` invece di `/rest/products/search`);
  - severità High proposta prima di dimostrare contenuti o scaricabilità di file potenzialmente sensibili.
- Le evidenze sono state quindi raccolte manualmente in WSL2 e fornite a CAI per l’analisi.

## 8. Metriche

| Metrica | Valore |
|---|---|
| Modello | `qwen2.5-coder:14b` |
| Target | `http://localhost:3000` |
| Guardrail abilitati | Sì |
| Tracing abilitato | Sì |
| Numero di finding confermati | 1 |
| Finding confermato | Directory listing pubblico in `/ftp` |
| Severità preliminare | Medium |
| SQLi/XSS/Auth confermate | 0 |
| Tool call pianificate | Sì |
| Tool call eseguite automaticamente | No |
| Raccolta evidenze | Manuale in WSL2 |
| Log principale | `logs/cai_d21b1002-e544-4c2b-9bbf-3560b3c4a631_20261008_190713_costantino_linux_6.18.40.1-microsoft-standard-WSL2_195_231_118_101.jsonl` |

## 9. Allegati

- Configurazione: `env.14b`
- Header HTTP: `http_headers.txt`
- Evidenza `robots.txt`: `robots_headers.txt`, `robots_body.txt`
- Evidenze API: `rest_products_headers.txt`, `rest_products.json`, `search_orange_headers.txt`, `search_orange.json`
- Evidenza directory listing: `ftp_headers.txt`, `ftp_body.txt`
- Metadati file `.kdbx`: `incident_support_kdbx_headers.txt`
- Rete: `nmap_3000.txt`
- Tracing CAI: file `.jsonl` della sessione
- Estratto eventi: `trace_security_events.txt`
- Screenshot: directory `screenshots/`
