const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/profile/page.tsx', 'utf8');

// Container padding
code = code.replace(
  /<div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8 pb-24 md:pb-12">/,
  '<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-24 md:pb-12 pt-4 md:pt-6 space-y-4 md:space-y-5">'
);

// Header spacing
code = code.replace(
  /<div>\s*<h1 className="text-2xl font-bold text-gray-900">Profile<\/h1>\s*<p className="text-sm text-gray-500">Manage your personal details and password<\/p>\s*<\/div>/,
  `<div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500">Manage your personal details and password</p>
      </div>`
);

// Tabs
const oldTabsRegex = /\{\/\* Tabs \*\/\}\s*<div className="flex gap-2 border-b border-gray-100 pb-3">[\s\S]*?<\/div>/;
const newTabs = `{/* Tabs */}
      <div className="grid grid-cols-[0.8fr_0.8fr_1.2fr] gap-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={\`flex flex-col items-center justify-center gap-1 sm:gap-2 sm:flex-row rounded-xl px-1 sm:px-4 text-[11px] sm:text-xs font-bold transition h-[72px] sm:h-12 text-center leading-tight \${
            activeTab === 'profile'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }\`}
        >
          <User className="h-4 w-4" /> <span>Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={\`flex flex-col items-center justify-center gap-1 sm:gap-2 sm:flex-row rounded-xl px-1 sm:px-4 text-[11px] sm:text-xs font-bold transition h-[72px] sm:h-12 text-center leading-tight \${
            activeTab === 'security'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }\`}
        >
          <KeyRound className="h-4 w-4" /> <span>Security</span>
        </button>
        <Link
          href="/privacy"
          className="flex flex-col items-center justify-center gap-1 sm:gap-2 sm:flex-row rounded-xl px-1 sm:px-4 text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100 transition h-[72px] sm:h-12 text-center leading-tight"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> <span>Privacy & Data Center</span>
        </Link>
      </div>`;
code = code.replace(oldTabsRegex, newTabs);

// Form Card Padding
code = code.replace(
  /<form onSubmit=\{handleSaveProfile\} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">/,
  '<form onSubmit={handleSaveProfile} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">'
);

// Form Field inputs spacing & heights
code = code.replace(/<div className="space-y-4">/g, '<div className="space-y-5">');
code = code.replace(/className="block text-xs font-bold text-gray-700 mb-1"/g, 'className="block text-xs font-bold text-gray-700 mb-1.5"');
code = code.replace(/className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900/g, 'className="w-full h-[52px] rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-900');
code = code.replace(/className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-500/g, 'className="w-full h-[52px] rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-gray-500');

// Avatar section
const oldAvatarRegex = /\{\/\* Avatar Upload \*\/\}\s*<div className="flex items-center gap-4 border-b border-gray-100 pb-4">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const newAvatar = `{/* Avatar Upload */}
          <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
            <div className="relative shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile Avatar"
                  className="h-16 w-16 rounded-full object-cover border-2 border-orange-500 shadow-sm"
                />
              ) : (
                <div className="h-16 w-16 rounded-full border-2 border-orange-200 bg-orange-100 flex items-center justify-center">
                  <span className="text-xl font-black text-orange-600">{initials}</span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Profile Photo</p>
              <p className="text-[11px] text-gray-500 mb-2">JPG, PNG up to 5MB</p>
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="customer-avatar-upload"
                  className="cursor-pointer rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-100 transition"
                >
                  Change
                  <input
                    id="customer-avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>`;
code = code.replace(oldAvatarRegex, newAvatar);

// Also fix Security tab
code = code.replace(
  /<form onSubmit=\{handleChangePassword\} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">/,
  '<form onSubmit={handleChangePassword} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">'
);

fs.writeFileSync('apps/customer-web/src/app/profile/page.tsx', code);
console.log("Updated Profile!");
