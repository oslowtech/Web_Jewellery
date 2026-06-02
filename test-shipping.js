// Test file to verify shipping and WhatsApp integration
import { 
  validatePincode, 
  getStateFromPincode, 
  calculateShipping, 
  getShippingInfo 
} from './src/utils/shipping.js';

console.log("=== Testing Shipping Utility ===\n");

// Test 1: Validate Pincode
console.log("Test 1: Pincode Validation");
console.log("  Valid 110001:", validatePincode("110001")); // true
console.log("  Valid 400001:", validatePincode("400001")); // true
console.log("  Invalid 1100:", validatePincode("1100")); // false
console.log("  Invalid ABCDEF:", validatePincode("ABCDEF")); // false

// Test 2: Get State from Pincode
console.log("\nTest 2: Get State from Pincode");
console.log("  Pincode 110001 -> State:", getStateFromPincode("110001")); // DL
console.log("  Pincode 400001 -> State:", getStateFromPincode("400001")); // MH
console.log("  Pincode 560001 -> State:", getStateFromPincode("560001")); // KA

// Test 3: Calculate Shipping
console.log("\nTest 3: Calculate Shipping");
console.log("  Delhi (110001), ₹500 order:", calculateShipping("110001", 500)); // 100 (default)
console.log("  Delhi (110001), ₹2000 order:", calculateShipping("110001", 2000)); // 0 (free shipping)
console.log("  Mumbai (400001), ₹500 order:", calculateShipping("400001", 500)); // 100
console.log("  Bangalore (560001), ₹500 order:", calculateShipping("560001", 500)); // 200

// Test 4: Get Shipping Info
console.log("\nTest 4: Get Shipping Info");
console.log("  Valid pincode 110001:", getShippingInfo("110001"));
console.log("  Invalid pincode 123456:", getShippingInfo("123456"));
console.log("  Invalid format 12345:", getShippingInfo("12345"));

// Test 5: WhatsApp Message Formatting
console.log("\nTest 5: WhatsApp Message Format");
const testProduct = {
  id: "JW1001",
  name: "Rose Gold Pearl Necklace",
  price: 1299,
  discountPrice: 999
};

const message = `Hello Nagneshwari Jewels, I want to inquire about this jewellery item.\n\nProduct ID: ${testProduct.id}\nProduct Name: ${testProduct.name}\nPrice: ₹${testProduct.discountPrice}\nShipping (Pincode: 110001): ₹${calculateShipping("110001", testProduct.discountPrice)}\nTotal: ₹${testProduct.discountPrice + calculateShipping("110001", testProduct.discountPrice)}`;

console.log("Message:", message);
console.log("\nEncoded URL:", `https://wa.me/917307058932?text=${encodeURIComponent(message)}`);

console.log("\n=== All Tests Complete ===");
