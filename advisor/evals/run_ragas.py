"""
Optional RAGAS evaluation. Requires `pip install ragas`.

Measures industry-standard RAG metrics:
  - faithfulness:       does the answer match the retrieved context?
  - answer_relevancy:   does the answer address the question?
  - context_precision:  was the retrieved context actually relevant?
  - context_recall:     did we retrieve everything needed?

Run with:
    python -m advisor.evals.run_ragas
"""
from __future__ import annotations
import os
import django

# Allow running as a standalone script
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "carbon_project.settings")
django.setup()


def main():
    try:
        from ragas import evaluate
        from ragas.metrics import (
            faithfulness, answer_relevancy, context_precision, context_recall,
        )
        from datasets import Dataset
    except ImportError:
        raise SystemExit(
            "RAGAS not installed. Run: pip install ragas datasets"
        )

    from advisor.services.rag_chain import RAGChain
    from advisor.evals.eval_set import EVAL_QUESTIONS

    chain = RAGChain()

    questions, answers, contexts, refs = [], [], [], []
    for case in EVAL_QUESTIONS:
        r = chain.answer(case["q"])
        questions.append(case["q"])
        answers.append(r["answer"])
        # RAGAS expects list of strings per row
        contexts.append([s["snippet"] for s in r["sources"]] or [""])
        # We don't have gold reference answers — use must_contain as a hint
        refs.append(" ".join(case["must_contain"]))

    ds = Dataset.from_dict({
        "question": questions,
        "answer": answers,
        "contexts": contexts,
        "reference": refs,
    })

    result = evaluate(
        ds,
        metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
    )
    print(result)


if __name__ == "__main__":
    main()
