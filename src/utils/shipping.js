export const DISPATCH_PINCODE = "226022";
export const SHIPPING_RATES = {
  near: 30,
  far: 50,
};
export const COD_LIMIT = 700;
export const OFFER_THRESHOLD = 2999;

export const validatePincode = (pincode) => {
  return /^\d{6}$/.test(pincode);
};

export const getShippingZone = (pincode) => {
  if (!validatePincode(pincode)) return null;
  const dispatchPrefix = DISPATCH_PINCODE.substring(0, 3);
  return pincode.startsWith(dispatchPrefix) ? "near" : "far";
};

export const calculateShipping = (pincode, subtotal) => {
  if (!validatePincode(pincode)) return null;
  const zone = getShippingZone(pincode);
  if (!zone) return null;
  return SHIPPING_RATES[zone];
};

export const getShippingInfo = (pincode) => {
  if (!validatePincode(pincode)) {
    return { valid: false, message: "Invalid pincode format" };
  }

  const zone = getShippingZone(pincode);
  return {
    valid: true,
    zone,
    rate: SHIPPING_RATES[zone],
    message: `Shipping available (${zone === "near" ? "Near" : "Far"})`,
  };
};

export const isCodAvailable = (subtotal) => subtotal <= COD_LIMIT;
