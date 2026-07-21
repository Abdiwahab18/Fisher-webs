import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, totalAmount, items } = location.state || {};

  const [accountNo, setAccountNo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If no order data, redirect back
  if (!orderId) {
    navigate('/market');
    return null;
  }

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!accountNo) {
      setError('Please provide your Waafi Account Number');
      return;
    }

    setLoading(true);
    setError('');

    try {
    const userRole = localStorage.getItem('fisher_role');
      await api.post('/payments/waafi', {
        orderId,
        accountNo,
        amount: totalAmount
      });
      const isDirectRole = userRole === 'admin' || userRole === 'fisherman';
      alert(isDirectRole
        ? 'Payment successful! Your order has been completed.'
        : 'Payment successful! Your order is now processing.');
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process payment');
      setLoading(false);
    }
  };

  const handleAutopilotCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post(`/orders/${orderId}/autopilot`);
      alert('Autopilot started! The order will be automatically paid, assigned to a driver, picked up, and delivered in real-time. Check your dashboard notifications!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start autopilot');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 dark:text-slate-100 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 text-white p-6 text-center">
          <h2 className="text-2xl font-bold">Secure Checkout</h2>
          <p className="text-slate-300 text-sm mt-1">Complete your order payment</p>
        </div>

        <div className="p-6">
          {/* Order Summary */}
          <div className="mb-6 border-b border-slate-100 pb-6">
            <h3 className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-3">Order Summary</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600 dark:text-slate-400">Order ID:</span>
              <span className="font-semibold">#{orderId}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600 dark:text-slate-400">Total Items:</span>
              <span className="font-semibold">{items?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center text-lg mt-4">
              <span className="font-bold text-slate-800 dark:text-slate-200">Amount Due:</span>
              <span className="font-bold text-cyan-600">${totalAmount?.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="mb-6 bg-cyan-50 p-4 rounded-xl border border-cyan-100">
            <h3 className="font-bold text-cyan-800 mb-2">Waafi Payment</h3>
            <p className="text-sm text-cyan-900 mb-2">
              Enter your Waafi account number below. When you click "Pay Now", you will receive a prompt on your phone to enter your PIN and approve the transaction of <strong>${totalAmount?.toFixed(2)}</strong>.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Waafi Account Number</label>
              <input
                type="text"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                placeholder="e.g. 25261XXXXXXX"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                disabled={loading}
              />
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-white transition-all flex justify-center items-center gap-2 ${
                loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700 shadow-md hover:shadow-lg'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : (
                'Pay Now'
              )}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase">Or Automate</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

           
          </form>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
