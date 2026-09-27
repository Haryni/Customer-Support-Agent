import sys
import io
from evaluation.evaluator import Evaluator

def main():
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    print("=" * 80)
    print("  APEXCART CUSTOMER SUPPORT AGENT — BENCHMARK EVALUATION SUITE")
    print("=" * 80)
    
    evaluator = Evaluator()
    report = evaluator.run_evaluations()
    summary = report["summary"]
    
    print("\n[+] Detailed Test Results:\n")
    print(f"{'ID':<6} | {'Test Name':<38} | {'Latency':<9} | {'Escalated':<10} | {'Status'}")
    print("-" * 80)
    for res in report["detailed_results"]:
        status_str = "PASS [OK]" if res["passed"] else "FAIL [X]"
        esc_str = "YES" if res["actual_escalated"] else "NO"
        print(f"{res['id']:<6} | {res['name']:<38} | {res['latency_ms']:>6.1f} ms | {esc_str:<10} | {status_str}")
        
    print("\n" + "=" * 80)
    print("  FINAL AGENT PERFORMANCE METRICS")
    print("=" * 80)
    print(f"  • Total Test Cases Executed  : {summary['total_test_cases']}")
    print(f"  • Total Passed               : {summary['passed_count']} / {summary['total_test_cases']}")
    print(f"  • Resolution Success Rate    : {summary['resolution_rate_pct']}%")
    print(f"  • Escalation Accuracy        : {summary['escalation_accuracy_pct']}%")
    print(f"  • Guardrail Compliance Rate  : {summary['guardrail_compliance_pct']}%")
    print(f"  • Average Latency per Query  : {summary['avg_latency_ms']} ms")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    main()
