# Relatório — Migração de volta ao servidor dedicado

**Data:** 2026-07-12  
**Pedido:** tirar do Supabase, site no dedicado, DNS Cloudflare, commit do dia, produção pronta

---

## Hosts

| Host | Status |
|------|--------|
| `46.4.100.157` (Hetzner antigo Chinesinha) | **OFFLINE** (TCP 22/80/443 timeout) |
| `157.180.40.196` (dedicado online / Helsinki) | **ONLINE** — destino da migração |

---

## O que foi feito

1. **Front player** empacotado e deploy em `/var/www/chinesinha777-front`
2. **PM2** `chinesinha777-front` porta **5177** (online)
3. **Gofun / jogos / PIX** no Node `server.mjs` (same-origin) — **sem Edge Supabase**
4. **Bridge Edge desligado** no `index.html` (`__CH7_DEDICATED__`)
5. **`supabase-config.json`** → `mode: dedicated`, `noSupabase: true`
6. **Secrets** DigitoPay + RoyalGames + MailerSend em `config/secrets/` no servidor
7. **Nginx** vhost `node_chinesinha777.conf` (BT Panel)
8. **SSL** Let's Encrypt para `chinesinha777.bet`, `www`, `api`
9. **Cloudflare DNS** A `@` / `www` / `api` → `157.180.40.196` (proxied)
10. Smoke público: home **200**, firstpage **200** (~652 KB)

---

## Arquitetura atual

```
Browser → Cloudflare (proxy) → 157.180.40.196
  nginx :443
    /            → front :5177
    /gofun/*     → front :5177  (API local)
    /api/*       → front :5177
    /painel/*    → admin :3020  (pendente se PM2 admin não existir)
```

---

## Smoke (pós-migração)

| Teste | Resultado |
|-------|-----------|
| https://chinesinha777.bet/ | **200** |
| https://www.chinesinha777.bet/ | **200** |
| /static/supabase-config.json dedicated | **OK** |
| POST /gofun/v2/firstpage | **200** |
| PM2 chinesinha777-front | **online** |
| SSL LE | **OK** até 2026-10-10 |

---

## Pendências

1. **Admin Next `/painel`** — nginx já aponta para `:3020`; falta deploy completo do admin no dedicado (build Next + Postgres).
2. **Projeto Supabase Pro** `jfevwnfvmifuwmeyvhft` — ainda existe; **não destruído** (só sob confirmação explícita).
3. **IP antigo** `46.4.100.157` — se voltar, decidir se desliga de vez ou usa como backup.
4. Cloudflare SSL mode: preferir **Full (strict)** no dashboard.

---

## Conclusão

Site de **produção do player** está no **servidor dedicado** `157.180.40.196`, fora do host Supabase/GitHub Pages, com DNS e SSL prontos.
