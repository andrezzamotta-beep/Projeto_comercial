import os
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

class ExcelService:
    def __init__(self):
        self.base_path = os.getenv("EXCEL_FILES_PATH", "./data")

    def read_excel(self, filename, sheet_name=0):
        file_path = os.path.join(self.base_path, filename)
        
        if not os.path.exists(file_path):
            print(f"Arquivo Excel não encontrado: {file_path}")
            return None
        
        try:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            # Remove valores nulos para JSON seguro
            df = df.where(pd.notnull(df), None)
            return df.to_dict(orient="records")
        except Exception as e:
            print(f"Erro ao ler arquivo Excel {filename}: {e}")
            return None

# Instância única para ser usada na aplicação
excel_service = ExcelService()
