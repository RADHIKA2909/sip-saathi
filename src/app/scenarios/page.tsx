import type { Metadata } from "next";
import { Scenarios } from "./Scenarios";

export const metadata: Metadata = { title: "Try 3 scenarios" };

export default function Page() {
  return <Scenarios />;
}
