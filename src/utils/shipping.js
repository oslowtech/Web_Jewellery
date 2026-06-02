export const DISPATCH_PINCODE = "226022";
export const FREE_SHIPPING_THRESHOLD = 2000;
export const SHIPPING_RATES = {
  local: 20,
  city: 30,
  state: 50,
  regional: 70,
  national: 100,
};
export const COD_LIMIT = 700;
export const OFFER_THRESHOLD = 2999;

export const validatePincode = (pincode) => {
  return /^\d{6}$/.test(pincode);
};

export const getShippingZone = (pincode) => {
  if (!validatePincode(pincode)) return null;
  
  if (pincode === DISPATCH_PINCODE) return "local";
  if (pincode.startsWith("226")) return "city";
  
  const prefix2 = parseInt(pincode.substring(0, 2), 10);
  if (prefix2 >= 20 && prefix2 <= 28) return "state"; // Uttar Pradesh area
  
  const prefix1 = parseInt(pincode.substring(0, 1), 10);
  if ([1, 3, 4, 8].includes(prefix1)) return "regional"; // Neighboring zones
  
  return "national"; // Rest of India
};

export const calculateShipping = (pincode, subtotal) => {
  if (!validatePincode(pincode)) return null;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;

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
    message: `Shipping calculated based on distance`,
  };
};

export const isCodAvailable = (subtotal) => subtotal <= COD_LIMIT;
