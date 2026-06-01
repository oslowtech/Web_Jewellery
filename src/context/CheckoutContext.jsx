import { createContext, useContext, useMemo, useReducer, useCallback } from 'react';

const CheckoutContext = createContext(null);

const initialState = {
  billingAddress: null,
  shippingAddress: null,
  gifting: {
    isGift: false,
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    giftMessage: '',
    giftWrap: false,
    fromName: ''
  },
  cartItems: [],
  taxRate: 0.18, // 18% GST default
  shippingCharge: 0,
  discountAmount: 0,
  loading: false,
  error: null,
  orderCreated: null
};

const checkoutReducer = (state, action) => {
  switch (action.type) {
    case 'SET_BILLING_ADDRESS':
      return {
        ...state,
        billingAddress: action.payload,
        error: null
      };

    case 'SET_SHIPPING_ADDRESS':
      return {
        ...state,
        shippingAddress: action.payload,
        error: null
      };

    case 'SET_GIFTING':
      return {
        ...state,
        gifting: {
          ...state.gifting,
          ...action.payload
        },
        error: null
      };

    case 'SET_GIFT_ENABLED':
      return {
        ...state,
        gifting: {
          ...state.gifting,
          isGift: action.payload
        }
      };

    case 'SET_CART_ITEMS':
      return {
        ...state,
        cartItems: action.payload,
        error: null
      };

    case 'SET_TAX_RATE':
      return {
        ...state,
        taxRate: action.payload
      };

    case 'SET_SHIPPING_CHARGE':
      return {
        ...state,
        shippingCharge: action.payload,
        error: null
      };

    case 'SET_DISCOUNT':
      return {
        ...state,
        discountAmount: action.payload
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case 'SET_ORDER_CREATED':
      return {
        ...state,
        orderCreated: action.payload,
        loading: false,
        error: null
      };

    case 'RESET':
      return initialState;

    case 'RESET_ADDRESSES':
      return {
        ...state,
        billingAddress: null,
        shippingAddress: null
      };

    default:
      return state;
  }
};

export const CheckoutProvider = ({ children }) => {
  const [state, dispatch] = useReducer(checkoutReducer, initialState);

  // Action creators
  const setBillingAddress = useCallback((address) => {
    dispatch({ type: 'SET_BILLING_ADDRESS', payload: address });
  }, []);

  const setShippingAddress = useCallback((address) => {
    dispatch({ type: 'SET_SHIPPING_ADDRESS', payload: address });
  }, []);

  const setGifting = useCallback((gifting) => {
    dispatch({ type: 'SET_GIFTING', payload: gifting });
  }, []);

  const setGiftEnabled = useCallback((enabled) => {
    dispatch({ type: 'SET_GIFT_ENABLED', payload: enabled });
  }, []);

  const setCartItems = useCallback((items) => {
    dispatch({ type: 'SET_CART_ITEMS', payload: items });
  }, []);

  const setTaxRate = useCallback((rate) => {
    dispatch({ type: 'SET_TAX_RATE', payload: rate });
  }, []);

  const setShippingCharge = useCallback((charge) => {
    dispatch({ type: 'SET_SHIPPING_CHARGE', payload: charge });
  }, []);

  const setDiscount = useCallback((amount) => {
    dispatch({ type: 'SET_DISCOUNT', payload: amount });
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setOrderCreated = useCallback((order) => {
    dispatch({ type: 'SET_ORDER_CREATED', payload: order });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const resetAddresses = useCallback(() => {
    dispatch({ type: 'RESET_ADDRESSES' });
  }, []);

  // Calculate totals
  const totals = {
    subtotal: state.cartItems.reduce(
      (sum, item) => {
        const unitPrice = item.discountPrice ?? item.discount_price ?? item.price;
        return sum + unitPrice * item.quantity;
      },
      0
    ),
    taxAmount: 0, // Will be calculated
    shippingCharge: state.shippingCharge,
    discountAmount: state.discountAmount,
    totalAmount: 0 // Will be calculated
  };

  totals.taxAmount = totals.subtotal * state.taxRate;
  totals.totalAmount = totals.subtotal + totals.taxAmount + totals.shippingCharge - totals.discountAmount;

  // Validation helpers
  const isCheckoutReady = useCallback(() => {
    return (
      state.billingAddress &&
      state.shippingAddress &&
      state.cartItems.length > 0 &&
      totals.totalAmount > 0
    );
  }, [state.billingAddress, state.shippingAddress, state.cartItems, totals.totalAmount]);

  const validateGifting = useCallback(() => {
    if (!state.gifting.isGift) return { isValid: true, errors: [] };

    const errors = [];
    if (!state.gifting.recipientName?.trim()) {
      errors.push('Recipient name is required');
    }
    if (!state.gifting.recipientPhone?.trim()) {
      errors.push('Recipient phone is required');
    }
    if (!/^\d{10}$/.test(state.gifting.recipientPhone?.replace(/\D/g, '') || '')) {
      errors.push('Recipient phone must be 10 digits');
    }

    return { isValid: errors.length === 0, errors };
  }, [state.gifting]);

  const actions = useMemo(() => ({
    setBillingAddress,
    setShippingAddress,
    setGifting,
    setGiftEnabled,
    setCartItems,
    setTaxRate,
    setShippingCharge,
    setDiscount,
    setLoading,
    setError,
    setOrderCreated,
    reset,
    resetAddresses
  }), [
    setBillingAddress,
    setShippingAddress,
    setGifting,
    setGiftEnabled,
    setCartItems,
    setTaxRate,
    setShippingCharge,
    setDiscount,
    setLoading,
    setError,
    setOrderCreated,
    reset,
    resetAddresses
  ]);

  const value = {
    state,
    actions,
    totals,
    isCheckoutReady,
    validateGifting
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within CheckoutProvider');
  }
  return context;
};
