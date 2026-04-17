import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { ERole } from "../user/user.interface";
import { availabilityController } from "./availability.controller";

const router = Router()

// Create/Set availability (lawyer only)
router.post('/set-update-availability', checkAuth(ERole.LAWYER), availabilityController.setAvailability)

// Get lawyer's own availability (must come before /:id)
router.get('/my-availability', checkAuth(ERole.LAWYER), availabilityController.getMyAvailability)

// Admin: get availability by lawyerId
router.get('/admin/lawyer/:lawyerId', checkAuth(ERole.SUPER_ADMIN), availabilityController.getAvailabilityByLawyerId)

// Admin: set availability for a lawyer
router.post('/admin/set', checkAuth(ERole.SUPER_ADMIN), availabilityController.adminSetAvailability)

// Get all availability (public or filtered by lawyerId)
router.get('/get-availability', availabilityController.getAvailability)

// Get availability by ID
router.get('/:id', availabilityController.getAvailabilityById)

// Delete availability (lawyer only - their own)
router.delete('/:id', checkAuth(ERole.LAWYER), availabilityController.deleteAvailability)

export const availabilityRoute = router;