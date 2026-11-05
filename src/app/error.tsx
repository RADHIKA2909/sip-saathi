"use client";
import { Button } from "@/components/ui";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-16 text-center" role="alert">
      <h1 className="text-2xl font-semibold">Something went wrong on this page</h1>
      <p className="mt-2 text-muted">Nothing you entered was sent anywhere because of this error. You can try again.</p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}
