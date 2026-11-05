import type { Metadata } from "next";
import { ConcernDecoder } from "./ConcernDecoder";

export const metadata: Metadata = { title: "Concern Decoder" };

export default function Page() {
  return <ConcernDecoder />;
}
