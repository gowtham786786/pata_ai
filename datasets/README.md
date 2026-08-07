# Datasets

This folder is for storing static data used by the AI service, primarily the **All India Pincode Directory CSV**.

## Instructions for Setup
1. Download the latest `All India Pincode Directory` dataset in CSV format.
2. Place the file in this directory and name it `pincode_data.csv`.

*Note: This data is loaded into memory by the Python FastAPI service on startup to ensure sub-500ms processing times without database bottlenecks.*
