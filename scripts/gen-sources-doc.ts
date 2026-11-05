import { writeFileSync } from "fs";
import path from "path";
import { renderPolicyDoc } from "./policy-doc";
import { renderSourcesDoc } from "./sources-doc";

const docs = path.join(__dirname, "..", "docs");
writeFileSync(path.join(docs, "SOURCES.md"), renderSourcesDoc());
writeFileSync(path.join(docs, "PROMPTS_AND_SAFETY.md"), renderPolicyDoc());
console.log("Wrote docs/SOURCES.md and docs/PROMPTS_AND_SAFETY.md");
