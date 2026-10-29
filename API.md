# API Mapa Frota Maxpesa (v1)

API REST somente leitura para consultar os dados do Mapa Frota.

- **URL base:** `https://mapa-frota.vercel.app/api/v1`
- **Formato:** JSON (UTF-8)
- **Métodos:** apenas `GET`

## Autenticação

Toda chamada precisa da chave de API, enviada em um dos headers abaixo. A chave é fornecida separadamente pela Maxpesa; não a coloque em código público.

```
x-api-key: <SUA_CHAVE>
```

ou

```
Authorization: Bearer <SUA_CHAVE>
```

Sem chave ou com chave errada, a resposta é `401`.

## Recursos

`GET /api/v1` retorna a lista de recursos disponíveis. Cada recurso fica em `GET /api/v1/{recurso}`.

| Recurso | Conteúdo |
|---|---|
| `programacao` | Programação diária por placa e data (status, cliente, operador, horários, quebras, motivo, km) |
| `programacao_anexos` | Metadados dos anexos de cada programação (`programacao_id`, `nome_arquivo`, `storage_path`, `tipo_arquivo`, `tamanho_bytes`) |
| `equipamentos` | Cadastro de equipamentos (placa, frota, equipamento, família) |
| `clientes` | Cadastro de clientes |
| `operadores` | Cadastro de operadores |
| `status_programacao` | Códigos de status da programação |
| `motivos` | Motivos de parada/quebra |
| `itens_motivo` | Itens de cada motivo |

## Parâmetros

| Parâmetro | Descrição |
|---|---|
| `limit` | Registros por chamada. Padrão 500, máximo 1000 |
| `offset` | Posição inicial (paginação). Padrão 0 |
| `data_ini`, `data_fim` | Só em `programacao`: filtro por data, formato `AAAA-MM-DD`, limites inclusivos |
| qualquer coluna | Filtro de igualdade, por exemplo `?placa=ABC1234` ou `?programacao_id=<uuid>` |

Os filtros se combinam (E lógico). Uma coluna que não existe no recurso retorna `400`.

## Resposta

```json
{
  "recurso": "equipamentos",
  "total": 87,
  "limit": 500,
  "offset": 0,
  "proximo_offset": null,
  "data": [ { "id": "...", "placa": "ED-10-012", "frota": "ED-10-012", "...": "..." } ]
}
```

- `total` é o número de registros que atendem aos filtros, não só os da página.
- `proximo_offset` é o `offset` da próxima página, ou `null` quando acabou.

## Paginação

Para trazer tudo, repita a chamada usando `proximo_offset` como `offset` até ele vir `null`. A `programacao` tem cerca de 25 mil registros, ou seja, uns 25 requests com `limit=1000`.

## Exemplos

```bash
# Equipamentos
curl -H "x-api-key: $CHAVE" "https://mapa-frota.vercel.app/api/v1/equipamentos?limit=10"

# Programação de uma placa em agosto de 2026
curl -H "x-api-key: $CHAVE" \
  "https://mapa-frota.vercel.app/api/v1/programacao?placa=ABC1234&data_ini=2026-08-01&data_fim=2026-08-31"

# Anexos de uma programação
curl -H "x-api-key: $CHAVE" \
  "https://mapa-frota.vercel.app/api/v1/programacao_anexos?programacao_id=<uuid>"
```

Python, trazendo todas as páginas:

```python
import requests

BASE = "https://mapa-frota.vercel.app/api/v1"
H = {"x-api-key": CHAVE}

def buscar_tudo(recurso, **filtros):
    offset, tudo = 0, []
    while offset is not None:
        r = requests.get(f"{BASE}/{recurso}", headers=H,
                         params={"limit": 1000, "offset": offset, **filtros})
        r.raise_for_status()
        j = r.json()
        tudo += j["data"]
        offset = j["proximo_offset"]
    return tudo

programacao = buscar_tudo("programacao", data_ini="2026-08-01")
```

## Códigos de erro

| Código | Motivo |
|---|---|
| 400 | Coluna de filtro inválida ou erro na consulta |
| 401 | API key ausente ou inválida |
| 404 | Recurso inexistente |
| 405 | Método diferente de GET |
| 500 | Servidor sem configuração |

## Observações

- Os dados são lidos em tempo real do banco; não há cache.
- Os anexos retornam só os metadados e o caminho (`storage_path`), não o arquivo.
- Campos de horário (`inicio_operacao`, `fim_operacao`, `total_horas` etc.) são texto, não número.
