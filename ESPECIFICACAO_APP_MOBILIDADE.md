# Aplicativo de mobilidade — prompt completo e roteiro para o Antigravity


Objetivo: desenvolver uma plataforma própria para corridas de carro e moto, com aplicativo do cliente, aplicativo do motorista e painel administrativo sincronizados. A Machine é a referência do modelo de negócio; utilizar o software ou as APIs comerciais dela dependeria de contratação e documentação de integração. Esta especificação não pressupõe esse acesso.

Este documento contém o comando inicial, a especificação para a IA e os comandos de continuação. Os valores e as metas de desempenho são exemplos de desenvolvimento, não tarifas recomendadas para uma operação real. A entrega deste documento não significa que o aplicativo já foi desenvolvido ou testado.

## 1. Como começar

1. Crie uma pasta exclusiva para o projeto, por exemplo `meu-app-mobilidade`.
2. Coloque este arquivo, com o nome `ESPECIFICACAO_APP_MOBILIDADE.md`, dentro da pasta.
3. Abra o Antigravity e associe essa pasta ao projeto. Na interface Antigravity 2.0 documentada atualmente, o caminho é o ícone de pasta com `+` → `New Project` → `Add Folder` → `Create`. Na interface de IDE, abra a mesma pasta como workspace. [Guia oficial](https://antigravity.google/docs/getting-started/)
4. Inicie a conversa do agente nesse projeto e cole o comando inicial abaixo. Ele pedirá um plano e a primeira entrega executável. Se o Antigravity apresentar o plano para revisão, confira o escopo e use `Proceed` para iniciar a implementação. [Revisão de planos](https://antigravity.google/docs/implementation-plan/)
5. Use os comandos da seção 3 na ordem indicada. Cada etapa deve terminar com evidências do que funciona, testes realizados e pendências registradas.
6. Para a primeira demonstração, use pessoas, corridas e pagamentos fictícios. A sincronização deve usar servidor e banco de dados reais de desenvolvimento, mesmo quando mapas ou pagamentos estiverem simulados.

### Comando inicial para copiar

```text
Leia integralmente o arquivo ESPECIFICACAO_APP_MOBILIDADE.md na raiz deste projeto e trate a seção 2 como a especificação do produto e os critérios de aceitação como requisitos verificáveis.

Quero desenvolver uma plataforma própria de transporte por aplicativo, inspirada no modelo funcional da Machine, Uber e 99: aplicativo do cliente, aplicativo do motorista de carro ou moto e painel administrativo web, todos ligados ao mesmo backend e banco de dados.

Comece pela Etapa 1: examine a pasta e o ambiente, crie o plano de implementação, o modelo de dados, a arquitetura e a matriz de requisitos, e implemente a primeira corrida completa em ambiente local. Use o nome provisório Mobilidade Regional, pt-BR, BRL e Macaé/RJ apenas como cenário de demonstração.

Na primeira entrega, o cliente deve solicitar uma corrida, um motorista deve recebê-la e aceitá-la, o administrador deve acompanhar os mesmos dados, e a corrida deve poder iniciar por PIN e terminar com recibo de teste. Registre tudo no PostgreSQL e sincronize sessões distintas pelo backend. Inclua o motor inicial de tarifa por quilômetro e minuto, com parâmetros administráveis. Mapas, mensagens externas e pagamentos podem ter provedores de demonstração identificados nessa etapa.

Implemente e execute o que for possível, documente os comandos exatos para iniciar cada componente e corrija os erros encontrados. Não marque interfaces ilustrativas ou integrações simuladas como funcionalidades validadas em produção. Preserve o trabalho existente e registre o progresso em docs/PROGRESSO.md para permitir continuação sem recriar o projeto.
```

## 2. Especificação e prompt mestre

**Instruções ao agente de desenvolvimento:** a partir deste ponto, implemente o produto descrito por etapas. A divisão organiza o desenvolvimento; os requisitos ainda pendentes continuam pertencendo ao projeto. Mantenha uma matriz com requisito, etapa, estado, teste e evidência. Use os estados: não iniciado, em implementação, implementado localmente, validado em homologação e liberado para produção. Não confunda esses estados.

### A. Produto, escopo e diferenciais

Crie uma plataforma de transporte remunerado de passageiros com identidade própria e três experiências:

| Experiência | Entrega |
|---|---|
| Cliente | Aplicativo Android e iOS para solicitar e acompanhar corridas e administrar pagamentos e histórico. |
| Motorista | Aplicativo Android e iOS para profissionais de carro e moto; o veículo ativo determina a elegibilidade das chamadas. |
| Administração | Painel web para operação, tarifas, pessoas, pagamentos, relatórios, suporte e configurações. |

O desenvolvimento deve produzir código próprio, sem pressupor acesso aos algoritmos privados das plataformas de referência. O objetivo de qualidade é verificável: preço explicado, ganho previsto do motorista visível, menos etapas para chamar uma corrida, reconexão confiável, acessibilidade e suporte local organizado.

Configurações iniciais: nome provisório `Mobilidade Regional`, idioma pt-BR, moeda BRL, distâncias em quilômetros e duração em minutos. Persistir horários em UTC e aplicar o fuso IANA da cidade na interface e nas regras de horário; usar `America/Sao_Paulo` na demonstração. Nome, logotipo e cores devem ser substituíveis por configuração.

Categorias cadastráveis: carro econômico, conforto, executivo e moto. Cada uma deve ter critérios de veículo, capacidade, regras e tarifas próprias. Oferecer somente categorias com operação habilitada e motoristas elegíveis. Corridas de moto exigem regras específicas de segurança, capacidade e documentação. A habilitação comercial por cidade depende da validação aplicável à operação local; criar configuração correspondente, sem presumir que uma autorização de carro cobre moto.

Planejar múltiplas cidades e zonas de atendimento desde o modelo de dados. Começar como uma empresa operadora; revenda white label e múltiplas empresas independentes serão uma expansão explícita, com isolamento de dados antes da ativação. Moto aqui significa transporte de passageiros; entregas podem ser um módulo posterior.

### B. Arquitetura técnica

Adote esta base, verificando versões estáveis, mantidas e compatíveis na documentação oficial antes de instalar. Registre as versões escolhidas e fixe o arquivo de dependências. Mudanças necessárias de stack devem ter justificativa técnica registrada.

| Camada | Base proposta |
|---|---|
| Aplicativos | React Native, TypeScript e Expo com development builds e módulos nativos quando necessários. |
| Painel administrativo | Next.js e TypeScript, componentes acessíveis, tabelas com filtros e formulários validados. |
| Servidor | NestJS/Node.js em módulos de domínio, API REST documentada e gateway Socket.IO. |
| Dados persistentes | PostgreSQL com PostGIS para zonas e consultas geográficas; migrations, índices e consultas parametrizadas. |
| Trabalho assíncrono | Redis e BullMQ para presença temporária, distribuição de eventos, filas, expiração e tentativas. |
| Arquivos | Armazenamento compatível com S3, privado, para documentos e anexos. |
| Mapas e rotas | Adaptador para Google Maps Platform: mapa, busca de endereços, geocodificação e Routes API. |
| Notificações | FCM/APNs ou serviço compatível, com recibos de envio, rotação de tokens e remoção de tokens inválidos. |
| Pagamentos | Adaptador para um provedor que comprove as capacidades necessárias no Brasil e na conta da empresa. |
| Qualidade | Testes de domínio e integração; Playwright para o painel web; ferramenta de testes móveis compatível com as versões adotadas. |
| Operação | Contêineres, ambientes separados, logs estruturados, métricas e rastreamento de erros. |

React Native recomenda o uso de um framework para novos aplicativos; Expo é uma das opções documentadas. A arquitetura proposta é uma escolha para este projeto. [Documentação do React Native](https://reactnative.dev/docs/environment-setup)

Estrutura sugerida: `apps/customer`, `apps/driver`, `apps/admin`, `services/api`, `services/worker`, `packages/contracts`, `packages/domain`, `packages/ui-tokens`, `infra` e `docs`. Compartilhe contratos, validação e identidade visual sem obrigar componentes web a funcionarem como componentes nativos.

Use um backend modular inicialmente, com separação por domínio e possibilidade de escala horizontal. PostgreSQL é a fonte de verdade para corridas e finanças. Redis, push e WebSocket não substituem transações persistentes. O servidor deve ficar em infraestrutura compatível com conexões persistentes; planeje balanceamento, distribuição dos eventos entre instâncias e encerramento gradual sem perder corridas. [Gateways no NestJS](https://docs.nestjs.com/websockets/gateways)

### C. Identidade e permissões

- Cadastro, login, recuperação de acesso, encerramento e revogação de sessões; autenticação por telefone com OTP em produção e outros métodos apenas quando implementados corretamente.
- Use biblioteca ou provedor de autenticação mantido, com validação no servidor. Se houver senha, use hash apropriado; nunca implemente criptografia própria.
- OTP com expiração, limite de tentativas, controle de reenvio e proteção contra abuso. OTP de demonstração deve existir somente no ambiente local e bloquear a inicialização em produção se estiver habilitado.
- MFA para administradores; perfis de proprietário, gestor, operador, financeiro, suporte, auditor, cliente e motorista. Permissões também por cidade.
- Tokens móveis em armazenamento seguro do sistema; sessões web protegidas e proteção contra CSRF quando aplicável. Validar acesso em toda rota e assinatura de evento.
- Um cliente só acessa seus dados e corridas; um motorista só acessa ofertas destinadas a ele e viagens atribuídas; administradores recebem somente os dados compatíveis com sua função.
- O proprietário administra o negócio, com rastreabilidade. Alterações financeiras, acesso a documentos e intervenções em corridas exigem permissão e motivo registrado. Registros contábeis não podem ser apagados para alterar saldos.

### D. Aplicativo do cliente

Abas: **Início, Atividade, Pagamentos, Ajuda e Conta**.

Implementar:

- Cadastro, perfil, telefone validado, preferências, exclusão de conta e acompanhamento das solicitações de privacidade.
- Mapa com localização atual, permissão solicitada no contexto de uso, alternativa de digitação manual, busca de endereço, referência de embarque e ajuste do pino.
- Origem e destino, endereços favoritos, casa e trabalho, categoria, estimativa de chegada, distância, duração, preço e forma de pagamento.
- Cotação detalhada e prazo de validade; identificação de preço dinâmico e apresentação do novo total antes da confirmação quando a cotação vencer.
- Solicitar corrida com proteção contra toque duplo, tela de busca, prazo e cancelamento. Informar ausência de motoristas e permitir nova tentativa consciente.
- Após aceite: identificação do motorista, fotografia aprovada, veículo, cor, placa, avaliação, previsão de chegada e posição atualizada com indicação de localização desatualizada.
- Mensagens vinculadas à corrida; notificações de chegada; telefone mascarado quando houver integração contratada, sem anunciar mascaramento se não existir.
- Código PIN para embarque, acompanhamento da viagem, compartilhamento temporário com contato de confiança e central de segurança.
- Cancelamento com motivo e valor informado antes de confirmar; isenções e contestação conforme a regra aplicável ao estado da corrida.
- Recibo com discriminação dos valores, avaliação mútua, gorjeta opcional quando suportada, histórico, contestação de cobrança, suporte e objetos perdidos.
- Em etapa de expansão: paradas intermediárias, alteração de destino, agendamento, corrida para outro passageiro identificado, cupons e indicação. Cada função deve ter regras completas e testes antes de aparecer como disponível.
- Contas corporativas e centros de custo em módulo posterior, com aprovação de usuários, limites, políticas e relatórios de faturamento.

### E. Aplicativo do motorista de carro ou moto

Abas: **Mapa/Chamadas, Ganhos, Atividade, Documentos e Conta/Ajuda**.

Implementar:

- Cadastro profissional, dados de recebimento e envio seguro dos documentos exigidos pela operação: identificação, habilitação e atributos exigíveis, veículo, fotografia e validades.
- Revisão administrativa com aprovação, rejeição justificada, reenvio, alerta de vencimento e suspensão de novas ofertas quando a elegibilidade expirar. Nunca simular consulta oficial de documento.
- Seleção do veículo ativo. O veículo deve estar aprovado e compatível com a categoria; impedir mudança durante uma corrida ativa.
- Estados offline, disponível, reservado por aceite, a caminho, em corrida e pausado. Mostrar conexão, disponibilidade e situação do GPS de forma clara.
- Recebimento de ofertas com som/vibração configuráveis, validade, categoria, distância/tempo até o embarque, resumo da viagem, forma de pagamento e ganho estimado.
- Aceitar ou recusar. A aceitação só é confirmada após confirmação atômica do servidor. Ofertas vencidas ou já tomadas não podem iniciar uma segunda corrida.
- Navegação até embarque e destino; abrir navegador externo na primeira versão e prever navegação embarcada como integração específica.
- Chegada ao ponto de embarque, espera com franquia, cancelamento justificado, passageiro ausente, verificação de PIN, início e conclusão da viagem.
- Extrato separado em bruto, comissão, taxas contratadas, incentivos, gorjetas, pedágios, recebidos em dinheiro, recebíveis e repasses efetivamente concluídos.
- Solicitação de repasse conforme disponibilidade financeira, acompanhamento de falhas e contestação de valores. Saldo exibido deve vir dos lançamentos financeiros, não de cálculo isolado no celular.
- Histórico, avaliações, suporte, incidentes, objetos perdidos e notificações operacionais.
- Dados precisos de localização somente quando necessários à operação e informados ao profissional. Não rastrear o motorista offline.

### F. Painel administrativo

| Aba | Controles necessários |
|---|---|
| Visão geral | Corridas solicitadas, concluídas e canceladas; motoristas disponíveis; valor bruto movimentado, receita da plataforma, tempo até aceite, ETA e indicadores de suporte. |
| Operação ao vivo | Mapa, filtros por cidade/categoria, corridas sem aceite, posições desatualizadas, detalhe e linha do tempo. |
| Corridas | Busca, filtros, histórico de estados, cotação original, motorista, cliente, rota, pagamento, cancelamento e recibo. |
| Motoristas | Cadastro, documentos, veículos, elegibilidade, aprovações, suspensões justificadas e ganhos. |
| Clientes | Cadastro, atividade, solicitações de suporte e restrições justificadas. |
| Cidades e zonas | Polígonos de cobertura, áreas especiais, horários, regras intermunicipais e categorias habilitadas. |
| Categorias e veículos | Capacidade, requisitos, atributos, classificação e regras específicas de moto. |
| Tarifas básicas | Bandeirada, quilômetro, minuto, mínima, espera, cancelamento, pedágio e adicionais. |
| Tarifas dinâmicas | Regras por oferta/demanda e horário, limites, simulação, histórico, vigência e desligamento rápido. |
| Comissões e incentivos | Percentual ou valor fixo, base de cálculo, financiamento de descontos, vigência e limites. |
| Financeiro | Pagamentos, recebíveis, repasses, taxas, conciliação, estornos, chargebacks e divergências. |
| Cupons e indicação | Público elegível, orçamento, validade, limite de uso e prevenção de abuso. |
| Agendamentos | Reservas, janela de despacho, confirmação, risco de falta de motorista e política de cancelamento. |
| Empresas | Usuários corporativos, centros de custo, limites e relatórios. |
| Suporte e segurança | Tickets, incidentes, responsáveis, prioridade, prazo e histórico. |
| Relatórios | Filtros e exportação CSV, demanda por região, qualidade, receita e custos. |
| Acessos e auditoria | Perfis, permissões, MFA, sessões e registro de antes/depois das mudanças. |
| Integrações e operação | Estado dos provedores, notificações, filas, métricas, alertas e configurações não secretas. |

Toda ação relevante deve persistir e validar no backend. Tabelas e gráficos precisam consultar dados reais do ambiente. Identifique demonstrações e dados fictícios. Não criar botão sem ação nem telas decorativas para representar requisito concluído.

Despacho manual, troca de motorista antes do embarque e cancelamento administrativo devem obedecer às mesmas transações e restrições do fluxo normal. Nenhum operador pode transferir silenciosamente uma viagem em andamento ou fazer um saldo divergir da contabilidade. Regras e tarifas têm rascunho, prévia, vigência, publicação e versão anterior para futuras cotações.

### G. Motor de tarifas

Criar configurações versionadas por cidade, categoria, zona de origem, dia e faixa de horário. Resolver conflitos com precedência explícita e impedir duas regras ativas ambíguas. A regra padrão deve existir para toda categoria comercialmente habilitada.

Campos obrigatórios:

- Valor de saída/bandeirada; valor por quilômetro; valor por minuto da viagem; preço mínimo.
- Franquia de espera no embarque e preço por minuto excedente; distinguir espera de embarque de duração da viagem.
- Cancelamento por estado da corrida, prazo de tolerância, atraso do motorista e ausência do passageiro; definir quem recebe eventual cobrança.
- Pedágios estimados e ajustes comprovados; adicional de área ou horário previamente informado; condições para aeroportos, eventos e viagens entre cidades quando configuradas.
- Percentual ou valor fixo de comissão da plataforma, base comissionável, responsável por taxas do provedor e descontos.
- Multiplicador dinâmico, limites, horário de vigência e motivo.
- Limite de desconto, validade da cotação e condições explícitas de atualização de preço.

**Fórmula inicial do projeto**, não uma reprodução do algoritmo privado da Uber:

```text
componente_variavel = bandeirada + (km_rota × valor_km) + (min_rota × valor_min)
tarifa_deslocamento = max(corrida_minima, componente_variavel) × multiplicador
tarifa_servico = tarifa_deslocamento + espera_cobravel + adicionais_informados
desconto_aplicado = min(desconto_elegivel, tarifa_servico)
total_passageiro = tarifa_servico - desconto_aplicado + pedagios + gorjeta_opcional
```

O mínimo nesta versão é aplicado antes do multiplicador. Pedágios e gorjetas não sofrem multiplicação dinâmica nem desconto. Especificar em teste a composição de cada parcela. A espera no embarque é separada e não pode ser contada novamente como minutos da viagem.

Distância e duração devem vir de rota viária, com perfil compatível com o veículo. Distância em linha reta serve apenas para pré-selecionar motoristas, nunca para apresentar uma cotação comercial como se fosse rota calculada.

Calcular dinheiro no backend, com valores monetários em centavos e aritmética decimal precisa para conversões de metros/segundos; definir um único ponto de arredondamento de cada parcela e registrar os centavos finais. Não usar ponto flutuante binário para somar dinheiro. Persistir entradas, distância, duração, versão tarifária, multiplicador, parcelas, descontos e preço aceito.

Exemplo fictício para teste: bandeirada R$ 4,00, R$ 2,00/km, R$ 0,30/min, mínima R$ 10,00, 5 km, 15 minutos e multiplicador 1,20. Sem adicionais: `(4 + 5×2 + 15×0,30) × 1,20 = R$ 22,20`. Um cupom de R$ 2,00 resulta em R$ 20,20. Esses números apenas validam a fórmula.

Na primeira versão, adotar **preço antecipado contratado**: a cotação tem validade configurável, por exemplo 120 segundos. Depois da solicitação válida, gravar o preço aceito. Mudança administrativa ou aumento posterior de demanda não altera a corrida contratada. Trânsito comum não gera recálculo silencioso do preço fechado.

Espera excedente, pedágios variáveis ou mudança solicitada de destino seguem condições já informadas, com detalhamento. Mudanças de destino e paradas devem produzir prévia de diferença e confirmação; registrar versão da alteração. Para acréscimos eletrônicos, verificar capacidade de autorização/cobrança do provedor. Não debitar valor adicional sem suporte técnico e fundamento contratual. Na ausência dessas condições, desabilitar a alteração na primeira versão.

### H. Tarifa dinâmica

Implementar motor determinístico e explicável. Usar, por zona e categoria, quantidade de solicitações válidas na janela configurada e motoristas realmente elegíveis e disponíveis. Excluir tráfego de demonstração, solicitações duplicadas, fraudes confirmadas, profissionais ocupados e posições vencidas.

O painel deve controlar: tamanho da zona, janela temporal, frequência de atualização, amostra mínima, faixas de razão demanda/oferta, multiplicador mínimo/máximo, teto monetário opcional, limite de mudança por intervalo, suavização, horários, vigência e desligamento imediato. Evitar contagem duplicada de motoristas em zonas sobrepostas e recalculações que oscilam a cada chamada.

No início, manter o motor automático em simulação: mostrar o que cobraria, usando tráfego real de homologação, sem alterar preços comerciais. Disponibilizar também multiplicador manual com vigência, justificativa e limite. Quando ativado, registrar os dados agregados que produziram cada multiplicador.

Sem motoristas elegíveis, retornar indisponibilidade; não dividir por zero nem apresentar preço ilimitado. Exibir o total e a ocorrência de tarifa dinâmica antes da confirmação. Não personalizar preços com dados sensíveis, nível de bateria ou inferência de vulnerabilidade econômica. IA generativa não participa do cálculo monetário ou da decisão de cobrança.

### I. Sincronização, despacho e concorrência

Modelar separadamente **cotação**, **solicitação/corrida**, **oferta ao motorista**, **pagamento** e **repasse**. Uma corrida concluída pode continuar com pagamento pendente; isso não a transforma em corrida ainda em andamento.

Estados principais da corrida:

```text
solicitada → buscando_motorista → motorista_atribuido → a_caminho → chegou → em_viagem → concluida
```

Ramificações permitidas: cancelada antes do início, sem_motorista após esgotar busca, reabertura controlada da busca quando o motorista cancela antes do embarque, e encerramento antecipado com motivo quando uma viagem já começou. Guardar histórico de transições, autor e instante do servidor. Não permitir saltos inválidos.

Fluxo obrigatório:

1. Cliente confirma cotação válida; o backend verifica cobertura, categoria, identidade, restrições e estado financeiro necessário.
2. Criar corrida com chave de idempotência e restrição que impeça duas viagens imediatas ativas do mesmo cliente. Reservas futuras usam outro estado e controle de sobreposição.
3. Selecionar candidatos com veículo/categoria aprovados, localização recente, presença válida, zona compatível e nenhuma viagem ativa. Pré-filtrar por distância geográfica; classificar por tempo até embarque, com desempate documentado.
4. Criar ofertas com identificador, motorista destinatário, validade e rodada. Enviar a pequenos grupos configuráveis, ampliar a busca progressivamente e limitar prazo/raio total.
5. No aceite, validar oferta e prazo com relógio do servidor, elegibilidade atual e estado da corrida. Atualizar corrida e ocupação do motorista em uma transação no banco, com bloqueios/controle de versão e restrições únicas para uma corrida por motorista e um motorista por corrida.
6. Somente a transação vencedora confirma o aceite. As demais recebem conflito controlado; ofertas restantes são retiradas e cliente/admin são atualizados. Locks temporários no Redis podem auxiliar, mas a integridade depende do banco.
7. Persistir o evento a publicar na mesma transação da mudança, por padrão transactional outbox. O worker publica e repete com deduplicação; consumidores usam identificadores e versões.
8. Durante a corrida, usar posição recente e atualizações do servidor; informar perda de conexão e último horário recebido. Remover motorista com presença vencida da oferta para novas corridas, preservando a viagem ativa.
9. Após reconectar, buscar o estado atual pela API e recuperar eventos quando disponíveis. Ignorar duplicados, eventos vencidos e versões antigas. Não depender de o WebSocket ter entregue cada mensagem.
10. Concluir a corrida uma vez, gerar cálculo final e iniciar o fluxo financeiro. Repetir requisições de conclusão não pode duplicar cobrança, recibo nem ganho.

Socket.IO não garante, por padrão, que uma mensagem perdida seja entregue novamente. Por isso, o projeto exige persistência, deduplicação e recuperação explícita. [Garantias de entrega](https://socket.io/docs/v4/delivery-guarantees)

Payloads de eventos devem incluir `eventId`, `rideId`, `rideVersion`, `type` e `occurredAt`. Canais são autorizados por usuário e corrida; nunca transmitir localização de todos os profissionais a todos os clientes. Antes do aceite, limitar dados de identificação e endereços à necessidade da oferta. Posição exata do motorista atribuído só deve ser entregue às pessoas autorizadas.

Implementar cancelamento e aceite concorrentes com transações que determinem um resultado único. A liberação do motorista, o fim de ofertas e o eventual reembolso devem ser coerentes com o resultado. Se o servidor reiniciar depois do commit, a corrida e seus eventos pendentes precisam continuar recuperáveis.

### J. Localização, mapas e notificações no celular

Implementar GPS real com verificação de precisão, horário, sequência e pontos impossíveis. A frequência deve variar entre motorista disponível e em viagem, com configuração de bateria e custo. Como exemplo de laboratório, testar atualização a cada 5 segundos em viagem; não tratar esse intervalo como garantia dos sistemas móveis. Persistir somente o necessário e definir retenção para trajetos.

No Android e iOS, configurar permissões e modos nativos apropriados. Use development builds para testes completos, incluindo segundo plano e tela bloqueada. A coleta de localização depende do estado do aplicativo e de restrições do sistema; encerramento forçado pode interromper atualizações. O produto deve exibir desatualização e recuperar estado quando reaberto. [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)

Use Socket.IO para sincronização com app ativo, e push como apoio para novas ofertas e mudanças relevantes em segundo plano. Ao abrir uma notificação, consulte o backend e valide se a oferta continua disponível. Não assumir entrega instantânea ou garantida de push. O uso de Socket.IO como serviço contínuo de segundo plano não é a estratégia móvel recomendada pela própria biblioteca. [Orientação do Socket.IO](https://socket.io/docs/v4/)

Testar aplicativo aberto, minimizado, tela bloqueada, reinício, falta de permissão, economia de bateria, troca de rede e encerramento forçado. Não anunciar que um aplicativo encerrado receberá chamadas sem limitações do sistema.

Para moto, consultar o modo `TWO_WHEELER` e a cobertura. A documentação consultada lista o Brasil; o modo e os avisos exigidos pelo provedor devem ser validados para a implantação. Não substituir moto por bicicleta. Se a rota não estiver disponível, apresentar indisponibilidade ou alternativa comprovadamente compatível. [Cobertura](https://developers.google.com/maps/documentation/routes/coverage-two-wheeled) e [modo de rotas para moto](https://developers.google.com/maps/documentation/routes/route_two_wheel).

Restringir chaves públicas de mapas por aplicativo/domínio e serviços permitidos; manter chaves de servidor protegidas. Controlar cotas, alertas de gasto, cache permitido pelos termos e custo de cálculo de rotas. Sem provedor real, identificar a rota como demonstração e impedir uso comercial do preço simulado.

### K. Pagamentos e contabilidade

Criar interfaces `PaymentProvider` e `PayoutProvider`. Selecionar o provedor na etapa de integração, verificando documentação, disponibilidade contratual, Pix, cartão tokenizado, autorização/captura quando oferecidas, estorno e transferência para motoristas. Split de marketplace e repasse automatizado precisam de suporte confirmado; não presumir que qualquer conta de pagamento os fornece.

Guardar somente tokens e metadados permitidos, nunca número completo de cartão ou CVV. Credenciais privadas ficam no servidor/gerenciador de segredos. Webhooks devem validar autenticidade pelo mecanismo oficial do provedor, proteger contra repetição, conferir valor/moeda/referência e processar com idempotência. Consultar a API oficial para conciliação de estados incertos. Um redirecionamento de sucesso no celular não confirma pagamento.

Implementar estados próprios de pagamento: criado, aguardando, autorizado quando aplicável, pago, falhou, cancelado, estorno_pendente, estornado e contestado. Tratar eventos fora de ordem, repetidos e pagamento confirmado depois de expirar uma solicitação.

Fluxos:

- **Cartão:** quando o provedor permitir, autorizar antes do despacho e capturar após conclusão; cancelar autorização se não houver viagem. Tratar falha de captura, validade da autorização e ajuste do valor dentro das capacidades contratadas.
- **Pix:** para a primeira integração, criar cobrança antes da busca e despachar somente após confirmação no servidor. Se não houver motorista ou ocorrer cancelamento elegível, iniciar devolução; mostrar o estado real, inclusive pendência. Acréscimo exige cobrança complementar explicitamente tratada.
- **Dinheiro:** habilitação por cidade/categoria. O motorista informa recebimento e há mecanismo de contestação. Não registrar entrada eletrônica inexistente. A comissão a receber do motorista fica contabilizada como obrigação própria, com regras de acerto e limite.
- **Gorjeta:** opcional, transparente, integralmente destinada ao motorista conforme regra declarada; sem comissão da plataforma na configuração inicial.

Chamadas externas de pagamento não devem manter transações do banco abertas. Usar comandos idempotentes, outbox e compensações: por exemplo, pagamento confirmado com busca encerrada exige devolução ou revisão registrada, nunca desaparecimento do dinheiro.

Criar razão financeiro com lançamentos imutáveis de débitos e créditos balanceados. Separar valor pago, desconto e seu financiador, receita da plataforma, custos, obrigação com motorista, pedágio, gorjeta, estorno, contestação e repasse. Corrigir por lançamentos compensatórios. O valor bruto das corridas não é a receita da plataforma.

Como regra de demonstração: comissão percentual incide sobre a tarifa de serviço antes do cupom; cupom financiado pela plataforma reduz sua margem, preservando o valor contratual do motorista. Pedágio e gorjeta ficam fora da base comissionável. Qualquer outra política deve ser explícita, versionada e testada.

Repasse depende de saldo disponível e confirmação financeira, com prevenção de saldo negativo indevido, duplicação, troca fraudulenta de conta e reversões. Implementar conciliação diária, divergências, falhas e reprocessamento. Dois pedidos simultâneos de saque não podem consumir o mesmo saldo. Preparar revisão financeira adicional para valores altos conforme política configurada.

### L. Segurança, privacidade e suporte

- Autorização por objeto em APIs e eventos; validação de entrada, limites de requisição, proteção contra abuso de OTP, upload validado, URLs temporárias e banco com acesso restrito.
- Criptografia em trânsito e proteção em repouso; logs sem segredos, documentos, cartão ou trajeto preciso desnecessário. Segredos fora do repositório e dos aplicativos.
- Compartilhamento de viagem com token de validade curta, revogável e limitado à corrida; expirar ao concluir, com eventual tolerância documentada.
- PIN com limite de tentativas. Se houver exceção operacional, exigir suporte autorizado, justificativa e trilha; não permitir bypass livre pelo motorista.
- Central de segurança com contato de confiança, informações da corrida e abertura do discador para serviço configurado. Um botão de emergência só pode anunciar monitoramento ou acionamento de central quando essa operação realmente existir.
- Fluxo de incidente: abertura, prioridade, responsável, ações, contato, conclusão e revisão. Disponibilidade do atendimento deve corresponder à equipe real.
- Privacidade com finalidades, bases legais avaliadas, minimização, retenção por categoria de dado, pedidos de acesso/correção e exclusão com tratamento das obrigações de retenção. Permissão de GPS do sistema operacional não substitui a análise de proteção de dados.
- Preparar política e termos para revisão pelo responsável da operação, sem afirmar conformidade automática. A LGPD trata, entre outros pontos, de finalidade, necessidade, transparência, segurança e direitos dos titulares. [Texto oficial](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- Prevenir abuso de cupons, contas automatizadas e sinais de GPS incompatível. Sinais de risco geram revisão proporcional; evitar punições automáticas irreversíveis baseadas em um único indicador.

### M. Dados e contratos

Modelar ao menos: usuários, sessões, perfis e permissões, clientes, motoristas, documentos, veículos, categorias, cidades, zonas, tarifas e versões, regras dinâmicas, cotações, corridas, ofertas, eventos, posições, pagamentos, eventos de pagamento, razão financeiro, repasses, cupons, usos de cupom, avaliações, tickets, incidentes, notificações, compartilhamentos temporários, reservas, contas corporativas e auditoria.

Criar chaves estrangeiras, índices geográficos, restrições de unicidade, política de retenção e migrations reproduzíveis. Usar paginação e filtros de servidor em tabelas. Entidades de etapas posteriores podem entrar quando forem implementadas, sem inventar dados para preencher painéis.

Documentar API em OpenAPI, catálogo de eventos e erros padronizados. Expor comandos equivalentes a: cotar, solicitar, consultar corrida ativa, aceitar oferta, registrar chegada, validar PIN/iniciar, concluir, cancelar, atualizar localização, consultar ganhos e administrar tarifas. Versionar contratos e validar compatibilidade com versões antigas dos aplicativos durante atualizações.

### N. Interface e experiência

Visual original, profissional, com mapa legível, hierarquia simples, botões grandes, contraste adequado, fonte ampliável e suporte a leitores de tela. Textos curtos em português claro. Motorista deve realizar ações essenciais com poucos toques e mínima distração.

No painel, filtros por período/cidade/categoria, estados de carregamento, vazio, erro e sucesso, confirmação de ações de impacto e mensagens úteis. Nas configurações de tarifa, mostrar exemplo do cálculo antes de publicar. No aplicativo do cliente, preço e categoria devem estar próximos ao botão de confirmação.

Exibir falha de rede, GPS indisponível, cobrança pendente e busca esgotada com instrução prática. Não usar números, motoristas, pagamentos ou avaliações fictícios em telas comerciais. No ambiente demonstrativo, usar faixa visível de demonstração.

### O. Funcionalidades avançadas

Após o núcleo validado, implementar agendamento, paradas, mudança de destino, corrida para terceiros, cupons/indicações e módulo corporativo. Agendamento precisa de reserva, janela de despacho, política de preço, aviso de falta de motorista e tratamento de sobreposição; não prometer disponibilidade garantida apenas porque uma data foi salva.

Prever favoritos e preferências de acessibilidade conforme oferta real; incentivos com orçamento; mapa agregado de demanda sem exposição de viagens individuais; alertas de desvio de rota sujeitos a validação e tratamento de falsos positivos.

Usar análise de dados para ETA, demanda e qualidade quando houver histórico suficiente e indicadores de erro. Recursos de IA para atendimento devem encaminhar incidentes e decisões financeiras ao fluxo adequado. Não usar um chatbot para substituir cálculo de tarifa, despacho transacional ou resposta humana de emergência.

### P. Testes e critérios de aceitação

Criar testes de risco real e executá-los contra backend e banco, evitando apenas verificar que a tela renderiza. Toda evidência deve indicar ambiente, versão, comando executado, resultado e limitações.

| ID | Cenário obrigatório | Resultado esperado |
|---|---|---|
| AC01 | Cliente, motorista e administrador em sessões distintas | A mesma corrida aparece nos três, com identificador e estados coerentes. |
| AC02 | Dois motoristas aceitam simultaneamente | Exatamente um aceite vence; o outro recebe conflito, sem duplicar corrida. |
| AC03 | Um motorista tenta aceitar duas corridas | Somente uma fica atribuída; a outra continua disponível conforme regra. |
| AC04 | Cliente toca duas vezes em solicitar | Uma única corrida é criada. |
| AC05 | Cancelamento concorre com aceite | Resultado único, consistente e com efeito financeiro correspondente. |
| AC06 | App desconecta, reconecta ou perde eventos | Recupera o estado atual; não retrocede nem duplica efeitos. |
| AC07 | Reinício do servidor após commit | Corrida e publicação pendente são recuperadas. |
| AC08 | Mudança de tarifa e dinâmica | Nova cotação muda; corrida já contratada mantém sua versão. |
| AC09 | Fórmula de teste, mínima, espera e cupom | Totais em centavos correspondem à especificação, sem contagem dupla. |
| AC10 | Nenhum motorista, oferta vencida ou GPS antigo | Mensagens corretas, oferta inválida rejeitada, sem atribuição indevida. |
| AC11 | Profissional suspenso, documento vencido ou categoria errada | Novas ofertas e aceite são bloqueados no servidor. |
| AC12 | Usuário tenta consultar corrida/documento de outro | Acesso negado em API, WebSocket, arquivo e compartilhamento. |
| AC13 | Conclusão ou webhook repetido | Uma cobrança e um conjunto de lançamentos, sem duplicação. |
| AC14 | Pix confirmado após cancelamento e estorno com falha | Estado reconciliado e devolução rastreável, sem marcar sucesso falso. |
| AC15 | Captura falha, dinheiro, cupom, gorjeta e chargeback | Razão balanceado e separação correta entre receita e valores de terceiros. |
| AC16 | Dois repasses simultâneos | Saldo não é consumido duas vezes. |
| AC17 | Celular em segundo plano, bloqueado, sem rede ou encerrado | Comportamento documentado, presença expira e reconexão funciona. |
| AC18 | Permissão de GPS negada e acessibilidade | Cliente pode digitar endereço; limitações do motorista são explicadas. |
| AC19 | PIN incorreto e token de compartilhamento expirado | Ações negadas, com limites e rastreabilidade. |
| AC20 | Restauração de backup em ambiente separado | Dados recuperados e procedimento documentado. |
| AC21 | Agendamento, parada e alteração de destino | Preço, autorização de pagamento e disponibilidade tratados explicitamente. |

Meta inicial de laboratório para o núcleo: com 100 motoristas simulados, 300 conexões simultâneas e 10 solicitações por minuto durante 15 minutos, medir p50/p95/p99, erros e divergências; buscar p95 inferior a 2 segundos para refletir mudanças em apps ativos na rede de teste. É uma meta a comprovar, sem garantia para redes móveis ou push. Registrar configuração da máquina e custo estimado; ajustar infraestrutura conforme o piloto. Nenhuma atribuição ou cobrança duplicada é aceitável.

### Q. Ambientes, custos e publicação

Criar desenvolvimento, homologação e produção com bancos, credenciais e chaves separados. Entregar `.env.example` sem segredos, Docker Compose local, migrations, dados fictícios, scripts de inicialização, documentação e pipeline de verificação.

Monitorar: disponibilidade, latência, tempo até aceite, ofertas expiradas, corridas sem motorista, GPS vencido, idade da outbox, filas, erros de pagamento, divergências financeiras e incidentes. Criar healthchecks, alertas, backups e recuperação; metas iniciais de RPO/RTO devem ser propostas com custo e verificadas em teste de restauração.

Prever logs com identificadores de correlação, retenção limitada de posições, índices e particionamento quando houver volume, limites de consultas de mapas e monitoramento de custos por corrida. Entregar estimativa para 1 mil, 10 mil e 100 mil corridas/mês com premissas e preços atuais verificados: servidor, banco, Redis, armazenamento, mapas/rotas, OTP, pagamentos, build/distribuição, suporte e manutenção. Separar custos fixos, variáveis e operacionais; não inventar preços dos provedores.

Publicação inclui domínio/HTTPS, infraestrutura que suporte o realtime, aplicativos assinados, identificadores próprios, contas de desenvolvedor, políticas de privacidade e declarações de permissões exigidas pelas lojas. Builds iOS devem usar ambiente de compilação compatível, local ou serviço contratado, e validação em iPhone real.

Antes do lançamento, registrar pendências reais: credenciais, contratação de provedores, validação de documentos, regras de transporte por cidade/categoria, suporte e resposta a incidentes, termos, proteção de dados, seguro quando aplicável e aprovação nas lojas. A operação comercial requer validação técnica e operacional responsável; não rotular um protótipo como pronto para atender passageiros.

### R. Forma de trabalho e entregáveis

Trabalhe dentro da pasta do projeto, preserve alterações existentes e use controle de versão. Não reinicie o projeto por perder contexto: leia `docs/PROGRESSO.md` e continue a etapa pendente. Decisões de implementação rotineiras podem ser resolvidas e documentadas pelo agente.

Credenciais faltantes devem produzir adaptadores e um roteiro exato de configuração; uma integração simulada nunca deve ser ativada em produção. Não imprimir segredos. Documentar e separar tarefas que dependem de contratação, publicação, acesso de conta ou operação humana, enquanto avança no código e nos testes disponíveis.

Entregar em cada etapa: código, instruções para executar, migrations, dados de demonstração adequados, telas relevantes, testes executados, resultados, matriz de requisitos e lista de bloqueios externos. Entregar ao final: documentação da arquitetura, decisões, contratos de API/eventos, manual do administrador, guia de implantação, manual de atendimento e recuperação, cálculo de custos e evidências de aceitação.

Não encerrar o trabalho após mostrar um plano quando a etapa pede implementação. Não declarar testes executados se o ambiente não permitiu rodá-los. Não chamar de concluída uma funcionalidade porque existe apenas seu layout.

## 3. Comandos para continuar, em ordem

Envie um comando por etapa. O prompt mestre permanece no arquivo e deve ser consultado em todas elas. Ajustes necessários a requisitos anteriores devem ser implementados sem apagar o histórico.

### Etapa 1 — Primeira corrida completa

Use o comando inicial da seção 1. Critério: núcleo persistente rodando, perfis separados, tarifa básica administrável e uma corrida completa. Se o ambiente não permitir compilar os aplicativos móveis, registrar o bloqueio; uma interface web de demonstração não substitui a entrega móvel.

### Etapa 2 — Concorrência e recuperação

```text
Leia a especificação e docs/PROGRESSO.md. Implemente a Etapa 2: despacho por elegibilidade e proximidade, ofertas com prazo, aceite atômico, ocupação única do motorista, cancelamento concorrente, transactional outbox, deduplicação e recuperação de estado após reconexão e reinício. Execute especialmente AC02 a AC07 e AC10. Entregue evidências com dois motoristas disputando a mesma corrida e um motorista tentando aceitar duas corridas diferentes. Corrija falhas antes de encerrar a etapa.
```

### Etapa 3 — Mapas, GPS e aplicativos nativos

```text
Continue o projeto existente. Implemente a Etapa 3: adaptador de mapas e rotas reais, busca de endereço, perfil de carro e moto, ETA, GPS com qualidade e validade, navegação, push e builds móveis. Documente as chaves necessárias. Teste Android e iOS em primeiro e segundo plano, tela bloqueada, perda de rede e encerramento forçado. Registre limitações reais. Quando faltarem chaves ou aparelhos, mantenha essas verificações pendentes e forneça o procedimento exato; não apresente simulação como GPS validado.
```

### Etapa 4 — Tarifas e administração

```text
Implemente a Etapa 4 segundo as seções F, G e H: painel de cidades, categorias e zonas, tarifas por quilômetro/minuto, mínima, espera, cancelamento, adicionais, pedágios, comissões e dinâmica. Inclua versões, vigência, precedência, simulador e auditoria. Mantenha a dinâmica automática em simulação até a validação. Teste o exemplo de R$ 22,20 e R$ 20,20 com cupom, regras de arredondamento e preservação do preço contratado quando o administrador altera a tabela.
```

### Etapa 5 — Pagamentos e repasses

```text
Implemente a Etapa 5: apresente as capacidades exigidas do provedor e confira quais estão disponíveis para a conta e o Brasil. Implemente o adaptador selecionado em sandbox, Pix, cartão conforme suporte, dinheiro, razão financeiro balanceado, comissões, estornos, conciliação e repasses. Teste webhooks repetidos e fora de ordem, pagamento tardio, falha de captura, duas solicitações de repasse e estorno após repasse. Mantenha produção desabilitada sem credenciais e homologação comprovadas. Execute AC13 a AC16 e entregue o resultado da conciliação de cada cenário.
```

### Etapa 6 — Cadastro, suporte e proteção de dados

```text
Implemente a Etapa 6: autenticação e recuperação completas, OTP real quando configurado, MFA administrativo, documentos de motorista e veículo, revisão e vencimento, permissões por função e cidade, tickets, incidentes, PIN, compartilhamento temporário e privacidade. Execute testes de acesso indevido em REST, WebSocket e arquivos. Prepare os fluxos de acesso, correção e exclusão de dados com retenção documentada. Informe quais textos e regras operacionais dependem de revisão do responsável pela empresa.
```

### Etapa 7 — Recursos comerciais avançados

```text
Implemente a Etapa 7: agendamento com janela de despacho, paradas e mudança de destino com revisão de preço, corrida para terceiro, cupons, indicação, incentivos e contas corporativas. Inclua política de conflito de reservas, financiamento de descontos e orçamento. Teste os efeitos sobre cotação, pagamento, motorista e administração. Não habilite funções cujo fluxo financeiro ou de disponibilidade ainda não esteja resolvido.
```

### Etapa 8 — Qualidade, carga e operação

```text
Implemente a Etapa 8: revise acessibilidade e jornadas, execute os critérios de aceitação aplicáveis, teste a carga de laboratório, instrumente métricas e alertas, configure backups e demonstre restauração em ambiente separado. Meça latências e custos com premissas explícitas. Corrija defeitos e produza um relatório que diferencie executado, aprovado, falhou e não executado; liste limitações e o que ainda impede o piloto.
```

### Etapa 9 — Preparação para piloto e publicação

```text
Prepare a Etapa 9: ambiente de homologação e pacote de implantação em produção, builds assináveis, instruções de Google Play e App Store, termos/política para revisão, manual administrativo, atendimento, contingência, rollback e custos. Monte roteiro de piloto controlado com cliente, motorista e administrador, cobrindo carro e moto separadamente. Entregue o conjunto revisável de configuração, mudanças e pendências externas antes de qualquer contratação, cobrança real ou publicação. Não declare operação comercial pronta enquanto houver requisito essencial sem validação.
```

### Comando para retomar depois de uma pausa

```text
Leia ESPECIFICACAO_APP_MOBILIDADE.md, docs/PROGRESSO.md, a matriz de requisitos e as alterações existentes. Identifique a última etapa efetivamente validada e continue da próxima pendência. Preserve a arquitetura e o código que funciona. Informe o objetivo da entrega atual e implemente os itens executáveis antes de apresentar o resultado.
```

### Comando para auditar a entrega do Antigravity

```text
Audite este projeto contra cada requisito de ESPECIFICACAO_APP_MOBILIDADE.md. Para cada item, indique arquivo/implementação, evidência de funcionamento, teste executado, resultado e pendência. Inspecione especialmente aceites simultâneos, permissões, localização em segundo plano, recuperação de conexão, integridade das tarifas, webhooks e repasses. Não aceite uma tela pronta como evidência de backend funcional. Execute os testes disponíveis e corrija defeitos encontrados; registre explicitamente os testes que dependem de aparelho, credencial ou operação externa.
```

## 4. O que você deve conferir pessoalmente

Faça a primeira demonstração com três acessos distintos: cliente em um aparelho, motorista em outro e administrador no computador. Solicite a corrida, veja a oferta chegar, aceite, acompanhe a atualização nos três acessos, confirme o embarque com PIN, finalize e confira o recibo. Depois repita com dois motoristas tentando aceitar ao mesmo tempo.

Altere o preço por quilômetro no painel e peça uma nova cotação. Ela deve mudar, enquanto uma corrida já contratada mantém a regra original. Desconecte e reconecte um aparelho; a corrida precisa reaparecer no estado correto. Na homologação de pagamento, repita uma confirmação para verificar que o valor é registrado uma única vez.

Essas demonstrações permitem avaliar o produto. Pagamentos reais, comportamento móvel em campo, segurança e publicação precisam das validações descritas no projeto, além da aparência das telas.

