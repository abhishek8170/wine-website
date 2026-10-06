const BACKEND_URL = "";

export const getImageUrl = (imageUrl) => {
  // No image → use existing frontend fallback
  if (!imageUrl) {
    return "/images/wine.png";
  }

  // Full external/backend URL
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  // Images uploaded through backend
  if (imageUrl.startsWith("/uploads/")) {
    return `${BACKEND_URL}${imageUrl}`;
  }

  // Existing images stored in frontend/public/images
  if (imageUrl.startsWith("/images/")) {
    return imageUrl;
  }

  // If database contains "uploads/..." without leading slash
  if (imageUrl.startsWith("uploads/")) {
    return `${BACKEND_URL}/${imageUrl}`;
  }

  // If database contains "images/..." without leading slash
  if (imageUrl.startsWith("images/")) {
    return `/${imageUrl}`;
  }

  // General relative-path fallback
  return `${BACKEND_URL}${
    imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`
  }`;
};