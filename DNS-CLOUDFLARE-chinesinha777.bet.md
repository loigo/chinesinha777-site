# DNS Cloudflare — chinesinha777.bet

**Servidor dedicado (produção atual):** `157.180.40.196`  
**SSH:** `root@157.180.40.196` (chave `~/.ssh/bamboogames_deploy_ed25519`)  
**Front:** PM2 `chinesinha777-front` → `:5177` · path `/var/www/chinesinha777-front`  
**Nginx:** `/www/server/panel/vhost/nginx/node_chinesinha777.conf`  
**SSL:** Let's Encrypt `/etc/letsencrypt/live/chinesinha777.bet/`  
**Modo:** **dedicated** (API same-origin `/gofun` via `server.mjs` — **sem Supabase Edge**)

> IP antigo Hetzner `46.4.100.157` permanece **offline**.  
> Projeto Supabase Pro (`jfevwnfvmifuwmeyvhft`) **não é mais o host** do site (pode ficar de backup até apagar com confirmação).

Painel: https://dash.cloudflare.com → domínio **chinesinha777.bet** → **DNS** → **Records**

---

## Registros obrigatórios (dedicado)

| Tipo | Nome | Valor | Proxy | TTL | Função |
|------|------|--------|-------|-----|--------|
| **A** | `@` | `157.180.40.196` | **ON** (laranja) | Auto | Apex → dedicado |
| **A** | `www` | `157.180.40.196` | **ON** | Auto | www → dedicado |
| **A** | `api` | `157.180.40.196` | **ON** | Auto | api → mesmo host (gofun local) |

### Regras
- Proxy **laranja** OK com SSL **Full (strict)** no Cloudflare (cert no origin).
- **Não** use mais A records `185.199.*` (GitHub Pages).
- **Não** use CNAME `api` → `*.supabase.co` nesta arquitetura dedicada.
- Stape `srv` opcional; TXT ACME/custom hostname antigos do Supabase podem ser removidos.

---

## SSL Cloudflare

SSL/TLS → Overview → **Full (strict)**  
(Cert Let's Encrypt válido no origin até ~2026-10-10, renovação automática certbot.)

---

## Deploy / restart no dedicado

```bash
ssh -i ~/.ssh/bamboogames_deploy_ed25519 root@157.180.40.196
cd /var/www/chinesinha777-front
pm2 reload chinesinha777-front --update-env
pm2 save
nginx -t && nginx -s reload
```

Smoke:

```bash
curl -sI https://chinesinha777.bet/ | head -5
curl -sS -X POST https://chinesinha777.bet/gofun/v2/firstpage -H 'Content-Type: application/json' -d '{}' | head -c 80
```

---

## Admin `/painel`

Upstream nginx → `127.0.0.1:3020` (`chinesinha777-admin`).  
Se o painel não estiver deployado no dedicado, `/painel` retorna 502 até subir o Next/PM2.

---

Atualizado: 2026-07-12 (migração Supabase → dedicado)
