import requests
import json

# Test data - mock Slack logs
test_data = {
    "logs": [
        {"timestamp": 1000, "message": "Hey team", "parent": None},
        {"timestamp": 1001, "message": "Reply 1", "parent": 1000},
        {"timestamp": 1002, "message": "Reply 2", "parent": 1000},
        {"timestamp": 1003, "message": "New thread", "parent": None},
        {"timestamp": 1004, "message": "Another reply", "parent": 1000},
        {"timestamp": 1005, "message": "Thread 3", "parent": None}
    ]
}

try:
    response = requests.post('http://localhost:8080/fractal_scan', json=test_data)
    result = response.json()
    print(f"Fractal dimension: {result['fractal_dim']}")
    print(f"Alert triggered: {result['alert']}")
except Exception as e:
    print(f"Error testing: {e}")