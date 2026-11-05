import type { Metadata } from "next";
import { ClarityCanvas } from "./ClarityCanvas";

export const metadata: Metadata = { title: "Decision Clarity Canvas" };

export default function Page() {
  return <ClarityCanvas />;
}
