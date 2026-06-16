# Especificação de Segurança de Base de Dados (TDD) — Kixi-Fundo

Este documento define os invariantes de dados, vetores de ataque potenciais ("Dirty Dozen" Payloads), e especificações de regras de segurança para a base de dados Firestore do Kixi-Fundo, com o objetivo de proteger a integridade financeira, conformidade e confidencialidade.

---

## 1. Invariantes de Dados (Regras de Segurança Fundamentais)

*   **Autenticação Obrigatória**: Qualquer acesso (leitura ou escrita) à base de dados exige autenticação via Google Provider com e-mail verificado.
*   **Integridade de Estrutura**: O documento central `/kix_fundo/state` deve sempre conter exatamente os campos obrigatórios: `currentMonth`, `members`, `logs`, `payoutsCompleted`, `appConfig` e `updatedAt`.
*   **Controlo de Intervalos**: 
    *   `currentMonth` deve estar no intervalo de `1` a `6`.
    *   `updatedAt` deve ser validado contra o timestamp do servidor (`request.time` ou formato ISO string consistente).

---

## 2. The "Dirty Dozen" Payloads (Ataques Potenciais Rejeitados)

Abaixo estão 12 cenários de payloads ou abusos que as regras do Firestore barram por completo:

### Payload 1: ID de Documento Malicioso (Resource Poisoning)
*   **Ação**: Criar/ler documento com ID excessivo (ex: `/kix_fundo/state_abcdefghijklmnopqrstuvwxyz1234567890`)
*   **Rejeição**: O Firestore bloqueia o acesso devido ao caminho fixo e rígido `/kix_fundo/state`.

### Payload 2: Utilizador Não Autenticado (Auth Bypass)
*   **Ação**: Leitura do estado por utilizador não logado.
*   **Rejeição**: `request.auth != null` é obrigatório.

### Payload 3: E-mail Não Verificado (Email Spoofing)
*   **Ação**: Atualização de estado por utilizador autenticado mas com `email_verified == false`.
*   **Rejeição**: `request.auth.token.email_verified == true` garante a validação da identidade.

### Payload 4: Atualização Sem Campos Obrigatórios (Incompleteness Guard)
*   **Ação**: Escrever apenas `{"currentMonth": 3}` no documento `state`.
*   **Rejeição**: Bloqueado pelo validador de chaves que exige a presença de todas as chaves obrigatórias.

### Payload 5: Mês Fora do Intervalo Operacional (Constraint Bypass)
*   **Ação**: Definir `currentMonth = 99` ou `currentMonth = -1`.
*   **Rejeição**: Bloqueado pelo validador que garante `currentMonth >= 1 && currentMonth <= 6`.

### Payload 6: Tipo de Dados Inválido (Type Safety Attack)
*   **Ação**: Enviar `currentMonth = "Mês Dois"` (string em vez de inteiro).
*   **Rejeição**: Bloqueado pelo validador `currentMonth is int`.

### Payload 7: Injeção de Campos Fantasma (Shadow Update / Ghost Fields)
*   **Ação**: Tentar gravar `{"isAdmin": true, "ghostSecret": "inject"}` misturado com o payload.
*   **Rejeição**: Bloqueado pela restrição de tamanho de chaves precisas e validação de chaves.

### Payload 8: Desconfiguração de Membros (Data Truncation)
*   **Ação**: Enviar `members = null` ou `members = true`.
*   **Rejeição**: Garante-se que `members is list`.

### Payload 9: Histórico de Logs Inválido (Audit Tampering)
*   **Ação**: Enviar `logs = "limpar_todos"`.
*   **Rejeição**: Exige-se tipo `list` para a segurança da integridade da trilha de auditoria (`logs is list`).

### Payload 10: Modificação de Configuração Crítica por Não-Admins
*   **Ação**: Utilizador padrão desativar backups mudando `appConfig.autoBackUpGDrive = false`.
*   **Rejeição**: Diferenciação de permissões onde apenas os administradores declarados podem alterar as configurações vitais.

### Payload 11: Escrita Fora do Documento de Estado (Unstructured Data Dump)
*   **Ação**: Tentar escrever lixo ou dados dispersos na coleção `/kix_fundo/random_doc_id`.
*   **Rejeição**: A regra de Catch-All global rejeita qualquer padrão fora de `/kix_fundo/state`.

### Payload 12: Tentativa de Destruição / Eliminação (Denial of Ledger)
*   **Ação**: Executar uma operação de delete em `/kix_fundo/state`.
*   **Rejeição**: Bloqueado explicitamente, pois não é permitida a operação de eliminação do estado consolidado.

---

## 3. Descrição de Testes (Test Runner Manual de Sucesso)

As validações asseguram que:
- Pedidos anónimos falham instantaneamente.
- Escritas com payloads estruturalmente incompletos ou alterados de forma maliciosa falham.
- Apenas as pessoas autorizadas com e-mails corporativos/pessoais auditados e verificados possam efetuar a consolidação do livro razão.
