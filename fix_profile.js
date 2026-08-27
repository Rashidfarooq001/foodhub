const fs = require('fs');

let content = fs.readFileSync('apps/customer-web/src/app/profile/page.tsx', 'utf8');

// 1. Fix the main container
content = content.replace(
  '<div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8 pb-10">',
  '<div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8 pb-24 md:pb-12">'
);

// 2. Fix header spacing
content = content.replace(
  `        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500">Manage your personal details and password</p>
        </div>`,
  `        <div className="mb-5 sm:mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Profile</h1>
          <p className="text-sm text-gray-500">Manage your personal details and password</p>
        </div>`
);

// 3. Fix tabs
const oldTabs = `        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-100 pb-3">
          <button
            onClick={() => setActiveTab('profile')}
            className={\`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition \${
              activeTab === 'profile'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }\`}
          >
            <User className="h-4 w-4" /> Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={\`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition \${
              activeTab === 'security'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }\`}
          >
            <KeyRound className="h-4 w-4" /> Security
          </button>
          <Link
            href="/privacy"
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100 transition ml-auto"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Privacy &amp; Data Center
          </Link>
        </div>`;

const newTabs = `        {/* Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-2.5 border-b border-gray-100 pb-4 mb-5">
          <button
            onClick={() => setActiveTab('profile')}
            className={\`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition \${
              activeTab === 'profile'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }\`}
          >
            <User className="h-3.5 w-3.5" /> Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={\`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition \${
              activeTab === 'security'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }\`}
          >
            <KeyRound className="h-3.5 w-3.5" /> Security
          </button>
          <Link
            href="/privacy"
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] sm:text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100 transition sm:ml-auto leading-tight text-left"
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> <span className="max-w-[100px] sm:max-w-none">Privacy &amp; Data Center</span>
          </Link>
        </div>`;
content = content.replace(oldTabs, newTabs);

fs.writeFileSync('apps/customer-web/src/app/profile/page.tsx', content);
console.log("Replaced tabs");
