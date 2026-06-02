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
  // Extract ID from previously saved 'thumbnail' links
  else if (url.includes("drive.google.com/thumbnail") && url.includes("id=")) {
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match) fileId = match[1];
  }
  // Extract ID from already converted 'lh3' links
  else if (url.includes("lh3.googleusercontent.com/d/")) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) fileId = match[1];
  }
  // Extract ID from drive.usercontent.google.com links
  else if (url.includes("drive.usercontent.google.com") && url.includes("id=")) {
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match) fileId = match[1];
  }
  
  if (fileId) {
    // Google actively blocks direct embedding on websites using strict CORS rules.
    // WORKAROUND: Route the request through a free image caching proxy (wsrv.nl)
    const driveUrl = encodeURIComponent(`https://drive.google.com/uc?id=${fileId}`);
    return `https://wsrv.nl/?url=${driveUrl}`;
  }

  return url;
}