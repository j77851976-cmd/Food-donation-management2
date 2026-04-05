import { useState } from 'react';
import axios from 'axios';

const CreateDonation = ({ onClose, onSuccess, user }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', quantity: '', expiryDate: '', 
    location: { lat: 37.7749, lng: -122.4194, address: 'Global SF' }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const { data } = await axios.post('/api/donations', formData, config);
      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full transform transition-all animate-fade-in-up">
        <h2 className="text-2xl font-bold font-heading text-gray-800 mb-6 border-b pb-2">List Food Donation</h2>
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title (e.g., 50 Sandwiches)</label>
            <input type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none transition" required
              onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Diet info</label>
            <textarea className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none transition" rows="2"
              onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity/Weight</label>
              <input type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none transition" required
                onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date & Time</label>
              <input type="datetime-local" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none transition" required
                onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium shadow-md transition disabled:opacity-50">
              {loading ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDonation;
