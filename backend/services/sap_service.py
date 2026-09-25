import os
from hdbcli import dbapi
from dotenv import load_dotenv

load_dotenv()

class SAPService:
    def __init__(self):
        self.host = os.getenv("SAP_HANA_HOST")
        self.port = os.getenv("SAP_HANA_PORT")
        self.user = os.getenv("SAP_HANA_USER")
        self.password = os.getenv("SAP_HANA_PASSWORD")

    def get_connection(self):
        try:
            conn = dbapi.connect(
                address=self.host,
                port=int(self.port) if self.port else 30015,
                user=self.user,
                password=self.password
            )
            return conn
        except Exception as e:
            print(f"Erro ao conectar ao SAP HANA: {e}")
            return None

    def execute_query(self, query):
        conn = self.get_connection()
        if not conn:
            return []
        
        try:
            cursor = conn.cursor()
            cursor.execute(query)
            
            # Obtém os nomes das colunas
            columns = [column[0] for column in cursor.description]
            
            # Converte os resultados para uma lista de dicionários
            results = []
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))
            
            cursor.close()
            conn.close()
            return results
        except Exception as e:
            print(f"Erro ao executar query no SAP HANA: {e}")
            if conn:
                conn.close()
            return []

# Instância única para ser usada na aplicação
sap_service = SAPService()
