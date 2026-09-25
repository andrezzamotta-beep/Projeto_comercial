from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from typing import Optional
from datetime import date
from dotenv import load_dotenv

# Importação dos serviços
from services.sap_service import sap_service
from services.excel_service import excel_service
from services.criffer_api_service import criffer_api_service
from services.comercial_service import comercial_service

load_dotenv()

app = FastAPI(
    title="Criffer Commercial Dashboard API",
    description="Backend oficial FastAPI para o Dashboard Comercial da Criffer",
    version="2.0.0"
)

# Configuração de CORS para permitir acesso do frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montagem dos arquivos estáticos para fotos dos vendedores
assets_path = os.path.join(os.path.dirname(__file__), "assets")
if not os.path.exists(assets_path):
    os.makedirs(assets_path)
    os.makedirs(os.path.join(assets_path, "vendedores"), exist_ok=True)

app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Criffer Commercial Dashboard API",
        "version": "2.0.0"
    }

@app.get("/api/comercial/dashboard")
async def get_commercial_dashboard(
    mes: Optional[str] = Query(
        None, 
        description="Mês no formato YYYY-MM (ex: 2026-09). Caso omitido, calcula para o mês atual."
    )
):
    """
    Retorna o consolidado completo do dashboard para o mês informado ou mês atual:
    - KPIs (Faturamento Bruto de NF Saída Autorizada, Pedidos/Notas, Peças, Ticket Médio)
    - Ranking de vendedores por saídas autorizadas
    - Top produtos mais vendidos
    - Evolução diária no mês
    - Distribuição geográfica por UF
    - Detalhes das transações autorizadas para a tabela
    """
    return await comercial_service.get_dashboard_data(mes=mes)

@app.get("/api/comercial/cotacoes")
async def get_commercial_quotations(
    mes: Optional[str] = Query(None, description="Mês no formato YYYY-MM")
):
    """
    Retorna os dados reais de locações de Vanessa e Josiane (modelo_nf: FAT, RECEITA_LOCACAO) filtrados da API Criffer.
    """
    dashboard_data = await comercial_service.get_dashboard_data(mes=mes)
    return dashboard_data.get("quotations", {
        "months": [],
        "josi": [],
        "vanessa": []
    })

@app.get("/api/comercial/meses")
async def get_available_months():
    """
    Retorna a lista dos últimos 12 meses disponíveis para o seletor de filtros no frontend.
    """
    meses_nomes = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ]
    today = date.today()
    cur_year = today.year
    cur_month = today.month

    lista = []
    # Gera os últimos 12 meses decrescentes
    for i in range(12):
        m = cur_month - i
        y = cur_year
        while m <= 0:
            m += 12
            y -= 1
        val = f"{y:04d}-{m:02d}"
        label = f"{meses_nomes[m - 1]} {y}"
        lista.append({"value": val, "label": label, "isCurrent": (i == 0)})

    return lista

@app.get("/api/ranking")
async def get_ranking(
    mes: Optional[str] = Query(None, description="Mês no formato YYYY-MM")
):
    """
    Endpoint para retornar o ranking de vendedores calculado a partir das saídas autorizadas.
    """
    dashboard_data = await comercial_service.get_dashboard_data(mes=mes)
    base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    
    ranking_com_fotos = []
    for idx, item in enumerate(dashboard_data.get("ranking", []), start=1):
        ranking_com_fotos.append({
            "id": str(idx),
            "name": item["name"],
            "value": item["value"],
            "orders": item["orders"],
            "photo_url": f"{base_url}/assets/vendedores/{idx}.webp"
        })
    return ranking_com_fotos

@app.get("/api/criffer/{endpoint:path}")
async def proxy_criffer_api(endpoint: str):
    """
    Proxy seguro para a API externa da Criffer.
    """
    data = await criffer_api_service.get_data(endpoint)
    return data

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
