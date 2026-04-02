import { useState } from 'react';
import axios from 'axios';

const DonationDetail = ({ donation, onClose, onClaimed, currentUser }) => {
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [error, setError] = useState('');

  const donorInfo = donation.donor;
  const isClaimed = donation.status === 'claimed' || claimResult;
  const isOwnDonation = currentUser?.role === 'donor';

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const { data } = await axios.put(
        `http://localhost:5001/api/donations/${donation._id}/claim`,
        {},
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      setClaimResult(data);
      if (onClaimed) onClaimed(data.donation);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim donation');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
          <h2 className="text-2xl font-heading font-bold">{donation.title}</h2>
          <p className="opacity-90 mt-1">{donation.description || 'No description provided'}</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Donation Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-500 block text-xs mb-1">Quantity</span>
              <span className="font-bold text-gray-800">{donation.quantity}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-500 block text-xs mb-1">Expiry</span>
              <span className="font-bold text-gray-800">{new Date(donation.expiryDate).toLocaleDateString()}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-500 block text-xs mb-1">Status</span>
              <span className={`font-bold capitalize ${isClaimed ? 'text-orange-600' : 'text-green-600'}`}>
                {isClaimed ? 'Claimed' : donation.status.replace('_', ' ')}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-500 block text-xs mb-1">Location</span>
              <span className="font-bold text-gray-800 text-xs">{donation.location?.address || 'Not specified'}</span>
            </div>
          </div>

          {/* Donor Contact Card */}
          {donorInfo && typeof donorInfo === 'object' && (
            <div className="border-2 border-primary/20 rounded-xl p-4 bg-primary-light/30">
              <h3 className="font-heading font-bold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
                Donor Contact
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-14">Name:</span>
                  <span className="font-medium text-gray-800">{donorInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-14">Email:</span>
                  <a href={`mailto:${donorInfo.email}`} className="font-medium text-primary hover:underline">
                    {donorInfo.email}
                  </a>
                </div>
                {donorInfo.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-14">Phone:</span>
                    <a href={`tel:${donorInfo.phone}`} className="font-medium text-primary hover:underline">
                      {donorInfo.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm text-center">{error}</div>}

          {claimResult && (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm text-center font-medium">
              ✅ {claimResult.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-300 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition">
              Close
            </button>
            {!isOwnDonation && !isClaimed && (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-md transition disabled:opacity-50"
              >
                {claiming ? 'Claiming...' : 'Claim & Contact Donor'}
              </button>
            )}
            {donorInfo?.email && (
              <a
                href={`mailto:${donorInfo.email}?subject=Regarding your food donation: ${donation.title}`}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-md transition text-center"
              >
                📧 Email Donor
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationDetail;
