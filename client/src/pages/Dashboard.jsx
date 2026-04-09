import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CreateDonation from '../components/CreateDonation';
import DonationDetail from '../components/DonationDetail';
import axios from 'axios';
import { io } from 'socket.io-client';

// Fix default marker icon issue in Leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const center = [12.9716, 77.5946]; // Bangalore default

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 13);
  }, [center, map]);
  return null;
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isCreatingDonation, setIsCreatingDonation] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [donations, setDonations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [donationPopup, setDonationPopup] = useState(null);
  const [claimedPopup, setClaimedPopup] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(userInfo);
      setUser(parsedUser);
      fetchAvailableDonations(parsedUser.token);
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
        (error) => console.log("Geolocation error:", error)
      );
    }
  }, [navigate]);

  useEffect(() => {
    const socket = io(import.meta.env.PROD ? undefined : 'http://localhost:5001');

    socket.on('connect', () => console.log('[Socket] Connected:', socket.id));
    socket.on('connect_error', (err) => console.error('[Socket] Connection error:', err.message));

    socket.on('newDonation', (newDonation) => {
      console.log('[Socket] newDonation received:', newDonation);
      setDonations(prev => {
        if (prev.find(d => d._id === newDonation._id)) return prev;
        return [newDonation, ...prev];
      });
      // Show popup only for volunteers
      const currentUser = JSON.parse(localStorage.getItem('userInfo'));
      console.log('[Socket] currentUser role:', currentUser?.role);
      if (currentUser?.role === 'volunteer') {
        const id = Date.now();
        setDonationPopup({
          title: newDonation.title,
          donor: newDonation.donor?.name || 'A donor',
          quantity: newDonation.quantity,
          location: newDonation.location?.address || ''
        });
        setNotifications(prev => [...prev, { id, title: newDonation.title, donor: newDonation.donor?.name || 'A donor' }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
      }
    });

    socket.on('updateDonation', (updatedDonation) => {
      setDonations(prev =>
        prev.map(d => d._id === updatedDonation._id ? updatedDonation : d)
      );
    });

    socket.on('donationClaimed', (claimedData) => {
      console.log('[Socket] donationClaimed received:', claimedData);
      const currentUser = JSON.parse(localStorage.getItem('userInfo'));
      
      // If I am the donor of this item, show me a THANK YOU popup
      if (currentUser?.role === 'donor' && String(claimedData.donor?._id || claimedData.donor) === currentUser._id) {
        setClaimedPopup({
          title: claimedData.title,
          recipient: claimedData.recipient?.name || 'Someone'
        });
      }
      
      // Also update the local list (remove from available if status changed)
      if (claimedData.status !== 'available') {
         setDonations(prev => prev.filter(d => d._id !== claimedData._id));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchAvailableDonations = async (token) => {
    try {
      const { data } = await axios.get('/api/donations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDonations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDonationClick = async (don) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const { data } = await axios.get(`/api/donations/${don._id}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setSelectedDonation(data);
    } catch (err) {
      // fallback to the donation data we already have
      setSelectedDonation(don);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  if (!user) return <div className="text-center mt-20 animate-pulse text-primary font-medium text-xl">Loading Dashboard...</div>;

  return (
    <div className="space-y-8">
      {donationPopup && (
        <div
          className="animate-popup-backdrop fixed inset-0 z-[10000] flex items-center justify-center bg-black/60"
          style={{ backdropFilter: 'blur(6px)' }}
        >
          <div className="animate-popup-card bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl relative">
            {/* Bouncing icon at top */}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-bounce">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="mt-10 text-center">
              <h2 className="text-3xl font-black font-heading mb-2 text-green-600 tracking-tight">Donation Made! 🎉</h2>
              <p className="text-gray-600 mb-6 font-medium text-base leading-snug">
                <span className="font-bold text-gray-900">{donationPopup.donor}</span> just listed<br />
                <span className="text-xl font-bold text-gray-900">{donationPopup.title}</span>
              </p>

              <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-left">
                <p className="text-gray-700 flex items-center gap-3 mb-2">
                  <span className="text-2xl">🍽️</span>
                  <span className="flex flex-col">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Quantity</span>
                    <span className="font-semibold">{donationPopup.quantity}</span>
                  </span>
                </p>
                {donationPopup.location && (
                  <p className="text-gray-700 flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <span className="flex flex-col">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Location</span>
                      <span className="font-semibold text-sm">{donationPopup.location}</span>
                    </span>
                  </p>
                )}
              </div>

              <button
                onClick={() => setDonationPopup(null)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg"
              >
                Awesome! Let's Go 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {claimedPopup && (
        <div
          className="animate-popup-backdrop fixed inset-0 z-[10000] flex items-center justify-center bg-black/60"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div className="animate-popup-card bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl relative overflow-hidden">
            {/* Confetti-like background decor */}
            <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 text-4xl">✨</div>
            <div className="absolute bottom-0 left-0 p-4 opacity-20 transform -translate-x-4 translate-y-4 text-4xl">🎉</div>
            
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-bounce">
                 <span className="text-4xl">❤️</span>
              </div>
            </div>

            <div className="mt-10 text-center">
              <h2 className="text-3xl font-black font-heading mb-2 text-orange-600 tracking-tight">Food Claimed!</h2>
              <p className="text-gray-600 mb-6 font-medium text-base leading-snug">
                Your listing <span className="font-bold text-gray-900">"{claimedPopup.title}"</span> has been claimed by a lucky neighbor!
              </p>
              
              <div className="bg-orange-50 rounded-2xl p-6 mb-6 border border-orange-100">
                <p className="text-orange-800 text-lg font-bold italic">
                  "Thank you for helping reduce food waste and feeding the community!"
                </p>
              </div>

              <button
                onClick={() => setClaimedPopup(null)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg"
              >
                You're a Hero! 🌟
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Toast Notifications */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="pointer-events-auto flex items-start gap-3 bg-white border-l-4 border-green-500 rounded-xl shadow-2xl p-4 min-w-[300px] max-w-sm animate-slide-in">
            <div className="text-2xl">🍱</div>
            <div>
              <p className="font-bold text-gray-800 text-sm">New Donation Available!</p>
              <p className="text-gray-600 text-xs mt-0.5"><span className="font-medium text-primary">{n.donor}</span> just listed <span className="font-medium">{n.title}</span></p>
            </div>
            <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="ml-auto text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
          </div>
        ))}
      </div>
      {isCreatingDonation && (
        <CreateDonation 
          user={user}
          onClose={() => setIsCreatingDonation(false)} 
          onSuccess={(newDonation) => setDonations([newDonation, ...donations])} 
        />
      )}

      {selectedDonation && (
        <DonationDetail
          donation={selectedDonation}
          currentUser={user}
          onClose={() => setSelectedDonation(null)}
          onClaimed={(updated) => {
            setDonations(donations.map(d => d._id === updated._id ? updated : d));
            setSelectedDonation(null);
          }}
        />
      )}

      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform scale-150 translate-x-12 -translate-y-12">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h2 className="text-4xl font-heading font-bold mb-2">Hello, {user.name}!</h2>
            <p className="text-lg opacity-90 mb-4 capitalize">Role: {user.role}</p>
            <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm text-sm font-medium">
               <span className="w-2 h-2 rounded-full bg-secondary mr-2 animate-pulse"></span> Active status
            </div>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm text-sm font-medium transition">
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <h3 className="text-xl font-heading font-bold text-gray-800 mb-4 border-b pb-2">
            {user.role === 'donor' ? 'Your Listings' : 'Available Donations'}
          </h3>
          
          {donations.length === 0 ? (
            <div className="text-gray-500 italic text-sm text-center py-8">
              No donations found.
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {donations.map(don => (
                <div 
                  key={don._id} 
                  onClick={() => handleDonationClick(don)}
                  className="p-4 border rounded-xl bg-gray-50 hover:bg-primary-light/30 hover:border-primary/30 cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-gray-800 group-hover:text-primary transition">{don.title}</span>
                      <span className="text-gray-500 ml-2">— {don.quantity}</span>
                      <div className="text-xs text-gray-500 mt-1">Expires: {new Date(don.expiryDate).toLocaleDateString()}</div>
                      {don.donor?.name && (
                        <div className="text-xs text-primary mt-1 font-medium">by {don.donor.name}</div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        don.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>{don.status.replace('_', ' ')}</span>
                      <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition font-medium">
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={() => user.role === 'donor' ? setIsCreatingDonation(true) : fetchAvailableDonations(JSON.parse(localStorage.getItem('userInfo')).token)}
            className="w-full mt-4 py-3 border-2 border-primary text-primary hover:bg-primary-light hover:text-primary-dark rounded-xl font-medium transition duration-200"
          >
            {user.role === 'donor' ? '+ Create New Listing' : '🔄 Refresh Available Food'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-heading font-bold text-gray-800 mb-4 border-b pb-2">Donation Map View</h3>
          <div className="rounded-xl overflow-hidden" style={{ height: '400px' }}>
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}>
              {userLocation && <MapUpdater center={userLocation} />}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {userLocation && (
                <Marker position={userLocation}>
                  <Popup>📍 <strong>You are here</strong></Popup>
                </Marker>
              )}
              {donations.filter(d => d.location?.lat && d.location?.lng).map(don => (
                <Marker key={don._id} position={[don.location.lat, don.location.lng]}>
                  <Popup>
                    <div className="text-sm">
                      <strong>{don.title}</strong><br />
                      Qty: {don.quantity}<br />
                      Expires: {new Date(don.expiryDate).toLocaleDateString()}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
