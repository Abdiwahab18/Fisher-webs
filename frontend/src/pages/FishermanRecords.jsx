import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Layout from '../components/Layout';

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      setError('Weight must be greater than 0.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (parseFloat(formData.price) <= 0) {
      setError('Price must be greater than 0.');
      setTimeout(() => setError(''), 3000);
      return;
    }

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

  const totalValue = catches.reduce((sum, c) => sum + (parseFloat(c.price) * parseFloat(c.weight) || 0), 0);
  const activeCatches = catches.filter(c => c.status !== 'sold').length;

  return (
    <Layout activePage="catches" className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="p-4 md:p-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Catch Records</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Total Catches</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{catches.length}</p>
            <p className="text-green-600 text-xs font-semibold mt-3">All time</p>
          </div>

          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Total Value</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">${totalValue.toFixed(2)}</p>
            <p className="text-green-600 text-xs font-semibold mt-3">Inventory</p>
          </div>

          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Total Weight</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
              {catches.reduce((sum, c) => sum + parseFloat(c.weight || 0), 0).toFixed(1)} kg
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-3">All catches</p>
          </div>

          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Active Listings</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{activeCatches}</p>
            <p className="text-cyan-600 text-xs font-semibold mt-3">Available</p>
          </div>
        </div>

        {/* Add/Edit Catch Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm mb-8 border-2 border-cyan-400">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {editingId ? 'Edit Catch' : 'Log New Catch'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Fish Species *</label>
                <select
                  name="fish_name"
                  value={formData.fish_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 dark:bg-slate-700"
                  required
                >
                  <option value="">Select a species</option>
                  <option value="Salmon">Salmon</option>
                  <option value="Tuna">Tuna</option>
                  <option value="Cod">Tarraqad</option>
                  <option value="Mackerel">Mackerel</option>
                  <option value="Snapper">Snapper</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Weight (kg) *</label>
                <input
                  type="number"
                  step="1"
                  min="2"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Price per kg ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Catch Date</label>
                <input
                  type="date"
                  name="catch_date"

                  max={new Date().toISOString().split('T')[0]}
                  value={formData.catch_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-700 dark:text-slate-300"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Image Upload </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-700 dark:text-slate-300"
                />
                {formData.image && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-500 mb-2">Preview:</p>
                    <img src={formData.image} alt="Preview" className="h-32 object-cover rounded-lg border border-slate-300 dark:border-slate-600" />
                  </div>
                )}
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
                  className="bg-slate-300 text-slate-700 dark:text-slate-300 px-6 py-2 rounded-lg font-semibold hover:bg-slate-400"
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
            <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Delete Catch?</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
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
                  className="bg-slate-300 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-semibold hover:bg-slate-400 flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Catches Table */}
        <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Your Catches</h2>
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

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">SPECIES</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">WEIGHT</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">PRICE/KG</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">LOCATION</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">DATE</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">STATUS</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {catches.length > 0 ? (
                  catches.map((catch_) => (
                    <tr key={catch_.id} className="border-b border-slate-100 hover:bg-slate-50 dark:bg-slate-900">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {catch_.image ? (
                            <img src={catch_.image} alt={catch_.fish_name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-semibold">
                              {catch_.fish_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{catch_.fish_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300">{parseFloat(catch_.weight).toFixed(2)} kg</td>
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-semibold">${parseFloat(catch_.price).toFixed(2)}</td>
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300">{catch_.location || '---'}</td>
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
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
                          {/* <button
                            onClick={() => handleEdit(catch_)}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
                          >
                            Edit
                          </button> */}
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
                    <td colSpan="8" className="py-8 text-center text-slate-500 dark:text-slate-400">
                      No catches recorded yet. Click "Add Catch" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col gap-4 mt-4">
            {catches.length > 0 ? (
              catches.map((catch_) => (
                <div key={catch_.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-3 bg-slate-50 dark:bg-slate-900/50 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {catch_.image ? (
                        <img src={catch_.image} alt={catch_.fish_name} className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-lg shadow-sm">
                          {catch_.fish_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-lg block">{catch_.fish_name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {catch_.catch_date ? new Date(catch_.catch_date).toLocaleDateString() : new Date(catch_.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      catch_.status === 'sold'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : catch_.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {catch_.status ? catch_.status.charAt(0).toUpperCase() + catch_.status.slice(1) : 'Listed'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-2 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">Weight</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{parseFloat(catch_.weight).toFixed(2)} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">Price/kg</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">${parseFloat(catch_.price).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">Location</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{catch_.location || '---'}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-1 pt-3 border-t border-slate-200 dark:border-slate-700">
                    {/* <button onClick={() => handleEdit(catch_)} className="flex-1 bg-blue-50 text-blue-700 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-colors">Edit</button> */}
                    <button onClick={() => setDeleteConfirm(catch_.id)} className="flex-1 bg-red-50 text-red-700 py-2.5 rounded-lg font-bold text-sm hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-colors">Delete</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                No catches recorded yet. Click "Add Catch" to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default FishermanRecords;
