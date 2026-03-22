# Builder Passport: Plano Completo de Demo & Apresentação

## Contexto

**O que é:** Builder Passport é uma camada de reputação onchain para hackathons. Builders criam perfis, participam de hackathons, recebem attestations de peers e awards de organizadores — tudo armazenado permanentemente no blockchain Monad.

**Evento:** Monad Blitz São Paulo 2026 — hackathon presencial de 1 dia. **Os participantes votam** no melhor projeto (não são juízes). Prize pool: $2,000 USD.

**Formato da apresentação:**
- **Demo ao vivo:** 3 minutos máximo, apresentando solo (falando + navegando na tela)
- **Vídeo demo:** ~3 minutos, pré-gravado com Google AntiGravity + ElevenLabs para narração AI
- **Idioma da demo ao vivo:** Português
- **Idioma do vídeo (narração):** English

**Contratos deployados no Monad Testnet:**
- BuilderPassport: `0x0dEE19015b1AFE07301a229C38Bba789B9aDaEC4`
- BuilderClaims: `0xF880E020BD3ae1fBC1eD0ECf1E8afe508DA1ea55`

**URL da aplicação:** `https://builder-passport-xi.vercel.app/`

**Tese do demo:** "Um hackathon não deveria terminar como um post no LinkedIn esquecido. Deveria se tornar uma credencial permanente e verificável."

**Posicionamento:** NÃO é um clone do DevPost. DevPost guarda projetos. Builder Passport guarda a credibilidade do builder.

---

## 1. Configuração das Wallets

Você precisa de 4 wallets no MetaMask, cada uma com testnet MON para gas.

### Como criar as wallets

1. Abra o MetaMask
2. Clique no ícone do perfil → "Add account or hardware wallet" → "Add a new account"
3. Crie 4 contas e nomeie cada uma: "Patrick", "Organizer", "Ana", "Lucas"
4. **Exporte a private key** de cada uma: clique nos 3 pontinhos → "Account details" → "Show private key"
5. Guarde as 4 private keys num arquivo seguro — você vai precisar delas para o script de seeding

### Como adicionar Monad Testnet ao MetaMask

1. Clique no seletor de rede no topo → "Add network" → "Add a network manually"
2. Preencha:
   - **Network name:** Monad Testnet
   - **RPC URL:** `https://testnet-rpc.monad.xyz`
   - **Chain ID:** `10143`
   - **Currency symbol:** `MON`
   - **Block explorer URL:** `https://testnet.monadexplorer.com`
3. Clique "Save"

### Como obter testnet MON (gas)

1. Acesse o faucet Monad: `https://faucet.testnet.monad.xyz/`
2. Conecte cada wallet e solicite MON
3. Cada wallet precisa de pelo menos 0.1 MON (o script faz ~10 transações por wallet)
4. **Faça isso para TODAS as 4 wallets**

### Tabela das wallets

| Wallet | Nome no MetaMask | Papel | O que faz |
|--------|-----------------|-------|-----------|
| **A** | Patrick | Builder principal | O passaporte que você mostra na demo |
| **B** | Organizer | Organizador de hackathons | Cria hackathons e atribui awards |
| **C** | Ana | Peer builder | Atesta Patrick em vários hackathons |
| **D** | Lucas | Peer builder | Atesta Patrick em categorias diferentes |

---

## 2. Seeding dos Dados de Demo

O seeding preenche o blockchain com dados realistas para que o passaporte já esteja rico quando você subir no palco. **NÃO dependa de transações ao vivo durante os 3 minutos de demo.**

### Script Automático (Recomendado)

O arquivo `script/SeedDemo.s.sol` faz tudo automaticamente — 30+ transações em um comando:

```bash
# 1. Navegue até a raiz do projeto
cd /home/patrickpassos/GitHub/work/builder-passport

# 2. Exporte as private keys das 4 wallets (substitua pelos valores reais)
export PATRICK_KEY=0xSUA_PRIVATE_KEY_DO_PATRICK
export ORGANIZER_KEY=0xSUA_PRIVATE_KEY_DO_ORGANIZER
export ANA_KEY=0xSUA_PRIVATE_KEY_DA_ANA
export LUCAS_KEY=0xSUA_PRIVATE_KEY_DO_LUCAS

# 3. Execute o script
forge script script/SeedDemo.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast
```

**O que o script cria:**

| Tipo | Quantidade | Detalhe |
|------|-----------|---------|
| Perfis | 4 | Patrick Passos, Monad Blitz Official, Ana Silva, Lucas Ferreira |
| Hackathons | 3 | ETHGlobal Istanbul 2024, Monad Blitz Berlin 2025, Monad Blitz SP 2026 |
| Joins | 8 | Patrick→3 hackathons, Ana→3, Lucas→2 |
| Attestations | 14 | Distribuídas em 5 categorias e 3 hackathons |
| Awards | 3 | Istanbul=Finalist, Berlin=Winner, SP=Best Technical Solution |
| Claims externos | 2 | Ethereum SP 2023 (2nd Place), Solana Hacker House 2024 (Best DeFi) |
| Verificações | 4 | Ana e Lucas verificam ambos os claims |

### Se o Script Falhar (Fallback Manual)

Se o Foundry der erro ou o RPC estiver instável, faça manualmente pela interface:

1. **Perfis:** Conecte cada wallet → vá para `/passport/[endereço]` → preencha o formulário "Create Profile"
2. **Hackathons:** Com a wallet Organizer → vá para `/hackathons` → use o formulário "Create Hackathon" 3x
3. **Joins:** Com cada wallet → vá para `/hackathon/0`, `/hackathon/1`, `/hackathon/2` → clique "Join"
4. **Attestations:** Com wallet Ana → vá para `/hackathon/0` → clique "Attest" em Patrick → selecione Technical, etc.
5. **Awards:** Com wallet Organizer → vá para cada hackathon → selecione Patrick → atribua o award
6. **Claims:** Com wallet Patrick → vá para `/passport/[endereço]` → "Add Past Achievement" → preencha
7. **Verificações:** Com wallets Ana e Lucas → vá para o passaporte do Patrick → clique "Verify" nos claims

### Resultado Esperado no Passaporte

Quando você navegar para `/passport/[endereço-do-patrick]`, deve ver:
- **Header:** "Patrick Passos" com badge "Winner", @patrick, links do GitHub e LinkedIn
- **Stats:** 14 Total Attestations | 3 Hackathons Joined | Winner
- **AI Summary:** Resumo gerado por IA mencionando os 3 hackathons e conquistas externas
- **Hackathon History:** 3 cards com attestations e awards por evento
- **External Achievements:** 2 claims com 2 verificações cada
- **Share modal:** Botão de compartilhar funcionando com X, Telegram, WhatsApp, LinkedIn, Email
- **Leaderboard:** Patrick aparece como #1 em `/builders`

---

## 3. Deploy no Vercel

### Variáveis de Ambiente

Vá para o Vercel Dashboard → seu projeto → Settings → Environment Variables. Adicione:

| Variável | Valor | Obrigatório |
|----------|-------|-------------|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | `0x0dEE19015b1AFE07301a229C38Bba789B9aDaEC4` | Sim |
| `NEXT_PUBLIC_CLAIMS_ADDRESS` | `0xF880E020BD3ae1fBC1eD0ECf1E8afe508DA1ea55` | Sim |
| `MISTRAL_API_KEY` | Sua API key do Mistral (pegar em https://console.mistral.ai/) | Sim (para AI summary) |

### Depois de Configurar

1. Faça um push para trigger o redeploy: `git push`
2. Ou faça manual deploy no Vercel Dashboard → Deployments → "Redeploy"
3. Aguarde o deploy completar (~2 min)
4. Acesse a URL e verifique que todas as páginas carregam

---

## 4. Checklist Técnico Pré-Demo

Faça isso **30 minutos antes** da apresentação:

### Browser
- [ ] Chrome com MetaMask instalado
- [ ] Wallet A (Patrick) conectada no MetaMask
- [ ] Rede Monad Testnet selecionada
- [ ] Zoom do browser em ~90% para o passaporte caber bem no projetor
- [ ] Desabilitar todas as notificações do browser
- [ ] Fechar Slack, Discord, email, WhatsApp Web — qualquer coisa que possa gerar popup

### Tabs pré-abertas (nesta ordem)
1. **Tab 1:** Landing page (`/`) — ponto de partida
2. **Tab 2:** Página do hackathon (`/hackathon/2`) — Monad Blitz SP com participantes visíveis
3. **Tab 3:** Passaporte do Patrick (`/passport/[endereço]`) — **abrir cedo para o AI summary carregar**
4. **Tab 4:** Leaderboard (`/builders`) — backup se sobrar tempo

### QR Code
- [ ] Gerar QR code com a URL: `https://builder-passport-xi.vercel.app/hackathon/2`
- [ ] Ferramenta: https://www.qrcode-monkey.com/ (gratuito, sem marca d'água)
- [ ] Imprimir em papel A5 ou deixar aberto num segundo dispositivo (celular/tablet)
- [ ] O QR code permite que a audiência entre no hackathon e ateste você ao vivo

### Internet
- [ ] Testar se o app carrega no Wi-Fi do evento
- [ ] Ter hotspot do celular como backup
- [ ] Se possível, testar ambos antes da demo

### MetaMask
- [ ] Limpar transações pendentes (Settings → Advanced → Clear activity tab data)
- [ ] Verificar que tem MON suficiente para a attestation ao vivo

---

## 5. Demo ao Vivo — Roteiro Completo (3 minutos)

### Tabela de Tempo

| Segmento | Tempo | Duração | Ação na tela |
|----------|-------|---------|-------------|
| Gancho (o problema) | 0:00–0:30 | 30s | Parado na landing page |
| Landing page + stats | 0:30–0:45 | 15s | Scroll até os números |
| Página do hackathon | 0:45–1:15 | 30s | Switch para Tab 2 |
| Attestation ao vivo | 1:15–1:40 | 25s | Click attest + MetaMask |
| **Passaporte (wow moment)** | **1:40–2:30** | **50s** | **Switch para Tab 3** |
| AI summary + claims | 2:30–2:50 | 20s | Scroll na página |
| Fechamento + QR | 2:50–3:00 | 10s | Mostrar QR code |

### Roteiro em Português

**[0:00–0:30] O GANCHO** *(na landing page, sem scrollar)*

> "Pergunta rápida. Levanta a mão quem aqui já participou de um hackathon."
>
> *(pausa — maioria levanta)*
>
> "Agora mantém a mão levantada quem consegue **provar** isso facilmente. Se alguém te pedisse agora um registro verificável de todos os hackathons que você participou, o que você construiu e o que seus colegas acharam da sua contribuição — você conseguiria mostrar?"
>
> *(mãos abaixam)*
>
> "Esse é o problema. A gente constrói coisas incríveis em hackathons. E depois? Um post no LinkedIn. Um link de DevPost que ninguém checa. Sua reputação volta a zero no próximo evento. O Builder Passport resolve isso."

**[0:30–0:45] LANDING PAGE** *(scroll até a seção de stats)*

> "Builder Passport é uma camada de reputação onchain para hackathons, deployado no Monad."
>
> *(apontar para os números)* "Esses números são ao vivo do blockchain — [X] identidades de builders, [Y] attestations de peers, [Z] awards de organizadores. Tudo onchain, tudo verificável."

**[0:45–1:15] PÁGINA DO HACKATHON** *(trocar para Tab 2)*

> "Aqui está este evento — Monad Blitz São Paulo — registrado onchain. Esses são os builders que entraram."
>
> *(apontar para a lista de participantes com botões ATTEST)*
>
> "Cada participante pode atestar seus colegas em cinco categorias: Technical, Product, Pitch, Helpful e Teamwork. Isso não é auto-declarado. Seus peers te validam onchain."

**[1:15–1:40] ATTESTATION AO VIVO** *(clicar em ATTEST num participante)*

> "Deixa eu mostrar a velocidade disso no Monad."
>
> *(click ATTEST → selecionar Technical → confirmar no MetaMask)*
>
> "Um clique. Menos de um segundo no Monad. Essa attestation agora vive onchain permanentemente."
>
> *(se a tx demorar, continuar falando: "Enquanto confirma...")*

**[1:40–2:30] O PASSAPORTE** *(trocar para Tab 3 — PAUSAR 2 segundos para a audiência absorver)*

> "Isso aqui é um Builder Passport."
>
> *(apontar para o header)* "Patrick Passos. Três hackathons. Winner no Monad Blitz Berlin. Best Technical Solution aqui em São Paulo. Tudo verificado onchain."
>
> *(apontar para os stats)* "14 peer attestations. 3 hackathons. Winner."
>
> *(scroll até o AI summary)* "E isso — um resumo gerado por IA a partir dos dados onchain. Não é escrito por mim. Isso é o que o blockchain diz sobre você."
>
> *(ler uma frase chave do summary em voz alta)*
>
> *(scroll até hackathon history)* "Histórico completo. Cada hackathon mostra exatamente em quais categorias seus peers te reconheceram e qual award você recebeu. Isso é **portátil**. Acompanha você para o próximo hackathon, para o próximo DAO, para qualquer dApp que queira verificar credibilidade de builders."

**[2:30–2:50] CLAIMS EXTERNOS + COMPOSABILIDADE** *(scroll até external achievements)*

> "E builders também podem importar conquistas de outras plataformas — DevPost, ETHGlobal, qualquer lugar — e peers verificam esses claims onchain também."
>
> "O ponto chave: esses dados são **composáveis**. Qualquer smart contract pode ler isso para dar acesso, distribuir grants ou verificar skills. Sem API keys. Só lê o blockchain."

**[2:50–3:00] O FECHAMENTO** *(olhar para a audiência, falar com convicção)*

> "Um hackathon não deveria terminar como um post esquecido no LinkedIn. Deveria se tornar uma credencial permanente. Isso é o Builder Passport."
>
> *(mostrar QR code)* "E se quiserem, vocês podem entrar nesse hackathon no Builder Passport agora mesmo."
>
> "Obrigado."

---

## 6. Demo Video (~3 min, for X/submission)

Record with Google AntiGravity for screen capture + ElevenLabs for English AI narration.

**App URL for recording:** `https://builder-passport-xi.vercel.app/`

### Full Video Script with English Narration

**[0:00–0:20] PROBLEM + LANDING PAGE**

*Screen: Open landing page at `https://builder-passport-xi.vercel.app/`. Slow scroll showing the hero and live stats.*

Narration:
> "Every time you participate in a hackathon, your achievements become a social media post and then disappear. Your reputation as a builder resets to zero at the next event. Builder Passport changes that. It's an onchain reputation layer for hackathons, deployed on Monad. These numbers are live from the blockchain."

**[0:20–0:50] HACKATHON + ATTESTATION**

*Screen: Navigate to `https://builder-passport-xi.vercel.app/hackathon/2`. Show the participant list. Click ATTEST on a participant. Select a category. Confirm in MetaMask. Show the transaction confirming.*

Narration:
> "Every hackathon is registered onchain. Here's Monad Blitz Sao Paulo with its participants. Any builder can attest a peer across five categories: Technical, Product, Pitch, Helpful, and Teamwork. One click, confirm in MetaMask, and the attestation is permanent. Under one second on Monad. This is not self-reported — your peers vouch for you onchain."

**[0:50–1:50] PASSPORT — FULL SHOWCASE**

*Screen: Navigate to Patrick's passport page. Slow scroll through each section: header with Winner badge, stats, AI summary, hackathon history cards, external claims.*

Narration:
> "And this is the result: a Builder Passport. Patrick Passos — three hackathons, Winner at Monad Blitz Berlin, Best Technical Solution in Sao Paulo. Fourteen peer attestations across five categories."
>
> "An AI generates a professional summary from the onchain data. Not self-written. This is what the blockchain says about you as a builder."
>
> "The full history shows each hackathon individually — which categories your peers recognized you in and which award you received. This is portable. It follows you to the next hackathon, the next DAO, any protocol that wants to verify builder credibility."

**[1:50–2:15] EXTERNAL CLAIMS + VERIFICATION**

*Screen: Show the External Achievements section. Click "Add Past Achievement". Fill the form. Show a claim with verifications.*

Narration:
> "Builders can also import achievements from other platforms — DevPost, ETHGlobal, anywhere. Create a claim with the hackathon name, the result, and a proof link. Other builders verify that claim onchain. Here we see two claims with two verifications each — cross-platform reputation, peer-verified."

**[2:15–2:35] LEADERBOARD + SHARE**

*Screen: Navigate to `https://builder-passport-xi.vercel.app/builders`. Show the ranked list. Click Share on the passport, show the modal.*

Narration:
> "The leaderboard ranks all builders by reputation score — attestations, awards, and verified claims all contribute to the ranking. And with one click, any builder can share their passport on X, Telegram, WhatsApp, LinkedIn, or email."

**[2:35–2:50] CLOSING**

*Screen: Return to Patrick's passport page. Slow zoom on the header.*

Narration:
> "DevPost stores projects. Builder Passport stores builder credibility. Every hackathon you attend, every peer who recognizes you, every award you earn — it all compounds. It's portable. It's verifiable. It's yours. Forever."

---

## 7. Timeline do Dia do Evento

| Horário | Ação |
|---------|------|
| **Noite anterior** | Rodar o script de seeding. Verificar que o passaporte mostra todos os dados. Gravar o vídeo demo. |
| **9:00** | Chegar no evento, registro |
| **10:00–10:30** | Abertura + briefing |
| **10:30–11:45** | Workshops + ideação (você já tem o projeto pronto — use esse tempo para testar no Wi-Fi do local, verificar que tudo carrega) |
| **12:00–18:00** | Período de hacking — faça refinamentos finais, pratique o roteiro |
| **18:00** | **30 min antes do code freeze:** Abrir as 4 tabs, conectar MetaMask, verificar AI summary, imprimir QR code |
| **18:30** | Code freeze — pare de codar. Foco 100% na demo. |
| **18:30–19:00** | Submissão — submeter o repo público + vídeo demo |
| **19:00–21:00** | **Apresentações** — quando for sua vez, 3 minutos, siga o roteiro acima |

### Dicas para o dia

- **Pratique o roteiro pelo menos 3 vezes com timer** na noite anterior
- **NÃO mude nada no código** nas últimas 2 horas — você não quer introduzir bugs antes da demo
- **Tenha o hotspot do celular pronto** — Wi-Fi de evento é instável
- **Se o MetaMask demorar durante a attestation ao vivo**, continue falando naturalmente: "Enquanto a transação confirma no Monad..." e navegue para a tab do passaporte
- **Se o AI summary não carregar**, pule essa seção e foque no hackathon history e claims — o summary é legal mas não é o core da demo

---

## 8. Estratégia para Ganhar

### Por que os Participantes Vão Votar Neste Projeto

1. **Problema relatable** — todo builder na sala já perdeu conquistas de hackathon em posts esquecidos
2. **Visual wow** — o passaporte com 3 hackathons, 14 attestations, awards e AI summary é visualmente impressionante
3. **Realmente útil** — eles vão querer um. "Todo builder nessa sala deveria ter um desses."
4. **Participação da audiência** — se 5-10 pessoas entrarem e atestarem ao vivo pelo QR code, isso cria um buzz que nenhum outro projeto consegue
5. **Ângulo Monad** — "Cada attestation é uma interação social. Precisa de um chain rápido e barato. No Ethereum isso custaria $50. No Monad, frações de centavo e confirma em menos de um segundo."

### O que Enfatizar
- O passaporte completo (gaste a maior parte do tempo aqui — é o "wow moment")
- Agregação cross-hackathon ("sua reputação se acumula entre eventos")
- Verificação por peers ("não é auto-declarado — seus colegas atestam você onchain")
- AI summary a partir de dados onchain (novo + impressionante)
- Velocidade do Monad durante a attestation ao vivo

### O que NÃO Mostrar na Demo ao Vivo
- Criação de perfil (formulário chato — mostre o perfil já criado)
- Criação de hackathon (fluxo de organizador, não empolga votantes)
- Arquitetura de smart contracts (guarde para o vídeo)
- NÃO cite DevPost pelo nome — use "posts nas redes sociais" e "conquistas fragmentadas" como o vilão

### Mitigação de Riscos

| Risco | O que fazer |
|-------|------------|
| RPC do Monad fora | Hotspot do celular + ter screenshots/gravação das páginas como backup |
| MetaMask devagar | Pré-configurar no Monad Testnet, limpar txs pendentes antes |
| AI summary não carrega | Abrir a tab do passaporte cedo para pré-carregar. Se não carregar, pule. |
| QR code não funciona | A demo core funciona sem interação da audiência. O QR é bônus. |
| App dá erro | Cada página já está pré-carregada numa tab diferente. Se uma falhar, use outra. |
| Passar de 3 min | Cortar a seção de External Claims (2:30-2:50). O passaporte (1:40-2:30) é inegociável. |

### A Frase de Impacto

Escolha uma e fale com uma pausa antes e depois:
- **"Um hackathon não deveria terminar como um post esquecido no LinkedIn. Deveria se tornar uma credencial permanente."** ← recomendada
- "Builder Passport: sua reputação finalmente te acompanha."
- "Pare de postar sobre seu hackathon. Comece a provar."

---

## 9. Checklist Final de Verificação

### Código
- [ ] `forge build` passa sem erros
- [ ] `forge test` passa (todos os 33 testes)
- [ ] `cd frontend && npx next build` passa sem erros

### Seeding
- [ ] 4 wallets criadas no MetaMask com nomes corretos
- [ ] Todas as 4 wallets têm testnet MON
- [ ] Script `SeedDemo.s.sol` rodou com sucesso OU dados seedados manualmente
- [ ] Passaporte do Patrick mostra: 14 attestations, 3 hackathons, badge Winner, AI summary, 2 claims externos

### Deploy
- [ ] Variáveis de ambiente configuradas no Vercel (`NEXT_PUBLIC_CONTRACT_ADDRESS`, `NEXT_PUBLIC_CLAIMS_ADDRESS`, `MISTRAL_API_KEY`)
- [ ] Redeploy feito e site acessível pela URL pública
- [ ] Todas as páginas carregam corretamente na URL pública

### Demo
- [ ] Leaderboard `/builders` mostra Patrick como #1
- [ ] Attestation ao vivo funciona end-to-end em menos de 2 segundos
- [ ] AI summary gera corretamente no passaporte
- [ ] Share modal abre com todas as opções sociais
- [ ] QR code gerado e impresso/salvo no celular
- [ ] **Roteiro praticado pelo menos 3 vezes com cronômetro**

### Vídeo
- [ ] Vídeo demo gravado (~3 min)
- [ ] Narração gerada via ElevenLabs
- [ ] Vídeo testado e pronto para submissão
