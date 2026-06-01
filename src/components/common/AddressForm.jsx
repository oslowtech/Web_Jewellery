import { useState, useEffect } from 'react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry',
  'Chandigarh', 'Ladakh', 'Jammu & Kashmir'
];

const AddressForm = ({ initialData, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    address_type: 'billing',
    is_default: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        street_address: initialData.street_address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        postal_code: initialData.postal_code || '',
        country: initialData.country || 'India',
        address_type: initialData.address_type || 'billing',
        is_default: initialData.is_default || false
      });
      setErrors({});
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.phone || !/^\d{10,12}$/.test(formData.phone.replace(/[^\d]/g, ''))) {
      newErrors.phone = 'Valid phone number (10-12 digits) is required';
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    if (!formData.street_address.trim()) {
      newErrors.street_address = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.postal_code || !/^\d{6}$/.test(formData.postal_code)) {
      newErrors.postal_code = 'Valid 6-digit postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-onyx mb-2">Full Name *</label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose ${errors.full_name ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Enter your full name"
          disabled={loading}
        />
        {errors.full_name && <p className="text-red-600 text-sm mt-1">{errors.full_name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-onyx mb-2">Phone Number *</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="10-digit phone number"
          disabled={loading}
        />
        {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-onyx mb-2">Email *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="your@email.com"
          disabled={loading}
        />
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-onyx mb-2">Street Address *</label>
        <textarea
          name="street_address"
          value={formData.street_address}
          onChange={handleChange}
          rows="3"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose resize-none ${errors.street_address ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="House number, building name, road name"
          disabled={loading}
        />
        {errors.street_address && <p className="text-red-600 text-sm mt-1">{errors.street_address}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-onyx mb-2">City *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="City"
            disabled={loading}
          />
          {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-onyx mb-2">State *</label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
            disabled={loading}
          >
            <option value="">Select State</option>
            {INDIAN_STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-onyx mb-2">Postal Code *</label>
          <input
            type="text"
            name="postal_code"
            value={formData.postal_code}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose ${errors.postal_code ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="6-digit postal code"
            maxLength="6"
            disabled={loading}
          />
          {errors.postal_code && <p className="text-red-600 text-sm mt-1">{errors.postal_code}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-onyx mb-2">Country</label>
          <input
            type="text"
            name="country"
            value={formData.country}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose bg-gray-50"
            disabled
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-onyx mb-2">Address Type *</label>
        <div className="flex gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="address_type"
              value="billing"
              checked={formData.address_type === 'billing'}
              onChange={handleChange}
              className="mr-2"
              disabled={loading}
            />
            <span>Billing</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="address_type"
              value="shipping"
              checked={formData.address_type === 'shipping'}
              onChange={handleChange}
              className="mr-2"
              disabled={loading}
            />
            <span>Shipping</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="address_type"
              value="both"
              checked={formData.address_type === 'both'}
              onChange={handleChange}
              className="mr-2"
              disabled={loading}
            />
            <span>Both</span>
          </label>
        </div>
      </div>

      <div className="flex items-center">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="is_default"
            checked={formData.is_default}
            onChange={handleChange}
            className="w-4 h-4 text-rose rounded border-gray-300 focus:ring-rose"
            disabled={loading}
          />
          <span className="ml-3 text-sm font-medium text-onyx">Set as default</span>
        </label>
      </div>

      <div className="flex gap-4 pt-6">
        <button
          type="submit"
          className="flex-1 bg-rose text-cream py-3 rounded-lg font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : initialData ? 'Update' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-onyx py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddressForm;
