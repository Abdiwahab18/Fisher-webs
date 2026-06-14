import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-2xl">🌊</span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">FishMarket</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-6">
            <button
              onClick={() => navigate('/market')}
              className="hidden sm:block text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              Market
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-cyan-600 text-white px-4 py-2 sm:px-5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-cyan-700 transition-all hover:shadow-md"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center min-h-[80vh] bg-slate-900 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-cyan-900/80 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1574263867373-55a63925a0df?w=1600&h=900&fit=crop" 
            alt="Commercial fishing boat" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="relative z-20 w-full max-w-4xl mx-auto px-6 py-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-bold tracking-wider uppercase">The Modern Fishery Network</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Maritime Trade & <br className="sm:hidden" /><span className="text-cyan-400">Catch Management</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed">
            Record catch details at sea, connect directly with buyers ashore, and manage orders from launch to landing with complete transparency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
            <button
              onClick={() => navigate('/register')}
              className="bg-cyan-500 text-slate-900 px-8 py-3.5 rounded-xl text-base font-bold shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition-all hover:scale-105"
            >
              Start Trading Today
            </button>
            <button
              onClick={() => navigate('/market')}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-3.5 rounded-xl text-base font-bold hover:bg-white/20 transition-all"
            >
              Explore the Market
            </button>
          </div>
        </div>
      </section>

      {/* Precision Platform Section (Features) */}
      <section className="bg-white dark:bg-slate-950 py-24 relative z-20 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h3 className="text-cyan-600 dark:text-cyan-400 font-bold tracking-wide uppercase text-sm mb-3">How It Works</h3>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Everything you need to streamline operations</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              FishMarket provides purpose-built tools for fishermen, buyers, and dock managers to stay aligned and close deals faster.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center mb-6">
                <span className="text-2xl">🧾</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Digital Catch Log</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Capture species, weight, and location in a single digital record right from the boat for faster processing at the dock.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center mb-6">
                <span className="text-2xl">🛒</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Buyer Marketplace</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Share available catch directly with local buyers and wholesalers, ensuring you secure the best price before you even land.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center mb-6">
                <span className="text-2xl">📈</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Order Tracking</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Track status from purchase to delivery. Buyers always know exactly when their fresh catch will arrive at the market.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center mb-6">
                <span className="text-2xl">✅</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Compliance Ready</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Keep immutable records ready for audits and regulatory inspections with timestamped logs and transaction histories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal CTA Section */}
      <section className="bg-slate-900 dark:bg-slate-950 py-24 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">Ready to join the fleet?</h2>
          <p className="text-slate-400 text-base md:text-lg mb-10 max-w-2xl mx-auto">
            Stop relying on paper logs and phone calls. Streamline your entire commercial fishing operation today.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-cyan-500 text-slate-900 px-8 py-3.5 rounded-xl text-base font-bold hover:bg-cyan-400 transition-all hover:scale-105"
          >
            Create Your Free Account
          </button>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="bg-slate-950 text-slate-500 py-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌊</span>
            <span className="font-bold text-slate-300">FishMarket</span>
          </div>
          <div className="text-sm">
            © {new Date().getFullYear()} FishMarket Maritime Solutions. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
