import { findUserById, getAllUsers, getUsersByRole, deleteUserById, updateUserStatus, getSystemStats, getRevenueByDay, updateUserProfile, getAdminContact } from '../models/userModel.js';

export async function currentUser(req, res) {
  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
}

export async function listUsers(req, res) {
  const users = await getAllUsers();
  res.json(users);
}

export async function listFishermen(req, res) {
  const fishermen = await getUsersByRole('fisherman');
  res.json(fishermen);
}

export async function deleteUser(req, res) {
  const deletedUser = await deleteUserById(req.params.id);
  if (!deletedUser) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ message: 'User deleted successfully' });
}

export async function updateUserStatusController(req, res) {
  const { status } = req.body;
  if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }
  const updatedUser = await updateUserStatus(req.params.id, status);
  if (!updatedUser) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(updatedUser);
}

export async function getSystemStatsController(req, res) {
  const stats = await getSystemStats();
  res.json(stats);
}

export async function getRevenueAnalytics(req, res) {
  const days = req.query.days ? parseInt(req.query.days) : 7;
  const revenueData = await getRevenueByDay(days);
  res.json(revenueData);
}

export async function updateProfileController(req, res) {
  const { name, email, profile_picture, phone, whatsapp, facebook } = req.body;
  
  if (!name && !email && profile_picture === undefined && phone === undefined && whatsapp === undefined && facebook === undefined) {
    return res.status(400).json({ message: 'At least one field is required to update' });
  }

  try {
    const updatedUser = await updateUserProfile(req.user.id, { name, email, profile_picture, phone, whatsapp, facebook });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(updatedUser);
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Error updating profile' });
  }
}

export async function getAdminContactController(req, res) {
  try {
    const adminContact = await getAdminContact();
    if (!adminContact) {
      return res.json({
        name: 'Fisher Support',
        email: 'support@fisher.com',
        phone: null,
        whatsapp: null,
        facebook: null
      });
    }
    res.json(adminContact);
  } catch (error) {
    console.error('Error in getAdminContactController:', error);
    res.status(500).json({ message: 'Error retrieving admin contact info' });
  }
}

