import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-sm font-semibold text-accent-strong">404</p>
      <h1 className="mt-2 text-2xl font-semibold">This page doesn&apos;t exist</h1>
      <p className="mt-2 text-muted">The link may be wrong or the page may have moved.</p>
      <ButtonLink href="/" className="mt-6">Back to home</ButtonLink>
    </div>
  );
}
