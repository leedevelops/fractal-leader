from flask import Flask, request, jsonify
import numpy as np
from scipy import stats

app = Flask(__name__)

@app.route('/fractal_scan', methods=['POST'])
def fractal_scan():
    # Input: JSON with 'logs' (list of messages with timestamps, sender, replies)
    logs = request.json.get('logs', [])
    if not logs:
        return jsonify({'error': 'No logs provided'}), 400

    # Simulate 25 tiers: group logs by time windows (e.g., daily decisions)
    tiers = [[] for _ in range(25)]
    for msg in logs:
        # Fake tier assignment: map timestamp to 1-25 based on hour
        hour = int(msg.get('timestamp', 0) % 24) // 1 + 1  # 1-25 tiers
        tiers[hour-1].append(msg)

    # Calc fractal dim per tier (branching factor variance)
    fractal_dims = []
    for tier in tiers:
        if not tier:
            fractal_dims.append(0)
            continue
        # Count replies per message as branching
        branches = [len(msg.get('replies', [])) for msg in tier]
        dim = np.var(branches) if branches else 0  # Variance as chaos proxy
        fractal_dims.append(round(dim, 2))

    # Pattern (Christ): Compare to ideal dim (2.8)
    ideal_dim = 2.8
    alignment_scores = [abs(dim - ideal_dim) < 0.5 for dim in fractal_dims]  # Within 0.5 is "aligned"

    # Ripple (Paul): Measure influence spread (avg replies per sender)
    senders = {}
    for msg in logs:
        sender = msg.get('sender', 'unknown')
        replies = len(msg.get('replies', []))
        senders[sender] = senders.get(sender, 0) + replies
    ripple_score = round(np.mean(list(senders.values())) if senders else 0, 2)

    return jsonify({
        'fractal_tiers': fractal_dims,  # 25-tier chaos levels
        'pattern_alignment': alignment_scores,  # True if tier matches ideal
        'ripple_score': ripple_score  # Influence spread
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)