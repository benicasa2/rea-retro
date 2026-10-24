# Verificação da variante REA Retro

Esta variante preserva o suporte a 6502 e acrescenta 6809 e Z80.

## Correções de integração contínua

- Os READMEs traduzidos incluem os mesmos links da variante que o README principal.
- Os testes das três CPUs usam tabelas, mantendo os casos de admissão, overflow,
  seleção de linguagem e autoridade sem copiar blocos por processador.
- O teste PTX usa uma extensão desconhecida; `.ptr .global` é válido.
- O simulador de diretórios devolve nomes em bytes, conforme solicitado pelo leitor.
- O simulador GDB responde à consulta de conclusão `-gdb-show mi-async`.
- O teste CLI de memória seleciona explicitamente um heap de 32 MiB para garantir
  esgotamento real e exige `resource_constraint`. O limite padrão do produto não
  foi alterado; o caminho MCP continua verificando o padrão.
- O teste de rotas mantém o exemplo de 20 mil propriedades e verifica diretamente
  que o scanner percorre os campos uma vez, sem usar um limite de dois segundos
  dependente da máquina e da instrumentação de cobertura.

## Duplicação herdada

O upstream `5d6b8a0ab693c03ab85cf0807d40bedf021e76d8` já excedia o limite de
3,5%: jscpd 5.0.12 mediu 39.558 linhas duplicadas em 1.106.482 linhas
(3,5751146426241007%). A medição usou `git archive` dos diretórios `src` e
`tests`, com a configuração original do detector. A referência desta variante
é 3,575%, inferior ao valor herdado. Não aumente esse limite para acomodar
novas duplicações.

## Releases

Propostas automáticas de release do upstream ficam desativadas por padrão nesta
variante. Para adotá-las, configure a variável de repositório
`REA_ENABLE_RELEASE_PROPOSALS=true`, permita a criação de PRs por Actions e
revise os destinos de publicação antes de publicar o pacote. O CI continua ativo.
