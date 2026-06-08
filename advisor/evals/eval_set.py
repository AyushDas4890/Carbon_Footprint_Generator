"""
Gold evaluation set for the RAG advisor.

Each entry is a question we expect the system to answer correctly given
the seed knowledge base. `must_contain` = substrings the answer should
include (case-insensitive). `must_not_contain` = hallucination signals
(numbers/topics we know aren't in the KB).

Grow this set as you add real documents.
"""

EVAL_QUESTIONS = [
    {
        "id": "beef-emissions",
        "q": "Why does beef have such high carbon emissions?",
        "must_contain": ["ruminant", "60"],  # 60 kg CO2e/kg figure + ruminant mention
        "must_not_contain": [],
    },
    {
        "id": "transport-modes",
        "q": "Which transport mode has the lowest emissions per ton-km?",
        "must_contain": ["sea", "0.015"],
        "must_not_contain": [],
    },
    {
        "id": "recycled-aluminum",
        "q": "How much energy does recycled aluminum save vs primary aluminum?",
        "must_contain": ["95"],
        "must_not_contain": [],
    },
    {
        "id": "tree-offset-time",
        "q": "How quickly does a tree absorb CO2?",
        "must_contain": ["20"],  # ~20 kg/year
        "must_not_contain": [],
    },
    {
        "id": "grid-variation",
        "q": "How much does electricity grid carbon intensity vary by country?",
        "must_contain": ["france", "india"],
        "must_not_contain": [],
    },
    {
        "id": "offset-hierarchy",
        "q": "Is offsetting alone enough to be net-zero?",
        "must_contain": ["reduce", "avoid"],   # mitigation hierarchy
        "must_not_contain": [],
    },
    {
        "id": "plant-vs-animal",
        "q": "Compare plant proteins to animal proteins by emissions.",
        "must_contain": ["lentils", "10"],
        "must_not_contain": [],
    },
    {
        "id": "out-of-scope",
        # We don't have legal advice in the KB — should refuse.
        "q": "What's the tax credit for solar panels in California?",
        "must_contain": ["don't have", "no", "not"],
        "must_not_contain": ["$"],
    },
]
