import os
import sys

os.environ["PYTHONIOENCODING"] = "utf-8"
from gradio_client import Client

client = Client("http://127.0.0.1:7860/", verbose=False)
print("Connected!")
api_info = client.view_api(return_format="dict")
print("Endpoints:", list(api_info.get("named_endpoints", {}).keys()))
