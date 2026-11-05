import type { Metadata } from "next";
import { MarketExplainer } from "./MarketExplainer";

export const metadata: Metadata = { title: "Market Context Explainer" };

export default function Page() {
  return <MarketExplainer />;
}
