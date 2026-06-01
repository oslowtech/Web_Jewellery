import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { fetchUserOrders, getOrderById, getOrderStatusHistory } from '../services/orderService.js';

const OrderContext = createContext(null);

const initialState = {
  orders: [],
  currentOrder: null,
  orderHistory: [],
  loading: false,
  error: null,
  filters: {
    status: null,
    paymentStatus: null
  }
};

const orderReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ORDERS':
      return {
        ...state,
        orders: action.payload,
        error: null
      };

    case 'SET_CURRENT_ORDER':
      return {
        ...state,
        currentOrder: action.payload,
        error: null
      };

    case 'SET_ORDER_HISTORY':
      return {
        ...state,
        orderHistory: action.payload
      };

    case 'ADD_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        currentOrder: action.payload
      };

    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id ? action.payload : order
        ),
        currentOrder: state.currentOrder?.id === action.payload.id ? action.payload : state.currentOrder
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

    case 'SET_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {
          status: null,
          paymentStatus: null
        }
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
};

export const OrderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);

  // Load orders on mount
  useEffect(() => {
    loadOrders();
  }, []);

  // Load orders when filters change
  useEffect(() => {
    if (Object.values(state.filters).some(v => v !== null)) {
      loadOrders();
    }
  }, [state.filters]);

  // Action creators
  const loadOrders = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const orders = await fetchUserOrders(state.filters);
      dispatch({ type: 'SET_ORDERS', payload: orders });
    } catch (error) {
      console.error('Error loading orders:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.filters]);

  const loadOrderById = useCallback(async (orderId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const order = await getOrderById(orderId);
      dispatch({ type: 'SET_CURRENT_ORDER', payload: order });

      // Load order history
      const history = await getOrderStatusHistory(orderId);
      dispatch({ type: 'SET_ORDER_HISTORY', payload: history });

      return order;
    } catch (error) {
      console.error('Error loading order:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  const addOrder = useCallback((order) => {
    dispatch({ type: 'ADD_ORDER', payload: order });
  }, []);

  const updateOrder = useCallback((order) => {
    dispatch({ type: 'UPDATE_ORDER', payload: order });
  }, []);

  const setFilters = useCallback((filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  const filterByStatus = useCallback((status) => {
    setFilters({ status });
  }, [setFilters]);

  const filterByPaymentStatus = useCallback((paymentStatus) => {
    setFilters({ paymentStatus });
  }, [setFilters]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Helpers
  const getOrderStats = useCallback(() => {
    return {
      total: state.orders.length,
      pending: state.orders.filter(o => o.status === 'pending').length,
      processing: state.orders.filter(o => o.status === 'processing').length,
      shipped: state.orders.filter(o => o.status === 'shipped').length,
      delivered: state.orders.filter(o => o.status === 'delivered').length,
      cancelled: state.orders.filter(o => o.status === 'cancelled').length
    };
  }, [state.orders]);

  const getTotalOrderValue = useCallback(() => {
    return state.orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
  }, [state.orders]);

  const getRecentOrders = useCallback((limit = 5) => {
    return state.orders.slice(0, limit);
  }, [state.orders]);

  const value = {
    state,
    actions: {
      loadOrders,
      loadOrderById,
      addOrder,
      updateOrder,
      setFilters,
      clearFilters,
      filterByStatus,
      filterByPaymentStatus,
      reset
    },
    helpers: {
      getOrderStats,
      getTotalOrderValue,
      getRecentOrders
    }
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within OrderProvider');
  }
  return context;
};

// Hook for loading specific order
export const useOrderDetail = (orderId) => {
  const { state, actions } = useOrder();

  useEffect(() => {
    if (orderId) {
      actions.loadOrderById(orderId);
    }
  }, [orderId, actions]);

  return state.currentOrder;
};
