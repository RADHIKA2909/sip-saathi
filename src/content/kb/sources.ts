/**
 * Source manifest for the SIP Saathi educational knowledge base.
 *
 * Every entry below was fetched and read on the retrieval date. PDFs were downloaded and their text
 * was extracted so passages could be checked against the actual wording. Publication dates are given
 * only where the document itself states one; otherwise the field says so.
 *
 * Bump KB_VERSION whenever a source or passage is added, removed, or reworded.
 */
export const KB_VERSION = "kb-v1";

export type Publisher =
  | "Association of Mutual Funds in India (AMFI)"
  | "Securities and Exchange Board of India (SEBI)"
  | "National Payments Corporation of India (NPCI)"
  | "Directorate General of Health Services, Ministry of Health & Family Welfare";

export interface Source {
  id: string;
  title: string;
  publisher: Publisher;
  url: string;
  format: "web page" | "PDF";
  /** As stated by the document itself, or an explicit note that it is not stated. */
  published: string;
  /** ISO date on which the source was fetched and read for this knowledge base. */
  retrieved: string;
  /** What the source is used for in this product. */
  usedFor: string;
}

const RETRIEVED = "2026-11-04";

export const SOURCES: readonly Source[] = [
  {
    id: "amfi-pocket-guide",
    title: "Mutual Funds Made Simple: Your Pocket Guide to Understanding Mutual Funds",
    publisher: "Association of Mutual Funds in India (AMFI)",
    url: "https://www.amfiindia.com/uploads/AMFI_Understanding_Mutual_Funds_IAP_Booklet_Final_Website_version_860a5b77aa.pdf",
    format: "PDF",
    published: "Not stated in the document (it cites a SEBI Master Circular dated 20 March 2026)",
    retrieved: RETRIEVED,
    usedFor: "SIP and NAV definitions, risks, rupee cost averaging, redemption, grievance redressal, fraud warnings",
  },
  {
    id: "sebi-financial-education-booklet",
    title: "Financial Education Booklet (English)",
    publisher: "Securities and Exchange Board of India (SEBI)",
    url: "https://investor.sebi.gov.in/pdf/downloadable-documents/Financial%20Education%20Booklet%20-%20English.pdf",
    format: "PDF",
    published: "November 2020",
    retrieved: RETRIEVED,
    usedFor: "Financial planning, goal horizons, types of risk, SIP basics, investor do's and don'ts",
  },
  {
    id: "sebi-intro-mutual-funds",
    title: "Introduction to Mutual Funds (investor awareness presentation)",
    publisher: "Securities and Exchange Board of India (SEBI)",
    url: "https://investor.sebi.gov.in/pdf/reference-material/ppt/PPT-8-Introduction_to_Mutual_Funds_Investing_Jan24.pdf",
    format: "PDF",
    published: "Information as on 15 January 2024 (stated in the presentation)",
    retrieved: RETRIEVED,
    usedFor: "SIP vs lump sum, risk-o-meter, SEBI helplines and SCORES",
  },
  {
    id: "mfsh-rupee-cost-averaging",
    title: "What is Rupee Cost Averaging?",
    publisher: "Association of Mutual Funds in India (AMFI)",
    url: "https://www.mutualfundssahihai.com/en/what-rupee-cost-averaging",
    format: "web page",
    published: "Not stated on the page (Mutual Funds Sahi Hai, an AMFI investor-education site)",
    retrieved: RETRIEVED,
    usedFor: "Rupee cost averaging and market timing",
  },
  {
    id: "mfsh-missed-sip-payments",
    title: "What happens when you miss SIP payments in-between?",
    publisher: "Association of Mutual Funds in India (AMFI)",
    url: "https://www.mutualfundssahihai.com/en/what-happens-when-you-miss-sip-payments-between",
    format: "web page",
    published: "Not stated on the page (Mutual Funds Sahi Hai, an AMFI investor-education site)",
    retrieved: RETRIEVED,
    usedFor: "Missed instalments, bank charges, automatic cancellation, restarting",
  },
  {
    id: "mfsh-start-stop-sip",
    title: "How do I start/stop a SIP? What happens if I miss an instalment?",
    publisher: "Association of Mutual Funds in India (AMFI)",
    url: "https://www.mutualfundssahihai.com/en/how-do-i-startstop-sip-what-happens-if-i-miss-instalment",
    format: "web page",
    published: "Not stated on the page (Mutual Funds Sahi Hai, an AMFI investor-education site)",
    retrieved: RETRIEVED,
    usedFor: "Missed instalments and starting a fresh SIP",
  },
  {
    id: "amfi-sip-data-page",
    title: "Mutual Fund industry data page (SIP figures and SEBI cancellation note)",
    publisher: "Association of Mutual Funds in India (AMFI)",
    url: "https://www.amfiindia.com/mutual-fund",
    format: "web page",
    published: "Not stated (the page showed SIP data up to September 2026 when retrieved)",
    retrieved: RETRIEVED,
    usedFor: "SEBI guideline on SIPs treated as ceased after consecutive failed instalments",
  },
  {
    id: "npci-upi-autopay-guideline",
    title: "UPI AutoPay Guideline",
    publisher: "National Payments Corporation of India (NPCI)",
    url: "https://www.npci.org.in/uploads/UPI_Auto_Pay_Brand_Guidelines_bcabed7282.pdf",
    format: "PDF",
    published: "Not stated in the document (its screenshots are marked illustrative)",
    retrieved: RETRIEVED,
    usedFor: "What a UPI AutoPay mandate is and that it can be paused or revoked",
  },
  {
    id: "mohfw-tele-manas",
    title: "National Mental Health Programme (Tele MANAS helpline)",
    publisher: "Directorate General of Health Services, Ministry of Health & Family Welfare",
    url: "https://dghs.mohfw.gov.in/national-mental-health-programme.php",
    format: "web page",
    published: "Not stated on the page",
    retrieved: RETRIEVED,
    usedFor: "Helpline shown when a message suggests serious emotional distress",
  },
];

export const SOURCE_BY_ID: ReadonlyMap<string, Source> = new Map(SOURCES.map((s) => [s.id, s]));
