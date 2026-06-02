/**
 * Converts a standard Google Drive share link into a direct image rendering URL.
 * @param {string} url - The original URL pasted by the admin
 * @returns {string} The direct image URL, or original if not a Drive link
 */
export function extractDriveDirectLink(url) {
  if (!url) return '';
  
  let fileId = null;

  // Extract ID from standard Google Drive share link
  if (url.includes("drive.google.com/file/d/")) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) fileId = match[1];
  } 
  // Extract ID from already converted 'uc' links (fixes already saved products)
  else if (url.includes("drive.google.com/uc") && url.includes("id=")) {
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match) fileId = match[1];
  }
  
  if (fileId) {
    // Use the thumbnail endpoint to bypass Google Drive's embedding restrictions (sz=w1000 means up to 1000px width)
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  return url;
}