import Donation from '../models/Donation.js';

// @desc    Create a new donation listing
// @route   POST /api/donations
// @access  Private (Donor only)
export const createDonation = async (req, res) => {
  try {
    const { title, description, quantity, expiryDate, location, image } = req.body;

    console.log("createDonation called. User:", req.user);
    if (req.user.role !== 'donor') {
      return res.status(403).json({ message: `Only donors can create listings. Your role is: ${req.user.role}` });
    }

    const donation = await Donation.create({
      donor: req.user.id,
      title,
      description,
      quantity,
      expiryDate,
      location,
      image,
      status: 'available'
    });
    const populatedDonation = await Donation.findById(donation._id).populate('donor', 'name email phone');
    if (req.app.get('io')) {
      req.app.get('io').emit('newDonation', populatedDonation);
    }

    res.status(201).json(populatedDonation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all available donations
// @route   GET /api/donations
// @access  Private
export const getAvailableDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'available' })
      .populate('donor', 'name email phone');
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update donation status (Claimed, Picked up, Delivered)
// @route   PUT /api/donations/:id/status
// @access  Private
export const updateDonationStatus = async (req, res) => {
  try {
    const { status, recipientId, volunteerId } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    donation.status = status;
    if (recipientId) donation.recipient = recipientId;
    if (volunteerId) donation.volunteer = volunteerId;

    const updatedDonation = await donation.save();
    
    if (req.app.get('io')) {
      req.app.get('io').emit('updateDonation', updatedDonation);
    }

    res.json(updatedDonation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Claim a donation (recipient claims it)
// @route   PUT /api/donations/:id/claim
// @access  Private (Recipient only)
export const claimDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone location');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'This donation has already been claimed' });
    }

    donation.status = 'claimed';
    donation.recipient = req.user.id;
    const updatedDonation = await donation.save();

    // Return with populated donor info for contact
    const populated = await Donation.findById(updatedDonation._id)
      .populate('donor', 'name email phone location');

    if (req.app.get('io')) {
      req.app.get('io').emit('updateDonation', populated);
    }

    res.json({
      donation: populated,
      message: 'Donation claimed successfully! You can now contact the donor.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single donation with full donor details
// @route   GET /api/donations/:id
// @access  Private
export const getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone location')
      .populate('recipient', 'name email phone')
      .populate('volunteer', 'name email phone');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
