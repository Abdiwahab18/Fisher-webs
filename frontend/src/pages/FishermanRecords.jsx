import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

function FishermanRecords() {
  const [catches, setCatches] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('fisher_role');
  const [formData, setFormData] = useState({
    fish_name: '',
    quantity: '',
    weight: '',
    price: '',
    location: '',
    catch_date: '',
    image: '',
    status: 'listed'
  });

  useEffect(() => {
    loadCatches();
  }, []);

  const loadCatches = async () => {
    try {
      const response = await api.get('/catches/my-catches');
      setCatches(response.data);
      setError('');
    } catch (err) {
      setError('Unable to load catches.');
    }
  };

  const resetForm = () => {
    setFormData({
      fish_name: '',
      quantity: '',
      weight: '',
      price: '',
      location: '',
      catch_date: '',
      image: '',
      status: 'listed'
    });
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing catch
        await api.put(`/catches/${editingId}`, formData);
        setSuccessMessage('Catch updated successfully!');
      } else {
        // Create new catch
        await api.post('/catches', formData);
        setSuccessMessage('Catch added successfully!');
      }
      resetForm();
      setShowForm(false);
      loadCatches();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save catch.');
    }
  };

  const handleEdit = (catch_) => {
    setFormData({
      fish_name: catch_.fish_name,
      quantity: catch_.quantity,
      weight: catch_.weight || '',
      price: catch_.price,
      location: catch_.location || '',
      catch_date: catch_.catch_date || '',
      image: catch_.image || '',
      status: catch_.status || 'listed'
    });
    setEditingId(catch_.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/catches/${id}`);
      setSuccessMessage('Catch deleted successfully!');
      setDeleteConfirm(null);
      loadCatches();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Unable to delete catch.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fisher_token');
    localStorage.removeItem('fisher_role');
    navigate('/login');
  };

  const totalValue = catches.reduce((sum, c) => sum + (parseFloat(c.price) * parseFloat(c.quantity) || 0), 0);
  const activeCatches = catches.filter(c => c.status !== 'sold').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex">
      {/* Sidebar */}
      <aside className="w-40 bg-slate-700 text-white p-6 shadow-xl flex flex-col">
        <h2 className="text-xl font-bold mb-8">MarisSync</h2>

        <nav className="space-y-1 mb-8 flex-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
          >
            <span>📊</span>
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/fisherman')}
            className="flex items-center gap-3 px-4 py-2 rounded bg-cyan-600 text-white w-full text-left text-sm"
          >
            <span>🎣</span>
            <span>Catches</span>
          </button>
          <button
            onClick={() => navigate('/market')}
            className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
          >
            <span>🛍️</span>
            <span>Market</span>
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
          >
            <span>📦</span>
            <span>Orders</span>
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
            >
              <span>👨‍💼</span>
              <span>Admin Panel</span>
            </button>
          )}
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-600 w-full text-left text-sm"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        </nav>

        <div className="mb-6 border-t border-slate-600 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold">
              F
            </div>
            <div>
              <p className="font-semibold text-sm">Fisherman</p>
              <p className="text-xs text-slate-400">User</p>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="w-full bg-cyan-500 text-slate-900 font-semibold py-2 rounded-lg text-sm hover:bg-cyan-400"
          >
            + Log Catch
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full text-slate-300 hover:text-white text-sm text-left px-4 py-2 rounded hover:bg-slate-600"
        >
          🚪 Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Catch Records</h1>
          <p className="text-slate-600 mt-2">
            Track your catches, manage inventory, and monitor sales performance.
          </p>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-slate-500 text-xs font-semibold uppercase">Total Catches</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{catches.length}</p>
            <p className="text-green-600 text-xs font-semibold mt-3">All time</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-slate-500 text-xs font-semibold uppercase">Total Value</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">${totalValue.toFixed(2)}</p>
            <p className="text-green-600 text-xs font-semibold mt-3">Inventory</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-slate-500 text-xs font-semibold uppercase">Total Weight</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {catches.reduce((sum, c) => sum + parseFloat(c.quantity || 0), 0).toFixed(1)} kg
            </p>
            <p className="text-slate-600 text-xs mt-3">All catches</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-slate-500 text-xs font-semibold uppercase">Active Listings</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{activeCatches}</p>
            <p className="text-cyan-600 text-xs font-semibold mt-3">Available</p>
          </div>
        </div>

        {/* Add/Edit Catch Form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-8 border-2 border-cyan-400">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingId ? 'Edit Catch' : 'Log New Catch'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Fish Species *</label>
                <input
                  type="text"
                  name="fish_name"
                  value={formData.fish_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Price per kg ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Catch Date</label>
                <input
                  type="date"
                  name="catch_date"
                  value={formData.catch_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Image URL (optional)</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                >
                  <option value="listed">Listed</option>
                  <option value="sold">Sold</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="bg-cyan-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-cyan-600"
                >
                  {editingId ? 'Update Catch' : 'Save Catch'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="bg-slate-300 text-slate-700 px-6 py-2 rounded-lg font-semibold hover:bg-slate-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Catch?</h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete this catch? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 flex-1"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-400 flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Catches Table */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Your Catches</h2>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-cyan-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-600"
            >
              + Add Catch
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">SPECIES</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">QUANTITY</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">WEIGHT</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">PRICE/KG</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">LOCATION</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">DATE</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">STATUS</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {catches.length > 0 ? (
                  catches.map((catch_) => (
                    <tr key={catch_.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {catch_.image ? (
                            <img src={catch_.image} alt={catch_.fish_name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-semibold">
                              {catch_.fish_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-slate-900">{catch_.fish_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-700">{parseFloat(catch_.quantity).toFixed(2)} kg</td>
                      <td className="py-4 px-4 text-slate-700">{catch_.weight ? parseFloat(catch_.weight).toFixed(2) : '---'} kg</td>
                      <td className="py-4 px-4 text-slate-700 font-semibold">${parseFloat(catch_.price).toFixed(2)}</td>
                      <td className="py-4 px-4 text-slate-700">{catch_.location || '---'}</td>
                      <td className="py-4 px-4 text-slate-700">
                        {catch_.catch_date
                          ? new Date(catch_.catch_date).toLocaleDateString()
                          : new Date(catch_.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          catch_.status === 'sold'
                            ? 'bg-red-100 text-red-700'
                            : catch_.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {catch_.status ? catch_.status.charAt(0).toUpperCase() + catch_.status.slice(1) : 'Listed'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(catch_)}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(catch_.id)}
                            className="text-red-600 hover:text-red-800 font-semibold text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">
                      No catches recorded yet. Click "Add Catch" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default FishermanRecords;
