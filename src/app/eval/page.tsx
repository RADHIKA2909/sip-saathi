import type { Metadata } from "next";
import { BASELINE_REVIEWS } from "@/eval/baseline/reviews";
import run from "@/eval/baseline/run.json";
import type { EvalRun } from "@/eval/runner";
import { EvalLab } from "./EvalLab";

export const metadata: Metadata = { title: "Evaluation Lab" };

export default function Page() {
  return <EvalLab baseline={run as unknown as EvalRun} baselineReviews={BASELINE_REVIEWS} />;
}
