export const SHIPPING_RATES = {
  default: 100,
  north: { minPrice: 150, states: ["UP", "HP", "UK", "JK", "HM"] },
  south: { minPrice: 200, states: ["KA", "KL", "TG", "AP"] },
  east: { minPrice: 180, states: ["WB", "OD", "AS", "JH", "BR"] },
  west: { minPrice: 100, states: ["MH", "GJ", "RJ"] },
  centralEast: { minPrice: 150, states: ["MP", "CT", "CG"] },
};

export const PINCODE_STATES = {
  110001: "DL",
  110016: "DL",
  201001: "UP",
  208001: "UP",
  360001: "GJ",
  380001: "GJ",
  400001: "MH",
  411001: "MH",
  500001: "TG",
  500002: "TG",
  560001: "KA",
  580001: "KA",
  700001: "WB",
  711101: "WB",
  800001: "BR",
  831001: "JH",
  160001: "HP",
  171001: "HP",
  180001: "JK",
  190001: "JK",
  673601: "KL",
  695001: "KL",
  530001: "AP",
  530002: "AP",
  752001: "OD",
  770001: "OD",
  781001: "AS",
  781005: "AS",
  452001: "MP",
  458001: "MP",
  490001: "CT",
  495001: "CG",
};

export const validatePincode = (pincode) => {
  return /^\d{6}$/.test(pincode);
};

export const getStateFromPincode = (pincode) => {
  if (!validatePincode(pincode)) return null;
  const firstThree = pincode.substring(0, 3);
  for (const [code, state] of Object.entries(PINCODE_STATES)) {
    if (code.startsWith(firstThree)) return state;
  }
  return null;
};

export const calculateShipping = (pincode, subtotal) => {
  if (!validatePincode(pincode)) {
    return null;
  }

  const state = getStateFromPincode(pincode);
  if (!state) return null;

  let shippingCost = SHIPPING_RATES.default;
  const minPrice = SHIPPING_RATES.default;

  for (const [region, config] of Object.entries(SHIPPING_RATES)) {
    if (region === "default") continue;
    if (config.states.includes(state)) {
      shippingCost = config.minPrice;
      break;
    }
  }

  if (subtotal >= 1499) {
    return 0;
  }

  return shippingCost;
};

export const getShippingInfo = (pincode) => {
  if (!validatePincode(pincode)) {
    return { valid: false, message: "Invalid pincode format" };
  }

  const state = getStateFromPincode(pincode);
  if (!state) {
    return { valid: false, message: "Pincode not found in our service area" };
  }

  return { valid: true, state, message: `Shipping available to ${state}` };
};
