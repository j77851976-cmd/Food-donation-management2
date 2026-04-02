import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String },
  quantity: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true }
  },
  status: { 
    type: String, 
    enum: ['available', 'claimed', 'picked_up', 'delivered'], 
    default: 'available' 
  },
  image: { type: String }
}, { timestamps: true });

const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
