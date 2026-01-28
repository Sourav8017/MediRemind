import chromadb
import shutil
import os
import csv
import sys

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "medical_db")
CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "nlem_2022.csv")

def reset_database():
    print(f"Resetting ChromeDB at {DB_PATH}...")
    
    # 1. Delete existing DB
    if os.path.exists(DB_PATH):
        try:
            shutil.rmtree(DB_PATH)
            print("✅ Deleted existing database directory.")
        except Exception as e:
            print(f"❌ Failed to delete directory: {e}")
            sys.exit(1)
    
    # 2. Re-create Client & Collection
    try:
        client = chromadb.PersistentClient(path=DB_PATH)
        collection = client.create_collection(name="nlem_2022_grounding")
        print("✅ Created new collection 'nlem_2022_grounding'.")
    except Exception as e:
        print(f"❌ Failed to create collection: {e}")
        sys.exit(1)

    # 3. Ingest Data
    if not os.path.exists(CSV_PATH):
        print(f"❌ CSV file not found at {CSV_PATH}")
        sys.exit(1)

    documents = []
    metadatas = []
    ids = []

    print(f"Reading data from {CSV_PATH}...")
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            # Create a rich text document for RAG
            text = (f"Drug: {row['drug_name']}. Category: {row['category']}. "
                    f"Schedule: {row['schedule']}. Indication: {row['indication']}. "
                    f"Dosage Form: {row['dosage_form']}.")
            
            # Add specific compliance warning in the text itself for better retrieval matches
            if row['schedule'] in ['H', 'H1']:
                text += " WARNING: Schedule H/H1 Drug - Requires Prescription."

            documents.append(text)
            metadatas.append(row)
            ids.append(f"drug_{i}")

    if documents:
        collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        print(f"✅ Ingested {len(documents)} records.")
    else:
        print("⚠️ No data found in CSV.")

    print(f"🎉 Database reset complete. Total count: {collection.count()}")

if __name__ == "__main__":
    reset_database()
