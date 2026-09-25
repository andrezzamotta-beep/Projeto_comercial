import os
import httpx
from fastapi import HTTPException

class CrifferApiService:
    def __init__(self):
        self.base_url = os.getenv("CRIFFER_API_URL", "https://api.criffer.com.br")
        self.token = os.getenv("CRIFFER_API_TOKEN")

    def get_headers(self):
        if not self.token or self.token == "seu_token_aqui":
            raise HTTPException(status_code=500, detail="Token da API Criffer não configurado no servidor.")
        
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    async def get_data(self, endpoint: str):
        """
        Busca dados na API externa de forma genérica.
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        async with httpx.AsyncClient(verify=False) as client:
            try:
                response = await client.get(url, headers=self.get_headers())
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as exc:
                raise HTTPException(
                    status_code=exc.response.status_code,
                    detail=f"Erro da API externa: {exc.response.text}"
                )
            except httpx.RequestError as exc:
                raise HTTPException(
                    status_code=500,
                    detail=f"Erro de conexão com a API externa: {str(exc)}"
                )

# Instância única para ser utilizada nas rotas
criffer_api_service = CrifferApiService()
