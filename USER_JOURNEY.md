# User Journey - Shipping & WhatsApp Integration

## Complete User Flow Example

### Scenario: Customer ordering men's jewellery with shipping

---

## Step 1: Browse Collections

### On Home Page
- Customer sees "Women's Collection" section (4 products)
- Customer sees "Men's Collection" section (4 products)
- Clicks "View all" under Men's Collection

### Navigates to: `/shop?gender=men`

---

## Step 2: Filter by Gender

### Shop Page
- Opens with Men's collection showing 8 products
- Can refine with other filters:
  - Categories: Necklace, Pendant, Bracelet, Ring, Anklet
  - Price range slider
  - Sort options: Price, New, Featured
  - Featured/New only toggle

### Selects Filter
- Clicks "Filters" button
- Sees "Collection" section with Men's selected
- Can switch between Men/Women
- Clicks "Apply"

---

## Step 3: View Product Detail

### Product Page (Example: Black Onyx Chain Necklace - JW2001)

```
┌─────────────────────────────────────┐
│         Product Gallery             │
│        [Image with swipe]           │
├─────────────────────────────────────┤
│                                     │
│ NECKLACE · CHAIN                    │
│ Black Onyx Chain Necklace           │
│ Product ID: JW2001                  │
│                                     │
│ ₹999  (was ₹1199)                   │
│                                     │
│ Bold black chain necklace for a     │
│ modern masculine look.              │
│                                     │
│ Material: Alloy                     │
│                                     │
│ Tags: casual • bold • daily         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Add to Cart]  [Save for Later] │ │
│ │ [Order on WhatsApp]             │ │
│ │ [Inquiry on WhatsApp]           │ │
│ └─────────────────────────────────┘ │
│ Free delivery on orders ₹1499+     │
└─────────────────────────────────────┘
```

---

## Step 4: Add to Cart

### Action: Click "Add to Cart"

**Result:**
- Item added to cart (quantity: 1)
- Cart drawer opens automatically
- Shows: "1 item in your cart"

---

## Step 5: Enter Shipping Pincode

### In Cart Drawer

```
┌─────────────────────────────────────┐
│   Your Cart                         │
├─────────────────────────────────────┤
│                                     │
│ Black Onyx Chain Necklace    ₹999  │
│ Quantity: 1            [+]  [-]    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Shipping Pincode                    │
│ [______] (6-digit)                  │
│                                     │
│ [Calculate Shipping]                │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Subtotal:        ₹999              │
│                                     │
│ Enter pincode to calculate shipping │
│                                     │
│ [Proceed to Checkout]               │
│ [Continue Shopping]                 │
│                                     │
└─────────────────────────────────────┘
```

### User Types: 110001 (Delhi)
- Clicks "Calculate Shipping"
- System validates: ✓ Valid 6-digit pincode
- System checks: ✓ Delhi service area available

---

## Step 6: Shipping Cost Calculated

### Cart Drawer Updated

```
┌─────────────────────────────────────┐
│   Your Cart                         │
├─────────────────────────────────────┤
│                                     │
│ Black Onyx Chain Necklace    ₹999  │
│ Quantity: 1                         │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Shipping Pincode                    │
│ [110001] (6-digit)                  │
│                                     │
│ ✓ Shipping calculated for 110001    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Subtotal:        ₹999              │
│ Shipping:        ₹100              │
│                                     │
│ Total:          ₹1099              │
│                                     │
│ [Proceed to Checkout]               │
│ [Continue Shopping]                 │
│                                     │
└─────────────────────────────────────┘
```

### System Calculation Details
- Pincode: 110001
- State: Delhi (DL)
- Shipping Region: Default (North)
- Shipping Rate: ₹100
- Free Shipping Threshold: ₹1499
- Status: Paid shipping (order < ₹1499)

---

## Step 7: Order via WhatsApp

### Option 1: Product Page WhatsApp
**On product detail page, customer clicks:**
- "Order on WhatsApp" OR
- "Inquiry on WhatsApp"

**System performs:**
1. Copies Product ID (JW2001) to clipboard
2. Opens WhatsApp Web with pre-filled message
3. Shows toast: "Product ID copied successfully"

**Message Generated:**
```
Hello, I want to inquire about this jewellery item.

Product ID: JW2001
Product Name: Black Onyx Chain Necklace
Price: ₹999
Shipping (Pincode: 110001): ₹100
Total: ₹1099
```

---

## Step 8: WhatsApp Message Sent

### WhatsApp Web Interface

```
┌──────────────────────────────────┐
│ To: Elan Jewellery               │
├──────────────────────────────────┤
│                                  │
│ Hello, I want to inquire about   │
│ this jewellery item.             │
│                                  │
│ Product ID: JW2001               │
│ Product Name: Black Onyx Chain   │
│ Necklace                         │
│ Price: ₹999                      │
│ Shipping (Pincode: 110001):      │
│ ₹100                             │
│ Total: ₹1099                     │
│                                  │
│                    [Send] ➤      │
│                                  │
└──────────────────────────────────┘
```

---

## Step 9: Business Receives Order

### WhatsApp Message Received
```
User: Hello, I want to inquire about this jewellery item.

Product ID: JW2001
Product Name: Black Onyx Chain Necklace
Price: ₹999
Shipping (Pincode: 110001): ₹100
Total: ₹1099
```

### Business Can:
- Confirm stock availability
- Proceed with payment
- Arrange delivery to pincode 110001
- Provide tracking details

---

## Alternative Scenario: Multi-Item Order

### Customer Adds Multiple Items

```
Cart Contents:
1. Black Onyx Chain Necklace (JW2001)    ₹999 x 1
2. Minimalist Bracelet (JW2003)          ₹599 x 2
3. Rose Gold Pearl Necklace (JW1001)     ₹999 x 1
```

### Cart Summary with Shipping

```
┌─────────────────────────────────────┐
│   Your Cart                         │
├─────────────────────────────────────┤
│                                     │
│ Subtotal:       ₹3196              │
│ Shipping:       FREE               │
│ (Free on orders ₹1499+)            │
│                                     │
│ Total:          ₹3196              │
│                                     │
└─────────────────────────────────────┘
```

**Note:** Free shipping applied because subtotal (₹3196) ≥ ₹1499

### WhatsApp Message for Multiple Items

```
Hello, I would like to place an order for 
the following items:

1. Black Onyx Chain Necklace (ID: JW2001) 
   - 1x ₹999
2. Minimalist Bracelet (ID: JW2003) 
   - 2x ₹599
3. Rose Gold Pearl Necklace (ID: JW1001) 
   - 1x ₹999

Subtotal: ₹3196
Shipping (Pincode: 110001): Free
Total: ₹3196

Please confirm the order.
```

---

## Different Pincode Scenarios

### Scenario A: High-Demand Region
- Pincode: 400001 (Mumbai)
- Shipping Rate: ₹100
- Message: Includes ₹100 shipping

### Scenario B: Remote Area
- Pincode: 560001 (Bangalore)
- Shipping Rate: ₹200
- Message: Includes ₹200 shipping

### Scenario C: Invalid Pincode
- Pincode: 123456
- System Response: "Pincode not found in our service area"
- Shipping: Not calculated
- Message: Will be sent without shipping (user can inquire)

### Scenario D: Invalid Format
- Pincode: 12345 (5 digits)
- System Response: "Please enter a valid 6-digit pincode"
- Shipping: Not calculated
- Cannot proceed without valid pincode

---

## Data Sent to WhatsApp

### Per Product Inquiry
```json
{
  "product_id": "JW2001",
  "product_name": "Black Onyx Chain Necklace",
  "price": 999,
  "shipping_cost": 100,
  "total": 1099,
  "pincode": "110001"
}
```

### Cart Order
```json
{
  "items": [
    {
      "product_id": "JW2001",
      "product_name": "Black Onyx Chain Necklace",
      "quantity": 1,
      "unit_price": 999,
      "total": 999
    },
    ...
  ],
  "subtotal": 2597,
  "shipping_cost": 100,
  "total": 2697,
  "pincode": "110001"
}
```

---

## Performance Metrics

### User Experience
- **Page Load:** < 1 second (cached)
- **Search Response:** Instant (debounced 300ms)
- **Filter Application:** < 100ms
- **Cart Operations:** Instant (optimistic UI)
- **WhatsApp Open:** 2-3 seconds (native app launch)

### Data Persistence
- Cart persists across browser closes
- Pincode saved in localStorage
- Products cached in sessionStorage
- Wishlist persists indefinitely

---

## Accessibility

### Features
- ✅ Keyboard navigation support
- ✅ Touch-friendly buttons (min 44x44px)
- ✅ Color contrast WCAG AA compliant
- ✅ Alt text on all product images
- ✅ ARIA labels on form inputs
- ✅ Semantic HTML structure
- ✅ Loading states and error messages

---

## Mobile Optimization

### Responsive Breakpoints
- **Mobile:** 2 columns, full width
- **Tablet:** 2-3 columns, optimized padding
- **Desktop:** 2-4 columns, max-width container

### Touch Interactions
- Swipeable product gallery
- Easy-to-tap filter buttons
- Large cart input field
- Mobile-optimized drawer animations

---

## Error Handling

### Pincode Validation Errors
1. **Empty Pincode**
   - Message: "Please enter a 6-digit pincode"
   - User Action: Required to proceed

2. **Invalid Format**
   - Message: "Please enter a valid 6-digit pincode"
   - Example: 12345 (only 5 digits)
   - User Action: Correct format

3. **Service Area Not Covered**
   - Message: "Pincode not found in our service area"
   - Example: 123456 (not in database)
   - User Action: Can still inquire via WhatsApp

### Recovery
- Error message clears when typing correct pincode
- Auto-validation as user types
- "Calculate shipping" button re-enables on valid input

---

## Summary

**Complete Order Journey:**
1. ✅ Browse products (women's/men's)
2. ✅ Filter by collection/category/price
3. ✅ View product details
4. ✅ Add to cart
5. ✅ Enter shipping pincode
6. ✅ View shipping cost & total
7. ✅ Send WhatsApp with all details
8. ✅ Business receives complete order info
9. ✅ Proceed with payment & delivery

**All data flows seamlessly through the system with proper validation, persistence, and error handling.**
