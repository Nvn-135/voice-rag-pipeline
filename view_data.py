import pandas as pd

print("hinval.parquet reading...\n")


df = pd.read_parquet('hinval.parquet')


print("--- first 2 Rows ---")
print(df.head(2).to_string())

print("\n--- Data Columns ---")
print(list(df.columns))