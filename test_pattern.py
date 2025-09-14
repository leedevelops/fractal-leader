#!/usr/bin/env python3
import json
import numpy as np

# Test the pattern analysis logic directly
def test_pattern_analysis():
    # Mock diverse team data - some chaos, some alignment
    test_logs = [
        {"timestamp": 1000, "message": "Strategic planning session", "parent": None, "user_id": "leader_1"},
        {"timestamp": 1001, "message": "Great vision!", "parent": 1000, "user_id": "member_1"},
        {"timestamp": 1002, "message": "How do we execute?", "parent": 1000, "user_id": "member_2"},
        {"timestamp": 1003, "message": "I can lead implementation", "parent": 1000, "user_id": "member_3"},
        {"timestamp": 1004, "message": "Daily standup time", "parent": None, "user_id": "leader_1"},
        {"timestamp": 1005, "message": "Progress update", "parent": 1004, "user_id": "member_1"},
        {"timestamp": 1006, "message": "Blocked on resources", "parent": 1004, "user_id": "member_2"},
        {"timestamp": 1007, "message": "I'll help unblock", "parent": 1006, "user_id": "leader_1"},
    ]
    
    # Run the pattern analysis logic
    team_members = set(msg.get('user_id', 'unknown') for msg in test_logs)
    times = [msg['timestamp'] for msg in test_logs]
    branches = [len([r for r in test_logs if r.get('parent') == parent]) for parent in times]
    fractal_dim = float(np.var(branches))
    
    PATTERN_IDEAL = 2.8
    pattern_score = max(0, 1 - abs(fractal_dim - PATTERN_IDEAL) / PATTERN_IDEAL)
    
    message_counts = {}
    for msg in test_logs:
        user = msg.get('user_id', 'unknown')
        message_counts[user] = message_counts.get(user, 0) + 1
    
    counts = list(message_counts.values())
    ripple_score = 1 - (np.std(counts) / np.mean(counts)) if np.mean(counts) > 0 else 0
    ripple_score = max(0, min(1, ripple_score))
    
    tier = min(25, max(1, int(len(team_members) * (fractal_dim / 5) + 1)))
    
    print("🔮 FRACTAL LEADER PATTERN ANALYSIS")
    print("=" * 40)
    print(f"👥 Team Size: {len(team_members)} members")
    print(f"📊 Fractal Dimension: {fractal_dim:.3f}")
    print(f"✨ Pattern Score: {pattern_score:.3f} (vs ideal {PATTERN_IDEAL})")
    print(f"🌊 Ripple Score: {ripple_score:.3f}")
    print(f"🎯 Current Tier: {tier}/25")
    print(f"💬 Message Distribution: {message_counts}")
    print("=" * 40)
    
    status = "PATTERN_ALIGNED" if pattern_score >= 0.7 and ripple_score >= 0.75 else "SEEKING_ALIGNMENT"
    print(f"🚀 Status: {status}")
    
    if pattern_score >= 0.7:
        print("✅ Team aligned to The Pattern (Christ)")
    else:
        print("⚠️  Team seeking better alignment")
        
    if ripple_score >= 0.75:
        print("✅ Ripple effect flowing (Paul-like influence)")
    else:
        print("⚠️  Ripple effect needs strengthening")

if __name__ == "__main__":
    test_pattern_analysis()