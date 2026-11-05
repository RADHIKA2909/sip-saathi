import type { Metadata } from "next";
import { PaymentHelp } from "./PaymentHelp";

export const metadata: Metadata = { title: "Payment Help" };

export default function Page() {
  return <PaymentHelp />;
}
