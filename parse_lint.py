import json

with open('lint_results.json', encoding='utf-8-sig') as f:
    data = json.load(f)

for file in data:
    for m in file['messages']:
        if m['severity'] == 2:
            print(f"{file['filePath']}:{m['line']}: {m['message']} ({m.get('ruleId')})")
