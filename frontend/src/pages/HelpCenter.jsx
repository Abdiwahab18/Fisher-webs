import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

// ─── Icons ─────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);
const ChevronUpIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
  </svg>
);
const BookIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
const LightbulbIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const StarIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const FishIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 15.536c-1.171 1.952-3.07 1.096-4.242 0 1.172 1.096 3.07 1.952 4.242 0zM17 10c0 3.866-3.582 7-8 7s-8-3.134-8-7 3.582-7 8-7 8 3.134 8 7z" />
  </svg>
);
const ShoppingCartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const TruckIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM21 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" />
  </svg>
);
const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);
const PlayIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

// ─── Data ───────────────────────────────────────────────────────────────────

const roleGuides = {
  fisherman: {
    label: 'Fisherman',
    color: 'from-cyan-500 to-blue-600',
    bgLight: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    icon: <FishIcon />,
    steps: [
      {
        step: 1,
        title: 'Diiwaangelinta & Gasho (Sign Up & Login)',
        desc: 'Aad bogga hore ugu tag, taabo "Get Started", xulana doorasho "Fisherman". Buuxi magacaaga, emailkaaga, iyo passwordkaaga. Marka aad dhamaystirto, waxaad heli kartaa xisaabkaaga si aad ugu gasho.',
        icon: '🔑',
      },
      {
        step: 2,
        title: 'Diiwaangeli Qabashada Kalluunka (Record Your Catch)',
        desc: 'Ka dib marka aad gasho, aad "Catches" oo ku jira sidebar-ka. Taabo "Add Catch", gali nooca kalluunka, miisaankiisa (kg), qiimaha, iyo xaaladda. Tani waxay ogeysiin doontaa customers-ka in ay heli karaan.',
        icon: '🐟',
      },
      {
        step: 3,
        title: 'Maamul Darawalada (Manage Drivers)',
        desc: 'Aad "Drivers" qeybta si aad u aragto darawalada ka shaqeeya. Waxaad abuuri kartaa delivery driver cusub, ama ku xidhi kalluunka driver gaar ah si loo gaar geysiyo.',
        icon: '🚚',
      },
      {
        step: 4,
        title: 'La soco Dalabka (Track Orders)',
        desc: 'Aad "Orders" oo ku jira sidebar. Halkaas waxaad arki doontaa dalbadaha cusub, kuwa socda, iyo kuwa la dhameeyay. Waxaad xaqiijin kartaa qabasho ama ka diidin kartaa.',
        icon: '📦',
      },
      {
        step: 5,
        title: 'Dashboard & Warbixinnada (Reports)',
        desc: 'Dashboard-ku wuxuu kuu tusi doonaa graphs-ka dakhliga, tirada qabashooyinka, iyo dalbadaha. Waxaad xulato "Week", "Month" si aad u aragto xaaladda jirta.',
        icon: '📊',
      },
    ],
  },
  customer: {
    label: 'Customer',
    color: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: <ShoppingCartIcon />,
    steps: [
      {
        step: 1,
        title: 'Samee Xisaab (Create Account)',
        desc: 'Aad bogga hore, taabo "Get Started", xulana "Customer". Buuxi xogta kuu baahan, markaasna waxaad heli doontaa email xaqiijin. Gal login kadib si aad ugu hesho dhamaan features-ka.',
        icon: '👤',
      },
      {
        step: 2,
        title: 'Suuqa Baadh (Browse the Market)',
        desc: 'Taabo "Market" oo ku jira sidebar. Waxaad arki doontaa dhammaan kalluunka la heli karo. Waxaad filter gaari kartaa nooca, qiimaha, ama xaaladda. Kalluun walba waxaad arki kartaa xogtiisa oo dhamays tiran.',
        icon: '🛒',
      },
      {
        step: 3,
        title: 'Ku Dar Basket-ka & Dalbo (Add to Cart & Order)',
        desc: 'Marka aad hesho kalluunka aad rabto, taabo "Add to Cart". Waxaad bedeli kartaa tirada, markaasna aad "Checkout". Xaqiiji xogta delivery-da, taabona "Place Order".',
        icon: '✅',
      },
      {
        step: 4,
        title: 'La soco Dalabkaaga (Track Your Order)',
        desc: 'Aad "Orders" oo ku jira sidebar. Waxaad arki doontaa status-ka dalabkaaga: Pending, Confirmed, Out for Delivery, Delivered. Waxaad heli doontaa notification marka xaaladdu beddesho.',
        icon: '📍',
      },
      {
        step: 5,
        title: 'Ku Xidh Xirfadlaha (Favorite Fishermen)',
        desc: 'Market-ka, taabo astaanta ❤️ agagaarka kalluunka aad jeceshahay si aad ugu darsato liiska favorites-kaaga. Tani kaa caawinaysaa inaad si dhakhso ah u hesho kalluunka aad jeclahay mar labaad.',
        icon: '❤️',
      },
    ],
  },
  driver: {
    label: 'Delivery Driver',
    color: 'from-orange-500 to-amber-600',
    bgLight: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: <TruckIcon />,
    steps: [
      {
        step: 1,
        title: 'Gasho Driver Dashboard-ka',
        desc: 'Marka aad login gasho, waxaad si toos ah ugu tagi doontaa Driver Dashboard-ka. Halkaas waxaad arki doontaa dhamaan dalbadaha kuu xilsaaran ee delivery-da.',
        icon: '🚗',
      },
      {
        step: 2,
        title: 'Dalbadaha La Qaatay (Assigned Deliveries)',
        desc: 'Dalbadaha kuu xilsaaran waxay ka muuqdaan dashboard-kaaga. Waxaad arki kartaa cinwaanka delivery-da, magaca customer-ka, iyo tirada kalluunka.',
        icon: '📋',
      },
      {
        step: 3,
        title: 'Xaaladda Ku Cusboonsii (Update Delivery Status)',
        desc: 'Marka aad qaadato qabasho, ku dhufo "Out for Delivery". Marka aad gaarsiiso customer-ka, taabo "Delivered" si loo dhameeyo dalabka. Tani waxay ogeysiin doontaa fisherman-ka iyo customer-ka labadaba.',
        icon: '✔️',
      },
      {
        step: 4,
        title: 'Macluumaadka Xiriirka (Contact Info)',
        desc: 'Haddaad u baahato inaad la xirirto customer-ka ama fisherman-ka, waxaad ka heli kartaa xogta xiriirkooda dalabka kujira. Si amuud leh uga soo geli.',
        icon: '📞',
      },
    ],
  },
  admin: {
    label: 'Admin',
    color: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800',
    icon: <ShieldIcon />,
    steps: [
      {
        step: 1,
        title: 'Admin Panel-ka Fur',
        desc: 'Login kadib, waxaad si toos ah ugu tagi doontaa Admin Panel-ka. Halkaas waxaad maamuli kartaa dhammaan users-ka, catches-ka, orders-ka, iyo payments-ka.',
        icon: '⚙️',
      },
      {
        step: 2,
        title: 'Users Maamul (Manage Users)',
        desc: 'Admin Panel > Users. Waxaad arki kartaa dhammaan users-ka, xalin kartaa accounts-ka, ama delete gaari kartaa user gaar ah. Waxaad sidoo kale role-ka user bedeli kartaa.',
        icon: '👥',
      },
      {
        step: 3,
        title: 'Suuqa Xukum (Market Control)',
        desc: 'Admin Panel waxaa laga heli karaa qaybta Catches. Waxaad maamuli kartaa dhammaan kalluunka suuqa. Haddii kalluun ay ku jiraan xaalad xun, waxaad ka saari kartaa.',
        icon: '🏪',
      },
      {
        step: 4,
        title: 'Warbixinnada & Analytics',
        desc: 'Dashboard-ka Admin wuxuu kuu tusi doonaa xogta guud: dakhliga guud, tirada users-ka, orders-ka ugu badan, iyo falcelinta nidaamka.',
        icon: '📈',
      },
      {
        step: 5,
        title: 'Xog Xiriirka Dejinta (Settings)',
        desc: 'Settings > Admin. Halkaas waxaad gelisa xogta xiriirkaaga (phone, WhatsApp, Facebook) si users-ku kuu heli karaan support marka ay u baahan yihiin.',
        icon: '📱',
      },
    ],
  },
};

const faqData = [
  {
    category: 'Xisaab & Login',
    icon: '🔑',
    questions: [
      {
        q: 'Sideen uga gasho nidaamka?',
        a: 'Aad bogga hore (Home), taabo "Login" ama "Get Started". Haddaad xisaab haysato, geli emailkaaga iyo passwordkaaga. Haddaadan lahayn, taabo "Register" si aad u sameyso mid cusub.',
      },
      {
        q: 'Waan ilowday passwordkayga. Maxaan samayn karaa?',
        a: 'Hadda waxaad la xiriiri kartaa admin-ka si uu kuu cusboonsiiyo passwordkaaga. Aad "Contact Support" oo ku jira sidebar si aad xogta admin-ka u hesho.',
      },
      {
        q: 'Ma beddeli karaa emailkayga ama magacayga?',
        a: 'Haa. Aad Settings > Profile. Halkaas waxaad beddeli kartaa magacaaga, emailkaaga, telefoonkaaga, iyo xogta kale ee profile-kaaga. Taabo "Save Changes" markaad dhameysto.',
      },
      {
        q: 'Sideen u beddelaa muuqaalka profile-kayga?',
        a: 'Settings > Profile, halkaas waxaad arki doontaa option "Upload Photo". Dooro sawir kugu haboon, oo leh xajmi kadi ka yar 2MB.',
      },
    ],
  },
  {
    category: 'Suuqa & Iibsiga',
    icon: '🛒',
    questions: [
      {
        q: 'Sideen u ogaan karaa kalluunka la heli karo?',
        a: 'Aad "Market" oo ku jira sidebar. Kalluun kasta wuxuu tusi doonaa nooca, miisaanka, qiimaha, iyo magaca fisherman-ka. Waxaad sidoo kale filter gaari kartaa si aad u hesho nooca aad rabto.',
      },
      {
        q: 'Ma gaari karaa badeecada si bilaash ah?',
        a: 'Qiimaha delivery-da waxay kuxiran tahay aagga iyo heshiisyada fisherman-ka. Waxaad ku arki doontaa qiimaha inta aadan dalbanayn.',
      },
      {
        q: 'Muxuu yahay farqiga u dhaxeeya "Pending" iyo "Confirmed"?',
        a: 'Pending waxay ka dhigan tahay dalabkaagu waa la dirtay laakiin fisherman-ku weli xaqiijin. Confirmed waxay ka dhigan tahay fisherman-ka wuu ansixiyay dalabkaaga oo delivery waa lasoo bilaabaa.',
      },
      {
        q: 'Ma bedeli karaa ama baajin karaa dalabkaygii?',
        a: 'Waxaad baajin kartaa dalabka hadduu wali "Pending" yahay. Marka uu noqdo "Confirmed", waxaad u baahantahay inaad la xirirto fisherman-ka ama admin-ka si aad u baajiso.',
      },
    ],
  },
  {
    category: 'Delivery & Dalabka',
    icon: '🚚',
    questions: [
      {
        q: 'Immisa muddo ayay qaadataa delivery-du?',
        a: 'Waxay kuxiran tahay aagga. Guud ahaan, marka dalabku noqdo "Confirmed", fisherman-ku wuxuu soo diri doonaa driver si uu kuu soo geliyo. Waxaad la socotaa status-ka dalabkaaga.',
      },
      {
        q: 'Sideen u ogaan karaa driver-ku meeye jiro?',
        a: 'Notifications-ka waxaad ku heli doontaa updates-ka. Status-ka "Out for Delivery" waxay ka dhigan tahay driver-ku wuu socda. Kala xiriir admin-ka haddaad dhibaato la kulanto.',
      },
      {
        q: 'Maxaan samayn karaa haddaan dalabkayga heli?',
        a: 'Marka hore hubi status-ka "Orders" qeybta. Haddii uu leeyahay "Delivered" laakiin aadan helin, si deg deg ah ula xiriir admin-ka ama fisherman-ka adigoo isticmaalaya "Contact Support".',
      },
    ],
  },
  {
    category: 'Lacag & Lacag Celinta',
    icon: '💳',
    questions: [
      {
        q: 'Sida lacagta loo bixiyaa?',
        a: 'Lacagta waxaa lagu bixiyaa hadhow halka delivery la sameeyo ama heshiis lala gaaro fisherman-ka. Details-ka lacagta waxaad ka arki doontaa Checkout page-ka.',
      },
      {
        q: 'Maxaan samayn karaa haddaan lacag celinta dono?',
        a: 'La xiriir admin-ka ama fisherman-ka haddaad rabto lacag celinta. Tani waxay kuxiran tahay xaaladda dalabka iyo heshiisyada nidaamka.',
      },
    ],
  },
];

const tipsData = {
  fisherman: [
    { icon: '⏰', tip: 'Geli qabashooyinkaaga marka ay xasil yihiin si customers-ku u arki karaan.', label: 'Wakhtiga' },
    { icon: '💰', tip: 'Qiimo joogto ah oo macquul ah ayaa dalabyo badan soo jiita. Hubi inaadan si adag u qiimayn.', label: 'Qiimaha' },
    { icon: '📸', tip: 'Ku dar sawirro clear ah kalluunkaaga si aad u kordhiso iibka.', label: 'Sawirro' },
    { icon: '🔔', tip: 'U daa notifications-ka si aad u aragto dalabada deg deg ah.', label: 'Ogeysiisyo' },
    { icon: '📊', tip: 'Dul soco Dashboard-kaaga si aad u aragto xilliga ugu badan ee iibka.', label: 'Dashboard' },
    { icon: '🤝', tip: 'Driver kaaga ku wareejin si si amuud leh loo gaysiyo dalabada.', label: 'Darawalada' },
  ],
  customer: [
    { icon: '❤️', tip: 'Ku dar fishermen-ka aad jeceshahay "Favorites" si aad u ogaato marka ay kalluun cusub geliyaan.', label: 'Favorites' },
    { icon: '🔍', tip: 'Isticmaal filter-yada Market-ka si aad u hesho nooca kalluunka aad rabto.', label: 'Raadinta' },
    { icon: '🕐', tip: 'Dalabka da hore si aad u hubiso helitaanka, gaar ahaan kalluunka caanka ah.', label: 'Degdegaha' },
    { icon: '📱', tip: 'Hubi notifications-kaaga si aad wakhtigeeda la soco xaaladda dalabkaaga.', label: 'Ogeysiisyo' },
    { icon: '💬', tip: 'Haddaad dhibaato la kulanto, isticmaal "Contact Support" si aad u heshid admin-ka.', label: 'Caawinta' },
    { icon: '⭐', tip: 'Dib u eeg kalluunkaada aad iibsatay - tani ka caawisaa fishermen-ka inay wanaajiyaan adeegga.', label: 'Xushmadda' },
  ],
  driver: [
    { icon: '📱', tip: 'Hubi notifications-kaaga mar walba si aad u ogaato dalabada cusub ee kuu xilsaaran.', label: 'Ogeysiisyo' },
    { icon: '🗺️', tip: 'Xaqiiji cinwaanka customer-ka inta aadan kicin si aad u badbaadasho waqti.', label: 'Cinwaan' },
    { icon: '⚡', tip: 'Cusboonsii status-ka "Out for Delivery" marka aad qaadato si customer-ka loo ogeysiiyo.', label: 'Status' },
    { icon: '📞', tip: 'Xiriir customer-ka haddaad meel ka waantagto si dhibaato loo wareejiyo.', label: 'Xiriirka' },
  ],
  admin: [
    { icon: '👁️', tip: 'Dul soco Activity Log-ga si aad ugu ogaato wax kasta oo ku dhacaa nidaamka.', label: 'La socodka' },
    { icon: '⚙️', tip: 'Cusboonsii xogta xiriirkaaga Settings-ka si users-ku kuu heli karaan.', label: 'Xogta' },
    { icon: '🔔', tip: 'Jawaab dalabada la qabto si degdeg ah si nidaamku u shaqeeyo si fiican.', label: 'Degdegaha' },
    { icon: '📊', tip: 'Eeg Dashboard-ka maalin walba si aad u aragto xaaladda guud ee ganacsiga.', label: 'Dashboard' },
  ],
};

const quickActions = {
  fisherman: [
    { label: 'Ku dar Qabasho', path: '/fisherman', color: 'bg-cyan-500 hover:bg-cyan-600', icon: '🐟' },
    { label: 'Darawalada', path: '/fisherman/drivers', color: 'bg-blue-500 hover:bg-blue-600', icon: '🚚' },
    { label: 'Dalabada', path: '/orders', color: 'bg-indigo-500 hover:bg-indigo-600', icon: '📦' },
    { label: 'Dashboard', path: '/dashboard', color: 'bg-violet-500 hover:bg-violet-600', icon: '📊' },
  ],
  customer: [
    { label: 'Suuqa', path: '/market', color: 'bg-emerald-500 hover:bg-emerald-600', icon: '🛒' },
    { label: 'Dalabadayda', path: '/orders', color: 'bg-teal-500 hover:bg-teal-600', icon: '📦' },
    { label: 'Dashboard', path: '/dashboard', color: 'bg-cyan-500 hover:bg-cyan-600', icon: '📊' },
    { label: 'Settings', path: '/settings', color: 'bg-slate-500 hover:bg-slate-600', icon: '⚙️' },
  ],
  driver: [
    { label: 'Dalabadayda', path: '/dashboard', color: 'bg-orange-500 hover:bg-orange-600', icon: '🚗' },
    { label: 'Settings', path: '/settings', color: 'bg-slate-500 hover:bg-slate-600', icon: '⚙️' },
  ],
  admin: [
    { label: 'Admin Panel', path: '/admin', color: 'bg-violet-500 hover:bg-violet-600', icon: '⚙️' },
    { label: 'Dalabada', path: '/orders', color: 'bg-blue-500 hover:bg-blue-600', icon: '📦' },
    { label: 'Dashboard', path: '/dashboard', color: 'bg-cyan-500 hover:bg-cyan-600', icon: '📊' },
    { label: 'Settings', path: '/settings', color: 'bg-slate-500 hover:bg-slate-600', icon: '🔧' },
  ],
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-300 ${
        open
          ? 'border-cyan-300 dark:border-cyan-700 shadow-sm shadow-cyan-500/10'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        id={`faq-${q.slice(0, 20).replace(/\s/g, '-')}`}
      >
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{q}</span>
        <span className={`mt-0.5 shrink-0 transition-colors ${open ? 'text-cyan-500' : 'text-slate-400'}`}>
          {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-700/50">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

function StepCard({ step, title, desc, icon, color }) {
  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0`}
        >
          {step}
        </div>
        <div className="w-px flex-1 bg-gradient-to-b from-slate-300 to-transparent dark:from-slate-700 min-h-[24px]" />
      </div>
      <div className="pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{icon}</span>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h4>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

function HelpCenter() {
  const userRole = localStorage.getItem('fisher_role') || 'customer';
  const [activeSection, setActiveSection] = useState('guide');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFAQ, setFilteredFAQ] = useState(faqData);
  const [selectedRole, setSelectedRole] = useState(userRole);
  const [expandedCategories, setExpandedCategories] = useState({});

  const guide = roleGuides[selectedRole] || roleGuides.customer;
  const tips = tipsData[selectedRole] || tipsData.customer;
  const actions = quickActions[selectedRole] || quickActions.customer;

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFAQ(faqData);
      return;
    }
    const q = searchQuery.toLowerCase();
    const result = faqData
      .map((cat) => ({
        ...cat,
        questions: cat.questions.filter(
          (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.questions.length > 0);
    setFilteredFAQ(result);
  }, [searchQuery]);

  const navItems = [
    { key: 'guide', label: 'Hagaha Isticmaalka', icon: <BookIcon /> },
    { key: 'tips', label: 'Talooyin', icon: <LightbulbIcon /> },
    { key: 'faq', label: 'Su\'aalaha Badan', icon: <SearchIcon /> },
  ];

  const roleOptions = [
    { key: 'fisherman', label: '🐟 Kalluumaysato' },
    { key: 'customer', label: '🛒 Macmiil' },
    { key: 'driver', label: '🚚 Darawal' },
    { key: 'admin', label: '⚙️ Admin' },
  ];

  return (
    <Layout activePage="help">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-8 shadow-2xl">
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, #06b6d4 0%, transparent 50%), radial-gradient(circle at 80% 20%, #3b82f6 0%, transparent 50%)`
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                <BookIcon />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white">Xarunta Caawinta</h1>
                <p className="text-cyan-300 text-sm font-medium">Help Center & Recommendations</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              Halkan waxaad ka heli doontaa tilmaamaha, talooyin, iyo jawaabaha su'aalaha badan ee ku saabsan FishMarket. 
              Dooro noocaaga si aad u hesho macluumaadka kugu habboon.
            </p>

            {/* Role Selector */}
            <div className="mt-6 flex flex-wrap gap-2">
              {roleOptions.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setSelectedRole(r.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                    selectedRole === r.key
                      ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/30 scale-105'
                      : 'bg-white/10 text-slate-300 border-white/20 hover:bg-white/20'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Shortcut Degdeg ah</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {actions.map((action) => (
              <a
                key={action.label}
                href={action.path}
                className={`${action.color} text-white rounded-2xl px-4 py-3 text-center text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex flex-col items-center gap-1`}
              >
                <span className="text-xl">{action.icon}</span>
                <span>{action.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ── Nav Tabs ── */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              id={`help-tab-${item.key}`}
              onClick={() => setActiveSection(item.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeSection === item.key
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <span className={activeSection === item.key ? 'text-cyan-500' : 'text-slate-400'}>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>

        {/* ── Section: Guide ── */}
        {activeSection === 'guide' && (
          <div className={`rounded-3xl border ${guide.border} ${guide.bgLight} p-6 shadow-sm`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${guide.color} flex items-center justify-center text-white shadow-md`}>
                {guide.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Hagaha {guide.label}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tallaabooyin si hawl walba loo fuliyo
                </p>
              </div>
            </div>
            <div className="space-y-0">
              {guide.steps.map((s, i) => (
                <StepCard key={i} {...s} color={guide.color} />
              ))}
            </div>
            <div className={`mt-4 p-4 rounded-2xl bg-gradient-to-r ${guide.color} bg-opacity-10`}>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <CheckCircleIcon />
              
              </div>
            </div>
          </div>
        )}

        {/* ── Section: Tips ── */}
        {activeSection === 'tips' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1 mb-2">
              <div className="text-amber-500">
                <LightbulbIcon />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Talooyin Muhiim ah - {guide.label}
                </h2>
                <p className="text-xs text-slate-500">
                  Sidaad ugu fiicaan uga faa'idaysatid FishMarket
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-5 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform duration-200">
                      {tip.icon}
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-cyan-500 dark:text-cyan-400 mb-1">
                        {tip.label}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {tip.tip}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Rating/Recommendation banner */}
            <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5 text-amber-400">
                  {[1,2,3,4,5].map(i => <StarIcon key={i} />)}
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Taalo kula Wadaag
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Haddaad talo ama su'aal qabto oo website-ka ku saabsan, nala soo xiriir admin-ka adiga oo isticmaalaya 
                "Contact Support" oo ku jira sidebar-ka.
              </p>
            </div>
          </div>
        )}

        {/* ── Section: FAQ ── */}
        {activeSection === 'faq' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <SearchIcon />
              </div>
              <input
                id="faq-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Raadi su'aal..."
                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 dark:focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 transition-all"
              />
            </div>

            {filteredFAQ.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm font-medium">Su'aal la mid ah lama helin.</p>
                <p className="text-xs mt-1">Isku day erayo kale, ama nala soo xiriir.</p>
              </div>
            ) : (
              filteredFAQ.map((cat, ci) => (
                <div key={ci}>
                  <button
                    onClick={() =>
                      setExpandedCategories((prev) => ({
                        ...prev,
                        [ci]: !prev[ci],
                      }))
                    }
                    className="flex items-center gap-2 mb-3 w-full text-left group"
                    id={`faq-cat-${ci}`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
                      {cat.category}
                    </h3>
                    <span className="ml-auto text-slate-400 text-xs">
                      {cat.questions.length} su'aal
                    </span>
                    <span className="text-slate-400">
                      {expandedCategories[ci] === false ? <ChevronDownIcon /> : <ChevronUpIcon />}
                    </span>
                  </button>

                  {expandedCategories[ci] !== false && (
                    <div className="space-y-2 pl-2">
                      {cat.questions.map((item, qi) => (
                        <FAQItem key={qi} {...item} />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Still need help? */}
            <div className="rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-200 dark:border-cyan-800 p-6 text-center">
              <p className="text-2xl mb-2">💬</p>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                Ma heshay jawaabta?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Haddaad wali su'aal qabto, nala soo xiriir si aad u hesho caawimaad.
              </p>
              {userRole === 'customer' || userRole === 'fisherman' || userRole === 'driver' ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Isticmaal <span className="font-bold text-cyan-500">"Contact Support"</span> oo ku jira sidebar-ka si aad xogta admin-ka u hesho.
                </p>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Adigu waxaad Admin tahay. Haddaad rabto inaad maamulid, aad <span className="font-bold text-violet-500">Admin Panel</span>-ka.
                </p>
              )}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

export default HelpCenter;
