/**
 * Framework-free date helpers.
 *
 * Records carry ISO timestamps (`createdAt`, `updatedAt`); these render them for
 * people. Nothing here is market-specific, which is why it does not live with
 * either feature.
 */

/** An ISO timestamp in the viewer's local format, or the raw value if unparseable. */
export function formatDateTime(isoString: string): string {
  const parsed = new Date(isoString)
  if (Number.isNaN(parsed.getTime())) return isoString

  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
