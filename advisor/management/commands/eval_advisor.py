"""
Custom eval harness (no RAGAS required — runs without extra deps).

Usage:
    python manage.py eval_advisor

What it measures:
  - substring_recall: fraction of `must_contain` strings the answer hits
  - violation_rate:   fraction of `must_not_contain` strings the answer hit
                      (lower is better — these are hallucination signals)
  - mean_latency_ms
  - mean_retrieved_count

For richer evals (faithfulness, answer_relevancy, context_precision),
uncomment ragas in requirements.txt and use advisor/evals/run_ragas.py.
"""
import json
import time
from pathlib import Path
from django.core.management.base import BaseCommand

from advisor.services.rag_chain import RAGChain
from advisor.evals.eval_set import EVAL_QUESTIONS


class Command(BaseCommand):
    help = "Evaluate the RAG advisor against a curated gold set."

    def add_arguments(self, parser):
        parser.add_argument("--out", type=str, default="advisor/evals/last_run.json")

    def handle(self, *args, **opts):
        chain = RAGChain()
        rows = []
        n_recall = 0
        n_violation = 0
        total_must_have = 0
        total_must_not = 0
        latencies = []

        self.stdout.write(self.style.NOTICE(f"Running {len(EVAL_QUESTIONS)} eval cases...\n"))

        for case in EVAL_QUESTIONS:
            t0 = time.time()
            result = chain.answer(case["q"])
            ans = (result["answer"] or "").lower()

            hits = [s for s in case["must_contain"] if s.lower() in ans]
            misses = [s for s in case["must_contain"] if s.lower() not in ans]
            violations = [s for s in case["must_not_contain"] if s.lower() in ans]

            total_must_have += len(case["must_contain"])
            total_must_not += len(case["must_not_contain"])
            n_recall += len(hits)
            n_violation += len(violations)
            latencies.append(result["latency_ms"])

            status = "PASS" if not misses and not violations else "FAIL"
            color = self.style.SUCCESS if status == "PASS" else self.style.ERROR
            self.stdout.write(color(f"[{status}] {case['id']}: hits={len(hits)}/{len(case['must_contain'])} "
                                    f"miss={misses} violations={violations}"))

            rows.append({
                "id": case["id"],
                "question": case["q"],
                "answer": result["answer"],
                "hits": hits, "misses": misses, "violations": violations,
                "retrieved": result["retrieved_count"],
                "latency_ms": result["latency_ms"],
            })

        recall = n_recall / max(total_must_have, 1)
        violation_rate = n_violation / max(total_must_not, 1) if total_must_not else 0.0

        summary = {
            "n_cases": len(EVAL_QUESTIONS),
            "substring_recall": round(recall, 3),
            "violation_rate": round(violation_rate, 3),
            "mean_latency_ms": round(sum(latencies) / len(latencies), 1),
            "rows": rows,
        }

        out_path = Path(opts["out"])
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(summary, indent=2))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"recall={summary['substring_recall']:.2%}  "
            f"violation_rate={summary['violation_rate']:.2%}  "
            f"mean_latency={summary['mean_latency_ms']} ms"
        ))
        self.stdout.write(self.style.SUCCESS(f"Saved {out_path}"))
