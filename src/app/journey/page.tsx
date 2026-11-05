import type { Metadata } from "next";
import { JourneyMirror } from "./JourneyMirror";

export const metadata: Metadata = { title: "SIP Journey Mirror" };

export default function Page() {
  return <JourneyMirror />;
}
