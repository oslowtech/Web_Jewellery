import { calculateShipping, COD_LIMIT, isCodAvailable, OFFER_THRESHOLD } from "./shipping.js";

const buildOrderPolicyMessage = () =>
  [
    "Order policy:",
    "- Please confirm your delivery details before placing the order.",
    "- Report damaged, missing, or wrong items within 48 hours of delivery.",
    "- Returns and replacements are subject to verification and item condition.",
    "- Shipping charges are calculated by pincode.",
  ].join("\n");

export const handleWhatsAppInquiry = (product, notify, pincode = "") => {
  if (!product) return;

  const price = product.discountPrice || product.price;
  let message = `Hello, I want to inquire about this jewellery item.\n\nProduct ID: ${product.id}\nProduct Name: ${product.name}\nPrice: ₹${price}`;

  if (pincode) {
    const shipping = calculateShipping(pincode, price);
    if (shipping !== null) {
      message += `\nShipping: ₹${shipping}`;
      message += `\nTotal: ₹${price + shipping}`;
    }
  }

  const codAvailable = isCodAvailable(price);
  const codMessage = codAvailable ? "Available" : `Not available above ₹${COD_LIMIT}`;
  message += `\nCOD: ${codMessage}`;
  if (price >= OFFER_THRESHOLD) {
    message += "\nOffer: Eligible for lucky draw entry.";
  } else {
    message += `\nOffer: Spend ₹${OFFER_THRESHOLD}+ to enter lucky draw.`;
  }

  message += `\n\n${buildOrderPolicyMessage()}`;

  const phone = import.meta.env.VITE_WHATSAPP_NUMBER || "91XXXXXXXXXX";

  if (navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(product.id)
      .then(() => notify?.("Product ID copied successfully"))
      .catch(() => notify?.("Unable to copy product ID"));
  } else {
    notify?.("Unable to copy product ID");
  }

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
};

export const handleWhatsAppCartInquiry = (cart, total, pincode, notify) => {
  if (!cart?.length) return;

  let message = "Hello, I would like to place an order for the following items:\n\n";

  cart.forEach((item, index) => {
    const price = item.discountPrice || item.price;
    message += `${index + 1}. ${item.name} (ID: ${item.id}) - ${item.quantity}x ₹${price}\n`;
  });

  message += `\nSubtotal: ₹${total}`;

  if (pincode) {
    const shipping = calculateShipping(pincode, total);
    if (shipping !== null) {
      message += `\nShipping (Pincode: ${pincode}): ₹${shipping}`;
      message += `\nTotal: ₹${total + shipping}`;
    }
  } else {
    message += `\nTotal: ₹${total}`;
  }

  const codAvailable = isCodAvailable(total);
  const codMessage = codAvailable ? "Available" : `Not available above ₹${COD_LIMIT}`;
  message += `\nCOD: ${codMessage}`;
  if (total >= OFFER_THRESHOLD) {
    message += "\nOffer: Eligible for lucky draw entry.";
  } else {
    message += `\nOffer: Spend ₹${OFFER_THRESHOLD}+ to enter lucky draw.`;
  }

  message += `\n\n${buildOrderPolicyMessage()}`;
  message += "\n\nPlease confirm the order.";

  const phone = import.meta.env.VITE_WHATSAPP_NUMBER || "91XXXXXXXXXX";

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  notify?.("Order details sent to WhatsApp!");
};

