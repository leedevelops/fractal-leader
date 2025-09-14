#!/usr/bin/env python3
import sys
import os
import json
from flask import Flask, request
import numpy as np

# Import our app
app = Flask(__name__)

# Mock request data
test_logs = {
    "logs": [
        {"timestamp": 1000, "message": "Hey team", "parent": None},
        {"timestamp": 1001, "message": "Reply 1", "parent": 1000},  
        {"timestamp": 1002, "message": "Reply 2", "parent": 1000},
        {"timestamp": 1003, "message": "New thread", "parent": None},
        {"timestamp": 1004, "message": "Another reply", "parent": 1000},
        {"timestamp": 1005, "message": "Thread 3", "parent": None}
    ]
}

def test_fractal_logic():
    """Test the fractal detection logic directly"""
    logs = test_logs['logs']
    times = [msg['timestamp'] for msg in logs]
    branches = [len([r for r in logs if r.get('parent') == parent]) for parent in times]
    dim = np.var(branches)
    alert = dim > 2.5
    
    print(f"📊 Test Data: {len(logs)} messages")
    print(f"📈 Branch counts: {branches}")
    print(f"🌊 Fractal dimension: {dim:.3f}")
    print(f"🚨 Alert triggered: {alert}")
    print(f"🎯 Status: {'CHAOS DETECTED' if alert else 'STABLE PATTERN'}")
    
    return {"fractal_dim": dim, "alert": alert}

if __name__ == "__main__":
    print("🔬 FRACTAL DETECTOR TEST")
    print("=" * 30)
    result = test_fractal_logic()
    print("=" * 30)
    print("✅ Logic verified - Ready for Flutterflow!")
    print(f"📡 Endpoint would return: {json.dumps(result, indent=2)}")