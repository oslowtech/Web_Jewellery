import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  fetchAddresses,
  saveAddress,
  updateAddress,
  deleteAddress,
  validateAddress
} from '../services/addressService.js';
import AddressForm from '../components/common/AddressForm.jsx';

const AddressManager = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    loadAddresses();
  }, [user, authLoading, navigate]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAddresses();
      setAddresses(data);
    } catch (err) {
      const message = err.message || 'Failed to load addresses';
      setError(message);
      addToast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (formData) => {
    try {
      // Validate
      const validation = validateAddress(formData);
      if (!validation.isValid) {
        const message = validation.errors.join(', ');
        setError(message);
        addToast({ message, type: 'error' });
        return;
      }

      setLoading(true);
      setError(null);

      if (editingId) {
        // Update existing
        await updateAddress(editingId, formData);
        addToast({ message: 'Address updated successfully', type: 'success' });
      } else {
        // Create new
        await saveAddress(formData);
        addToast({ message: 'Address added successfully', type: 'success' });
      }

      // Reload addresses
      await loadAddresses();
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      const message = err.message || 'Failed to save address';
      setError(message);
      addToast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteAddress(addressId);
      addToast({ message: 'Address deleted successfully', type: 'success' });
      await loadAddresses();
    } catch (err) {
      const message = err.message || 'Failed to delete address';
      setError(message);
      addToast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const editingAddress = editingId
    ? addresses.find(a => a.id === editingId)
    : null;

  return (
    <div className="min-h-screen bg-cream py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-onyx">My Addresses</h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-rose text-cream px-6 py-2 rounded-lg hover:bg-opacity-90 transition"
              disabled={loading}
            >
              + Add Address
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form Section */}
        {showForm && (
          <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold mb-6">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h2>
            <AddressForm
              initialData={editingAddress}
              onSubmit={handleSaveAddress}
              onCancel={handleCancelForm}
              loading={loading}
            />
          </div>
        )}

        {/* Addresses List */}
        <div className="space-y-6">
          {loading && !showForm ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading addresses...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-4">No addresses saved yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-rose hover:underline"
              >
                Add your first address
              </button>
            </div>
          ) : (
            addresses.map(address => (
              <div
                key={address.id}
                className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-onyx">
                        {address.full_name}
                      </h3>
                      <div className="flex gap-2">
                        {address.address_type && (
                          <span className="text-xs bg-rose bg-opacity-10 text-rose px-3 py-1 rounded-full">
                            {address.address_type}
                          </span>
                        )}
                        {address.is_default && (
                          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-1">{address.street_address}</p>
                    <p className="text-gray-700 mb-1">
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                    <p className="text-gray-700 mb-3">{address.country}</p>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Phone: {address.phone}</p>
                      <p>Email: {address.email}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditAddress(address)}
                      className="px-4 py-2 text-sm font-medium text-rose border border-rose rounded-lg hover:bg-rose hover:text-cream transition"
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-600 hover:text-cream transition"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Return to Shopping */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/shop')}
            className="text-rose hover:underline"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressManager;
