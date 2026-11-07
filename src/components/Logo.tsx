const DARK = "#0a7a4b";
const MID = "#57b872";
const LIGHT = "#a3e0b9";
const SPARK = "#fbbf33";

/** SIP Saathi mark: a hand supporting bars and an arrow. The simplified version is in src/app/icon.svg. */
export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 66 64" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M32 6.2C17 5.4 4.5 17 4 31.5c-.3 8 2.6 15 7.6 20.2" stroke={LIGHT} strokeWidth="3" strokeLinecap="round" />
      <rect x="14" y="35" width="10.5" height="14.5" rx="3" fill={LIGHT} />
      <rect x="27" y="27" width="10.5" height="21" rx="3" fill={MID} />
      <rect x="40" y="19.5" width="11" height="29" rx="3" fill={DARK} />
      <path d="M11 33.2c15-1.4 27-8.2 35-17.4l-4.7-2.5 11.6-3.6-.4 12.1-3.6-3.9C40.300 28 27 34.800 11 33.200z" fill={DARK} />
      <path d="M50.700 5.800 52 1.500M55.800 8.600 59.500 5M57.500 13.700l5-.9" stroke={SPARK} strokeWidth="2.600" strokeLinecap="round" />
      <path d="M7.500 51.500C12.500 47 20.500 45 28.500 46.800l10 2.500c3.200.8 3 4.500-.5 4.600l-9 .1c7 2 12.500.2 16.500-3.300l9.800-8.400c2.800-2.200 5.300.5 3.600 3.100C54 53 45 61.500 31.500 61.500c-10.500 0-18.500-4-24-10z" fill={DARK} />
    </svg>
  );
}

/** Full logo: the mark, the name, and a brush line under "Saathi". */
export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="relative pb-1 text-[22px] font-extrabold leading-none tracking-tight text-[#0b3d2a]">
        SIP Saathi
        <svg className="absolute -bottom-0.5 right-0 w-[62%]" viewBox="0 0 100 6" preserveAspectRatio="none" height="5" fill="none" aria-hidden="true">
          <path d="M1 5C30 2 68 1 99 2.600" stroke="#7cc98f" strokeWidth="2.400" strokeLinecap="round" />
        </svg>
      </span>
    </span>
  );
}
