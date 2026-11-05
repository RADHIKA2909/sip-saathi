import { PASSAGES } from "../src/content/kb/passages";
import { KB_VERSION, SOURCES } from "../src/content/kb/sources";

/** Renders docs/SOURCES.md from the manifest so the two can never drift (checked by a unit test). */
export function renderSourcesDoc(): string {
  const lines: string[] = [
    "# Source and reference manifest",
    "",
    `Knowledge base version: **${KB_VERSION}**. Generated from \`src/content/kb/\` by \`npm run docs:sources\`; do not edit by hand.`,
    "",
    "Every source was fetched and read on its retrieval date. PDFs were downloaded and their text extracted so each passage could be compared with the original wording. Publication dates are given only where the source states one.",
    "",
    "Passages are close paraphrases. Text in quotation marks is copied exactly. Illustrative return projections that appear in some sources (for example an assumed 10% annual return) are deliberately not included, because SIP Saathi never shows return figures.",
    "",
    "**Human verification still recommended:** a reviewer should re-open each source and confirm each passage before relying on it.",
    "",
    "## Sources",
    "",
    "| ID | Title | Publisher | Format | Published | Retrieved |",
    "|---|---|---|---|---|---|",
    ...SOURCES.map((s) => `| \`${s.id}\` | [${s.title}](${s.url}) | ${s.publisher} | ${s.format} | ${s.published} | ${s.retrieved} |`),
    "",
    "## Passages",
    "",
  ];
  for (const s of SOURCES) {
    lines.push(`### ${s.title}`, "", `Source ID \`${s.id}\`. Used for: ${s.usedFor}.`, "");
    for (const p of PASSAGES.filter((x) => x.sourceId === s.id)) {
      lines.push(`- **\`${p.contentId}\`** (${p.locator}; topics: ${p.topics.join(", ")})`, `  ${p.text}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
