import pandas as pd
import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path

# Set paths based on your folder structure
base_dir = Path(__file__).resolve().parent.parent
db_path = str(base_dir / "medical_db")
csv_path = base_dir / "nlem_2022.csv"

# 1. Setup Persistent Storage
client = chromadb.PersistentClient(path=db_path)
sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

# 2. Create the Collection
collection = client.get_or_create_collection(
    name="nlem_2022_grounding",
    embedding_function=sentence_transformer_ef
)

def ingest_data():
    if not csv_path.exists():
        print(f"❌ Error: {csv_path} not found!")
        return

    print(f"Reading {csv_path}...")
    df = pd.read_csv(csv_path)
    
    documents, metadatas, ids = [], [], []
    
    for i, row in df.iterrows():
        content = f"Medicine: {row['drug_name']}. Category: {row['category']}. Indication: {row['indication']}."
        documents.append(content)
        metadatas.append({"schedule": row['schedule'], "drug_name": row['drug_name']})
        ids.append(f"drug_{i}")

    print("Uploading to Medical Knowledge Base...")
    collection.add(documents=documents, metadatas=metadatas, ids=ids)
    print(f"✅ Successfully ingested {len(documents)} medical records into {db_path}!")

if __name__ == "__main__":
    ingest_data()