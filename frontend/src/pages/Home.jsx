import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const liveFleetData = [
    { vessel: 'Blue Marlin II', species: 'Atlantic Cod', quantity: '1,240', status: 'SOLD', location: '45.02 N, 14.21 W' },
    { vessel: 'Deep Seeker', species: 'Bluefin Tuna', quantity: '850', status: 'IN TRANSIT', location: '42.15 N, 10.05 W' },
    { vessel: 'Ocean Queen', species: 'Mackerel', quantity: '3,100', status: 'SOLD', location: '48.33 N, 19.44 W' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">MarisSync</h1>
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate('/market')}
              className="text-slate-700 hover:text-cyan-600 font-medium"
            >
              Market
            </button>
            <a href="#fleet" className="text-slate-700 hover:text-cyan-600 font-medium">Fleet</a>
            <a href="#stats" className="text-slate-700 hover:text-cyan-600 font-medium">Stats</a>
            <a href="#about" className="text-slate-700 hover:text-cyan-600 font-medium">About</a>
            <button
              onClick={() => navigate('/login')}
              className="text-slate-700 hover:text-cyan-600 font-medium"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-cyan-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-cyan-600"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-r from-slate-900/70 to-cyan-900/70 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1574263867373-55a63925a0df?w=1200&h=400&fit=crop")',
            backgroundBlend: 'multiply',
          }}
        ></div>

        {/* Content */}
        <div className="relative h-full flex items-center px-6 py-12">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-bold text-white mb-4">Maritime Market & Catch Management for Coastal Fisheries</h2>
            <p className="text-lg text-gray-200 mb-8">
              Record catch details on the boat, connect with buyers ashore, and manage orders from launch to landing. MarisSync makes commercial fishing operations more efficient and more transparent.
            </p>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => navigate('/register')}
                className="bg-cyan-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-cyan-600 flex items-center gap-2"
              >
                Start Trading →
              </button>
              <button
                onClick={() => navigate('/market')}
                className="bg-white text-slate-900 px-8 py-3 rounded-lg font-semibold hover:bg-slate-100"
              >
                View Market
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="border-l-4 border-cyan-500 pl-6">
            <p className="text-3xl font-bold text-slate-900">12,400</p>
            <p className="text-sm text-slate-500 uppercase tracking-wide mt-2">Total Catch Records</p>
          </div>
          <div className="border-l-4 border-cyan-500 pl-6">
            <p className="text-3xl font-bold text-slate-900">380</p>
            <p className="text-sm text-slate-500 uppercase tracking-wide mt-2">Active Vessels</p>
          </div>
          <div className="border-l-4 border-cyan-500 pl-6">
            <p className="text-3xl font-bold text-slate-900">98%</p>
            <p className="text-sm text-slate-500 uppercase tracking-wide mt-2">Order Fulfillment</p>
          </div>
          <div className="border-l-4 border-cyan-500 pl-6">
            <p className="text-3xl font-bold text-slate-900">72</p>
            <p className="text-sm text-slate-500 uppercase tracking-wide mt-2">Partner Markets</p>
          </div>
        </div>
      </section>

      {/* Precision Platform Section */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">How it works</h3>
          <h2 className="text-4xl font-bold text-slate-900 mb-16">Operational tools built for fisheries and marine trade</h2>

          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12">
            {/* Left Content */}
            <div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden h-96 mb-8">
                <div className="w-full h-full bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),_transparent_50%),linear-gradient(180deg,#0f172a_0%,#0f172a_100%)] flex items-center justify-center">
                  <div className="text-center px-6">
                    <p className="text-cyan-400 font-semibold">Catch Records + Live Market</p>
                    <p className="text-white text-sm mt-2">Document every haul, price, and destination from sea to sale.</p>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-4">Trade with confidence at every stage</h3>
              <p className="text-slate-600 mb-6">
                MarisSync helps fishermen, buyers, and dock managers stay aligned through catch reporting, marketplace pricing, and order tracking. Reduce waste, improve traceability, and close deals faster.
              </p>
              <a href="#fleet" className="text-cyan-600 font-semibold hover:text-cyan-700">
                See live fleet activity →
              </a>
            </div>

            {/* Right Features */}
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🧾</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Digital Catch Log</h4>
                  <p className="text-slate-600">
                    Capture species, weight, vessel location, and buyer preferences in a single digital record for faster processing at the dock.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🛒</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Buyer Marketplace</h4>
                  <p className="text-slate-600">
                    Share available catch with local buyers and wholesalers, compare bids, and secure the best price before landing.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📈</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Order Tracking</h4>
                  <p className="text-slate-600">
                    Track order status from purchase to delivery, so buyers know when fresh catch will arrive at the market.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Compliance & Reporting</h4>
                  <p className="text-slate-600">
                    Keep records ready for audits and regulatory inspections with timestamped catch logs and market transaction history.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Fleet Catches */}
      <section id="fleet" className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Live Fleet Catches</h2>
          <button className="bg-slate-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-slate-800">
            🔄 Sync Data
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-slate-900">Vessel Name</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-900">Species</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-900">Quantity (kg)</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-900">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-900">Location</th>
              </tr>
            </thead>
            <tbody>
              {liveFleetData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-6 font-semibold text-slate-900">{row.vessel}</td>
                  <td className="py-4 px-6 text-slate-700">{row.species}</td>
                  <td className="py-4 px-6 text-slate-700">{row.quantity}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        row.status === 'SOLD'
                          ? 'bg-cyan-100 text-cyan-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-700">{row.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-slate-900 to-cyan-900 py-20">
        <div className="max-w-3xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Bring Your Catch to Market?</h2>
          <p className="text-lg text-gray-300 mb-8">
            Start managing catches, buyer offers, and deliveries through one maritime marketplace built for commercial crews and seafood buyers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-slate-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              Register Your Crew
            </button>
            <button
              onClick={() => navigate('/market')}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10"
            >
              Browse Fresh Catch
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">MarisSync</h4>
              <p className="text-sm">Market access and catch tracking for sustainable fishing operations.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#stats" className="hover:text-white">Performance</a></li>
                <li><a href="#fleet" className="hover:text-white">Live Fleet</a></li>
                <li><a href="/market" className="hover:text-white">Market</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Press</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 text-center text-sm">
            <p>© 2026 MarisSync Maritime Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
