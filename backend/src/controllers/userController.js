import { findUserById, getAllUsers, deleteUserById } from '../models/userModel.js';

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

export async function deleteUser(req, res) {
  const deletedUser = await deleteUserById(req.params.id);
  if (!deletedUser) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ message: 'User deleted successfully' });
}



