// Branded client reports: a consultant can put their own name and logo on the reports
// they print for clients, and can hide the ChainInsideIQ mark.
//
// Honest limits, repeated in the app: branding is saved in this browser for now (it is
// not in your account yet), it applies to reports you print or save from this browser,
// and it is not shown on the read-only view people get when you share a workspace.
// A logo is re-drawn by the browser and stored as a small PNG or JPEG; SVG is not accepted.
// The report still says that figures come from the numbers entered in the workspace.
//
// Pure TypeScript with no dependencies.

export interface Brand {
  /** Your business or agency name, printed as "Prepared by". */
  name?: string;
  /** A small PNG or JPEG as a data URL. */
  logo?: string;
  /** Hide the ChainInsideIQ logo and the "with ChainInsideIQ" wording on printed reports. */
  hideProduct: boolean;
}

export const NAME_MAX = 80;
/** Characters, not bytes: a data URL is plain ASCII, so this is also its size. About 150 KB. */
export const LOGO_MAX_CHARS = 200_000;
export const LOGO_MAX_WIDTH = 400;
export const LOGO_MAX_HEIGHT = 120;

const LOGO_URL = /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;
export const isSafeLogo = (s: unknown): s is string => typeof s === 'string' && s.length <= LOGO_MAX_CHARS && LOGO_URL.test(s);

export const emptyBrand = (): Brand => ({ hideProduct: false });

/** Safe on anything that came from storage. Returns undefined when there is nothing to keep. */
export function cleanBrand(raw: unknown): Brand | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Partial<Brand>;
  const name = String(r.name ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  const out: Brand = { hideProduct: r.hideProduct === true };
  if (name) out.name = name;
  if (isSafeLogo(r.logo)) out.logo = r.logo;
  return out.name || out.logo || out.hideProduct ? out : undefined;
}

/** Apply a change. Anything invalid is ignored rather than stored. */
export function updateBrand(brand: Brand | undefined, patch: { name?: string | null; logo?: string | null; hideProduct?: boolean }): Brand | undefined {
  const cur = cleanBrand(brand) ?? emptyBrand();
  const next: Brand = { ...cur };
  if (patch.name !== undefined) { if (patch.name) next.name = patch.name; else delete next.name; }
  if (patch.logo !== undefined) { if (patch.logo) next.logo = patch.logo; else delete next.logo; }
  if (patch.hideProduct !== undefined) next.hideProduct = patch.hideProduct;
  return cleanBrand(next);
}

export interface ReportBranding {
  /** Name for "Prepared by", or undefined to say nothing. */
  preparedBy?: string;
  logo?: string;
  showProductMark: boolean;
  /** The line at the end of the report. */
  footer: string;
}

/**
 * What a report prints. `fallbackName` is the business name already in the workspace.
 * Hiding the ChainInsideIQ mark only removes the product name; the sentence about where
 * the figures come from always stays.
 */
export function reportBranding(brand: Brand | undefined, fallbackName?: string): ReportBranding {
  const b = cleanBrand(brand);
  const preparedBy = b?.name || (fallbackName?.trim() || undefined);
  const showProductMark = !b?.hideProduct;
  const who = preparedBy ? `Prepared by ${preparedBy}` : 'Prepared';
  const footer = `${who}${showProductMark ? ' with ChainInsideIQ' : ''}. Figures come from the numbers entered in this workspace.`;
  return { preparedBy, logo: b?.logo, showProductMark, footer };
}
