/**
 * Download a data URL as a file.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Download a file from a URL.
 */
export async function downloadFromUrl(url: string, filename: string): Promise<void> {
  const response = await fetch(url)
  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(blobUrl)
}

/**
 * Build a filename for a generated image.
 */
export function buildFilename(
  substanceId: string,
  dose: number,
  extension: string
): string {
  const date = new Date()
  const datePart = date.toISOString().split('T')[0]
  const timePart = date.toTimeString().split(' ')[0].replace(/:/g, '')
  const dosePct = Math.round(dose * 100)
  return `psyvis_${substanceId}_${dosePct}pct_${datePart}_${timePart}.${extension}`
}
