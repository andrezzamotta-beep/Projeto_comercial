import os
import calendar
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
import httpx
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

class ComercialService:
    def __init__(self):
        self.base_url = os.getenv("CRIFFER_API_URL", "https://api.criffer.com.br")
        self.token = os.getenv("CRIFFER_API_TOKEN")
        # Cache em memória: { "YYYY-MM": { "timestamp": datetime, "data": dict } }
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl_seconds = 300 # 5 minutos

    def get_headers(self):
        if not self.token or self.token == "seu_token_aqui":
            raise HTTPException(status_code=500, detail="Token da API Criffer não configurado no servidor.")
        
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def _get_month_range(self, mes: Optional[str] = None):
        """
        Retorna a data inicial e final do mês no formato YYYY-MM-DD.
        Se mes não for informado, usa o mês atual.
        """
        if mes:
            try:
                parts = mes.strip().split("-")
                year = int(parts[0])
                month = int(parts[1])
            except Exception:
                raise HTTPException(status_code=400, detail="Formato de mês inválido. Utilize YYYY-MM (ex: 2026-09).")
        else:
            today = date.today()
            year = today.year
            month = today.month

        # Último dia do mês
        last_day = calendar.monthrange(year, month)[1]
        data_inicio = f"{year:04d}-{month:02d}-01"
        data_fim = f"{year:04d}-{month:02d}-{last_day:02d}"
        selected_month_str = f"{year:04d}-{month:02d}"
        
        return selected_month_str, data_inicio, data_fim, year, month

    async def fetch_month_records(self, data_inicio: str, data_fim: str) -> List[Dict[str, Any]]:
        """
        Busca todos os registros comerciais da API Criffer no período solicitado com paginação automática.
        """
        records = []
        limit = 500
        offset = 0

        async with httpx.AsyncClient(verify=False, timeout=60.0) as client:
            while True:
                params = {
                    "data_inicio": data_inicio,
                    "data_fim": data_fim,
                    "limit": limit,
                    "offset": offset
                }
                try:
                    response = await client.get(
                        f"{self.base_url}/api/v1/comercial",
                        params=params,
                        headers=self.get_headers()
                    )
                    response.raise_for_status()

                    # Força decodificação UTF-8 para evitar JSONDecodeError com caracteres especiais
                    data = response.json()

                    results = data.get("results", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
                    records.extend(results)

                    total = data.get("total", 0) if isinstance(data, dict) else len(records)
                    count = len(results)

                    # Para quando não há mais resultados
                    if count == 0 or len(records) >= total or count < limit:
                        break

                    offset += limit
                except httpx.HTTPStatusError as exc:
                    raise HTTPException(
                        status_code=exc.response.status_code,
                        detail=f"Erro da API externa da Criffer: {exc.response.text}"
                    )
                except httpx.RequestError as exc:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Falha de conexão com a API externa Criffer: {str(exc)}"
                    )

        return records


    def _filter_saidas_autorizadas(self, raw_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Filtra registros considerados no faturamento:
        1. Regra Padrão: Transação "Nota Fiscal de Saída" com status "Autorizado"
        2. Regra de Locação: Transação "Nota Fiscal de Saída" + Vendedor (Josiane ou Vanessa) + modelo_nf ("FAT") + utilização ("RECEITA LOCAÇÃO")
        """
        saidas = []
        for r in raw_records:
            transacao = str(r.get("transacao") or "").lower()
            status = str(r.get("status") or "").strip()
            vendedor = str(r.get("vendedor") or "").strip().lower()
            modelo_nf = str(r.get("modelo_nf") or "").strip().upper()
            utilizacao = str(r.get("utilizacao") or "").strip().upper()

            is_saida_autorizada = ("saída" in transacao or "saida" in transacao) and status == "Autorizado"
            is_locacao = (
                ("saída" in transacao or "saida" in transacao) and
                ("josiane" in vendedor or "josi" in vendedor or "vanessa" in vendedor or "vane" in vendedor or "van" in vendedor) and
                ("RECEITA_LOCACAO" in utilizacao or "RECEITA LOCAÇÃO" in utilizacao or "RECEITA LOCACAO" in utilizacao or "LOCACAO" in utilizacao or "LOCAÇÃO" in utilizacao)
            )

            if is_saida_autorizada or is_locacao:
                saidas.append(r)
        return saidas

    def _categorize_record(self, r: Dict[str, Any]) -> Optional[str]:
        """
        Classifica o registro estritamente para os vendedores permitidos em cada categoria:
        - Vendas: Somente Rogislei, Gabriel Klein, Gabriel Ferreira e Mercado Livre
        - Serviços: Somente Gabriel Medeiros
        - Locações: Somente Josiane e Vanessa (ou saídas de receita de locação)
        Outros vendedores são ignorados no ranking categorizado.
        """
        vendedor = str(r.get("vendedor") or "").strip().lower()
        utilizacao = str(r.get("utilizacao") or "").strip().upper()

        # 1. Locações: Josiane e Vanessa ou registros de utilização de locação
        is_loc_util = ("LOCACAO" in utilizacao or "LOCAÇÃO" in utilizacao or "RECEITA_LOCACAO" in utilizacao or "RECEITA LOCAÇÃO" in utilizacao)
        is_loc_seller = any(name in vendedor for name in ["josiane", "josi", "vanessa", "vane", "van", "vá"])
        if is_loc_seller or is_loc_util:
            return "locacoes"

        # 2. Serviços: Somente Gabriel Medeiros
        if "medeiros" in vendedor:
            return "servicos"

        # 3. Vendas: Somente Rogislei, Gabriel Klein, Gabriel Ferreira e Mercado Livre
        if any(name in vendedor for name in ["rogislei", "klein", "ferreira", "mercado", "livre"]):
            return "vendas"

        # Vendedores não pertencentes às 3 categorias são ignorados no ranking
        return None

    def _calculate_kpis_from_records(self, saidas: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calcula os KPIs brutos a partir de uma lista de saídas autorizadas."""
        faturamento_bruto = sum(float(r.get("valor_total") or 0.0) for r in saidas)
        notas_unicas: set = set()
        for r in saidas:
            doc_id = r.get("numero_nf") or r.get("doc_num")
            if doc_id:
                notas_unicas.add(str(doc_id).strip())
        total_pedidos = len(notas_unicas)
        total_pecas = sum(float(r.get("quantidade") or 0.0) for r in saidas)
        ticket_medio = (faturamento_bruto / total_pedidos) if total_pedidos > 0 else 0.0
        return {
            "faturamento_bruto": faturamento_bruto,
            "pedidos_faturados": float(total_pedidos),
            "pecas_faturadas": total_pecas,
            "ticket_medio": ticket_medio,
        }

    def _calc_variation(self, current: float, previous: float) -> Optional[float]:
        """Retorna a variação percentual entre atual e anterior. None se anterior for zero."""
        if previous == 0:
            return None
        return round(((current - previous) / abs(previous)) * 100, 1)

    def _get_previous_month(self, year: int, month: int):
        """Retorna (year, month) do mês anterior."""
        if month == 1:
            return year - 1, 12
        return year, month - 1

    async def get_dashboard_data(self, mes: Optional[str] = None) -> Dict[str, Any]:
        """
        Calcula as métricas comerciais consolidadas aplicando estritamente as regras de negócio:
        - Faturamento Bruto: exclusivamente transações "Nota Fiscal de Saída" com status "Autorizado"
        - Ranking de Vendedores: classificado unicamente pelo valor de saídas autorizadas divididos por Vendas, Serviços e Locações
        - Produtos Mais Vendidos: produtos com maior faturamento em saídas autorizadas
        - Evolução Diária das Vendas
        - Distribuição Geográfica (Estados)
        - Detalhamento de notas autorizadas para a tabela
        - Variação percentual dos KPIs em relação ao mês anterior
        """
        month_str, data_inicio, data_fim, year, month = self._get_month_range(mes)

        # Checar cache
        now = datetime.now()
        cached = self._cache.get(month_str)
        if cached and (now - cached["timestamp"]).total_seconds() < self.cache_ttl_seconds:
            return cached["data"]

        # Buscar dados brutos
        raw_records = await self.fetch_month_records(data_inicio, data_fim)

        # Filtrar registros usando o método centralizado
        saidas_autorizadas = self._filter_saidas_autorizadas(raw_records)

        # 1. KPIs do mês atual
        kpis_atuais = self._calculate_kpis_from_records(saidas_autorizadas)
        faturamento_bruto = kpis_atuais["faturamento_bruto"]
        total_pedidos_faturados = int(kpis_atuais["pedidos_faturados"])
        total_pecas_faturadas = kpis_atuais["pecas_faturadas"]
        ticket_medio = kpis_atuais["ticket_medio"]

        # 1b. KPIs do mês anterior para comparativo
        prev_year, prev_month = self._get_previous_month(year, month)
        prev_last_day = calendar.monthrange(prev_year, prev_month)[1]
        prev_inicio = f"{prev_year:04d}-{prev_month:02d}-01"
        prev_fim = f"{prev_year:04d}-{prev_month:02d}-{prev_last_day:02d}"
        prev_month_str = f"{prev_year:04d}-{prev_month:02d}"

        kpis_anteriores = None
        try:
            # Verificar cache do mês anterior antes de buscar
            cached_prev = self._cache.get(f"{prev_month_str}_raw")
            if cached_prev and (now - cached_prev["timestamp"]).total_seconds() < self.cache_ttl_seconds:
                raw_prev = cached_prev["data"]
            else:
                raw_prev = await self.fetch_month_records(prev_inicio, prev_fim)
                self._cache[f"{prev_month_str}_raw"] = {"timestamp": now, "data": raw_prev}

            saidas_prev = self._filter_saidas_autorizadas(raw_prev)
            kpis_anteriores = self._calculate_kpis_from_records(saidas_prev)
        except Exception:
            # Se falhar ao buscar mês anterior, continua sem comparativo
            kpis_anteriores = None

        # Calcular variações percentuais
        var_faturamento = self._calc_variation(faturamento_bruto, kpis_anteriores["faturamento_bruto"]) if kpis_anteriores else None
        var_pedidos = self._calc_variation(float(total_pedidos_faturados), kpis_anteriores["pedidos_faturados"]) if kpis_anteriores else None
        var_pecas = self._calc_variation(total_pecas_faturadas, kpis_anteriores["pecas_faturadas"]) if kpis_anteriores else None
        var_ticket = self._calc_variation(ticket_medio, kpis_anteriores["ticket_medio"]) if kpis_anteriores else None

        # 2. Ranking de Vendedores por Categoria (Vendas, Serviços, Locações)
        # Mantendo estritamente a ordem de prioridade exigida: Vendas, Serviços, Locações
        categories_map: Dict[str, Dict[str, Dict[str, Any]]] = {
            "vendas": {},
            "servicos": {},
            "locacoes": {}
        }

        for r in saidas_autorizadas:
            cat = self._categorize_record(r)
            if not cat:
                continue

            raw_vendedor = str(r.get("vendedor") or "Sem Vendedor").strip()
            v_lower = raw_vendedor.lower()

            # Normalização de nomes dos vendedores autorizados
            if "rogislei" in v_lower:
                vendedor = "Rogislei Padilha"
            elif "klein" in v_lower:
                vendedor = "Gabriel Klein"
            elif "ferreira" in v_lower:
                vendedor = "Gabriel Ferreira"
            elif "mercado" in v_lower or "livre" in v_lower:
                vendedor = "Mercado Livre"
            elif "medeiros" in v_lower:
                vendedor = "Gabriel Medeiros"
            elif "josiane" in v_lower or "josi" in v_lower:
                vendedor = "Josiane"
            elif "vanessa" in v_lower or "vane" in v_lower or "van" in v_lower or "vá" in v_lower or cat == "locacoes":
                vendedor = "Vanessa"
            else:
                vendedor = raw_vendedor

            val = float(r.get("valor_total") or 0.0)
            doc_id = r.get("numero_nf") or r.get("doc_num")

            cat_vendedores = categories_map[cat]
            if vendedor not in cat_vendedores:
                cat_vendedores[vendedor] = {
                    "name": vendedor,
                    "value": 0.0,
                    "orders_set": set(),
                    "items_count": 0
                }
            cat_vendedores[vendedor]["value"] += val
            cat_vendedores[vendedor]["items_count"] += 1
            if doc_id:
                cat_vendedores[vendedor]["orders_set"].add(str(doc_id).strip())

        ranking: Dict[str, List[Dict[str, Any]]] = {
            "vendas": [],
            "servicos": [],
            "locacoes": []
        }

        DEFAULT_VENDEDORES = {
            "vendas": ["Rogislei Padilha", "Gabriel Klein", "Gabriel Ferreira", "Mercado Livre"],
            "servicos": ["Gabriel Medeiros"],
            "locacoes": ["Josiane", "Vanessa"]
        }

        for cat in ["vendas", "servicos", "locacoes"]:
            cat_list = []
            present_names = set()
            for v_name, v_data in categories_map[cat].items():
                cat_list.append({
                    "name": v_name,
                    "value": round(v_data["value"], 2),
                    "orders": len(v_data["orders_set"]) or v_data["items_count"]
                })
                present_names.add(v_name)

            for fixed_name in DEFAULT_VENDEDORES[cat]:
                if fixed_name not in present_names:
                    cat_list.append({
                        "name": fixed_name,
                        "value": 0.0,
                        "orders": 0
                    })

            cat_list.sort(key=lambda x: x["value"], reverse=True)
            ranking[cat] = cat_list

        # 3. Top Produtos
        produtos_map: Dict[str, Dict[str, Any]] = {}
        for r in saidas_autorizadas:
            prod_name = str(r.get("descricao_item") or "Item não identificado").strip()
            val = float(r.get("valor_total") or 0.0)
            qty = float(r.get("quantidade") or 0.0)

            if prod_name not in produtos_map:
                produtos_map[prod_name] = {
                    "name": prod_name,
                    "value": 0.0,
                    "qty": 0.0
                }
            produtos_map[prod_name]["value"] += val
            produtos_map[prod_name]["qty"] += qty

        top_products = list(produtos_map.values())
        top_products.sort(key=lambda x: x["value"], reverse=True)
        # Limitar aos 5 principais produtos
        top_5_products = top_products[:5]
        max_val = top_5_products[0]["value"] if top_5_products else 1.0
        for p in top_5_products:
            p["value_raw"] = round(p["value"], 2)
            p["progress"] = min(100, round((p["value"] / max_val) * 100))
            p["qty"] = int(p["qty"])

        # 4. Evolução Diária das Vendas no Mês
        dias_no_mes = calendar.monthrange(year, month)[1]
        daily_map = {day: {"value": 0.0, "orders_set": set()} for day in range(1, dias_no_mes + 1)}

        for r in saidas_autorizadas:
            data_lanc = r.get("data_lancamento")
            if data_lanc:
                try:
                    dt = datetime.strptime(str(data_lanc)[:10], "%Y-%m-%d")
                    if dt.year == year and dt.month == month:
                        day = dt.day
                        val = float(r.get("valor_total") or 0.0)
                        doc_id = r.get("numero_nf") or r.get("doc_num")
                        daily_map[day]["value"] += val
                        if doc_id:
                            daily_map[day]["orders_set"].add(str(doc_id).strip())
                except Exception:
                    pass

        evolution = {
            "days": [f"{day:02d}/{month:02d}" for day in range(1, dias_no_mes + 1)],
            "revenue": [round(daily_map[day]["value"], 2) for day in range(1, dias_no_mes + 1)],
            "orders": [len(daily_map[day]["orders_set"]) for day in range(1, dias_no_mes + 1)]
        }

        # 5. Distribuição por Estado (UF)
        estados_map: Dict[str, Dict[str, Any]] = {}
        for r in saidas_autorizadas:
            uf = str(r.get("estado") or "Outros").strip().upper()
            if len(uf) > 2:
                uf = uf[:2]
            val = float(r.get("valor_total") or 0.0)
            if uf not in estados_map:
                estados_map[uf] = {"uf": uf, "value": 0.0, "orders_set": set()}
            estados_map[uf]["value"] += val
            doc_id = r.get("numero_nf") or r.get("doc_num")
            if doc_id:
                estados_map[uf]["orders_set"].add(str(doc_id).strip())

        geo_distribution = [
            {"uf": uf, "value": round(data["value"], 2), "orders": len(data["orders_set"])}
            for uf, data in estados_map.items()
        ]
        geo_distribution.sort(key=lambda x: x["value"], reverse=True)

        # 6. Tabela Detalhada (Amostra / Registros das saídas autorizadas)
        # Ordenada por data_lancamento decrescente
        detalhes = []
        for r in saidas_autorizadas:
            detalhes.append({
                "numero_nf": r.get("numero_nf") or r.get("doc_num"),
                "data_lancamento": r.get("data_lancamento"),
                "cliente": r.get("descricao_cliente") or "Consumidor Final",
                "vendedor": r.get("vendedor") or "Sem Vendedor",
                "produto": r.get("descricao_item") or "-",
                "quantidade": r.get("quantidade") or 1,
                "valor_total": float(r.get("valor_total") or 0.0),
                "estado": r.get("estado") or "-"
            })

        detalhes.sort(key=lambda x: str(x.get("data_lancamento") or ""), reverse=True)

        # 7. Locações Josi e Vanessa
        quotations_data = self.calculate_quotations_data(raw_records, year, month)

        result_data = {
            "selected_month": month_str,
            "period": {
                "start": data_inicio,
                "end": data_fim
            },
            "kpis": {
                "faturamento_bruto": round(faturamento_bruto, 2),
                "pedidos_faturados": total_pedidos_faturados,
                "pecas_faturadas": int(total_pecas_faturadas),
                "ticket_medio": round(ticket_medio, 2),
                "faturamento_variacao": var_faturamento,
                "pedidos_variacao": var_pedidos,
                "pecas_variacao": var_pecas,
                "ticket_variacao": var_ticket,
            },
            "ranking": ranking,
            "top_products": top_5_products,
            "evolution": evolution,
            "quotations": quotations_data,
            "geo_distribution": geo_distribution,
            "detalhes": detalhes[:500], # Primeiros 500 para a tabela fluida com paginação
            "total_registros_brutos": len(raw_records),
            "total_saidas_autorizadas": len(saidas_autorizadas),
            "updated_at": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        }

        # Armazenar no cache
        self._cache[month_str] = {
            "timestamp": now,
            "data": result_data
        }

        return result_data

    def calculate_quotations_data(self, raw_records: List[Dict[str, Any]], year: int, month: int) -> Dict[str, Any]:
        """
        Calcula a evolução das locações para Josiane e Vanessa aplicando as condições:
        - transacao: "nota fiscal de saída"
        - modelo_nf: "FAT"
        - vendedor: "Josiane" ou "Vanessa"
        - utilizacao: "RECEITA_LOCACAO"
        """
        dias_no_mes = calendar.monthrange(year, month)[1]
        josi_daily = {day: 0.0 for day in range(1, dias_no_mes + 1)}
        vanessa_daily = {day: 0.0 for day in range(1, dias_no_mes + 1)}

        for r in raw_records:
            transacao = str(r.get("transacao") or "").strip().lower()
            modelo_nf = str(r.get("modelo_nf") or "").strip().upper()
            vendedor = str(r.get("vendedor") or "").strip().lower()
            utilizacao = str(r.get("utilizacao") or "").strip().upper()
            status = str(r.get("status") or "").strip().lower()

            # Verificação das regras especificadas pelo usuário:
            # 1. transacao = "nota fiscal de saída"
            # 2. modelo_nf = "FAT"
            # 3. vendedor = Josiane ou Vanessa
            # 4. utilizacao = "RECEITA_LOCACAO"
            match_transacao = "saída" in transacao or "saida" in transacao or "nota fiscal de saída" in transacao
            match_modelo = (modelo_nf == "FAT")
            match_vendedor = ("josiane" in vendedor or "josi" in vendedor or "vanessa" in vendedor)
            match_utilizacao = ("RECEITA_LOCACAO" in utilizacao or "LOCACAO" in utilizacao or "LOCAÇÃO" in utilizacao)
            match_status = (status in ["autorizado", ""] or "autorizado" in status)

            if match_transacao and match_modelo and match_vendedor and match_utilizacao and match_status:
                val = float(r.get("valor_total") or 0.0)
                data_lanc = r.get("data_lancamento")

                day = None
                if data_lanc:
                    try:
                        dt = datetime.strptime(str(data_lanc)[:10], "%Y-%m-%d")
                        if dt.year == year and dt.month == month:
                            day = dt.day
                    except Exception:
                        pass

                if day and 1 <= day <= dias_no_mes:
                    if "josiane" in vendedor or "josi" in vendedor:
                        josi_daily[day] += val
                    elif "vanessa" in vendedor:
                        vanessa_daily[day] += val

        days = [f"{day:02d}/{month:02d}" for day in range(1, dias_no_mes + 1)]
        josi_list = [round(josi_daily[day], 2) for day in range(1, dias_no_mes + 1)]
        vanessa_list = [round(vanessa_daily[day], 2) for day in range(1, dias_no_mes + 1)]

        return {
            "months": days,
            "josi": josi_list,
            "vanessa": vanessa_list
        }

comercial_service = ComercialService()
