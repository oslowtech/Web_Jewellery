/**
 * Converts a standard Google Drive share link into a direct image rendering URL.
 * @param {string} url - The original URL pasted by the admin
 * @returns {string} The direct image URL, or original if not a Drive link
 */
export function extractDriveDirectLink(url) {
  if (!url) return '';
  if (!url.includes("drive.google.com/file/d/")) return url;
  
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
  }
  return url;
}