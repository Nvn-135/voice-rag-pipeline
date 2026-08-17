import pyarrow.parquet as pq
import json

print("1. Reading local Parquet file...")

try:
    
    local_file_path = 'hinval.parquet'
    
    
    parquet_file = pq.ParquetFile(local_file_path)
    sample_data = []

    print("2. Memory-safe extraction has started...")
    count = 0
    
   
    for batch in parquet_file.iter_batches(batch_size=50):
        df = batch.to_pandas()
        
        for index, row in df.iterrows():
            query = row.get('query', '')
            passages_dict = row.get('passages', {})
            
            if isinstance(passages_dict, dict):
                is_selected_list = passages_dict.get('is_selected', [])
                eng_passages = passages_dict.get('English_passages', [])
                trans_passages = passages_dict.get('Translated_passages', [])
                
                # Extracting the correct answer
                for idx, is_sel in enumerate(is_selected_list):
                    if is_sel == 1 and idx < len(eng_passages) and idx < len(trans_passages):
                        sample_data.append({
                            "query": query,
                            "content": trans_passages[idx],
                            "english_content": eng_passages[idx],
                            "row_id": int(row.get('query_id', index))
                        })
                        count += 1
                        break
        

    # Saving data in JSON format
    with open('msmarco_sample.json', 'w', encoding='utf-8') as f:
        json.dump(sample_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Success! {len(sample_data)} Passages were saved to 'msmarco_sample.json' from the local file.")

except FileNotFoundError:
    print("❌ Error: The 'hinval.parquet' file was not found. Did you save it in this folder?")
except Exception as e:
    print(f"❌ Error : {e}")