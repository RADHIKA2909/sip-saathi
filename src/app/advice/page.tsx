import type { Metadata } from "next";
import { AdviceDecoder } from "./AdviceDecoder";

export const metadata: Metadata = { title: "Conflicting Advice Decoder" };

export default function Page() {
  return <AdviceDecoder />;
}
