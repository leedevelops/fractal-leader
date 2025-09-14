#!/usr/bin/env python3
import json
import numpy as np

def test_25_tiers():
    """Test the refined 25 Fractal Tiers system"""
    
    # Mock team data with replies structure
    test_logs = [
        {"timestamp": 1000, "sender": "leader", "message": "Strategic planning", "replies": [1, 2, 3]},
        {"timestamp": 1001, "sender": "dev1", "message": "I can build this", "replies": [4]},
        {"timestamp": 1002, "sender": "dev2", "message": "Timeline concerns", "replies": [5, 6]},
        {"timestamp": 1025, "sender": "leader", "message": "Daily standup", "replies": [7, 8, 9, 10]},
        {"timestamp": 1026, "sender": "dev1", "message": "Progress update", "replies": []},
        {"timestamp": 1050, "sender": "leader", "message": "Team sync", "replies": [11, 12]},
        {"timestamp": 1051, "sender": "dev2", "message": "Blocker found", "replies": [13]},
    ]
    
    # Simulate the fractal_scan logic
    tiers = [[] for _ in range(25)]
    for msg in test_logs:
        hour = int(msg.get('timestamp', 0) % 24) // 1 + 1
        tiers[hour-1].append(msg)
    
    fractal_dims = []
    for tier in tiers:
        if not tier:
            fractal_dims.append(0)
            continue
        branches = [len(msg.get('replies', [])) for msg in tier]
        dim = np.var(branches) if branches else 0
        fractal_dims.append(round(dim, 2))
    
    ideal_dim = 2.8
    alignment_scores = [abs(dim - ideal_dim) < 0.5 for dim in fractal_dims]
    
    senders = {}
    for msg in test_logs:
        sender = msg.get('sender', 'unknown')
        replies = len(msg.get('replies', []))
        senders[sender] = senders.get(sender, 0) + replies
    ripple_score = round(np.mean(list(senders.values())) if senders else 0, 2)
    
    print("🌟 25 FRACTAL TIERS: PATTERN & RIPPLE ANALYSIS")
    print("=" * 50)
    print(f"📊 Active Tiers: {sum(1 for dim in fractal_dims if dim > 0)}/25")
    print(f"🎯 Pattern Aligned Tiers: {sum(alignment_scores)}")
    print(f"🌊 Ripple Score: {ripple_score} (avg influence spread)")
    print("\n🔮 Tier Breakdown:")
    
    for i, (dim, aligned) in enumerate(zip(fractal_dims, alignment_scores)):
        if dim > 0:  # Only show active tiers
            status = "✅ ALIGNED" if aligned else "⚠️  SEEKING"
            print(f"  Tier {i+1:2d}: {dim:4.1f} chaos → {status}")
    
    print("\n👥 Leadership Influence:")
    for sender, influence in senders.items():
        print(f"  {sender}: {influence} replies (ripple strength)")
    
    print("=" * 50)
    overall_health = sum(alignment_scores) / len([d for d in fractal_dims if d > 0]) if any(fractal_dims) else 0
    print(f"🚀 Team Health: {overall_health:.1%} Pattern-Aligned")

if __name__ == "__main__":
    test_25_tiers()