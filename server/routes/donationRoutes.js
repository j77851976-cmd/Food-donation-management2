import express from 'express';
import { createDonation, getAvailableDonations, updateDonationStatus, claimDonation, getDonationById } from '../controllers/donationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createDonation)
  .get(protect, getAvailableDonations);

router.route('/:id')
  .get(protect, getDonationById);

router.route('/:id/status')
  .put(protect, updateDonationStatus);

router.route('/:id/claim')
  .put(protect, claimDonation);

export default router;
