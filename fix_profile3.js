const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/profile/page.tsx', 'utf8');

// Container padding
code = code.replace(
  /<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-24 md:pb-12 pt-4 md:pt-6 space-y-4 md:space-y-5">/,
  '<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-28 md:pb-12 pt-5 md:pt-6">'
);

// Header spacing
code = code.replace(
  /<div className="space-y-1">\s*<h1 className="text-2xl font-bold text-gray-900">Profile<\/h1>\s*<p className="text-sm text-gray-500">Manage your personal details and password<\/p>\s*<\/div>/,
  `<div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile</h1>
        <p className="text-sm text-gray-500">Manage your personal details and password</p>
      </div>`
);

// Tabs
const oldTabsRegex = /\{\/\* Tabs \*\/\}\s*<div className="grid grid-cols-\[0\.8fr_0\.8fr_1\.2fr\] gap-2">[\s\S]*?<\/div>/;
const newTabs = `{/* Tabs */}
      <div className="grid grid-cols-[0.8fr_0.8fr_1.2fr] gap-2 mb-[18px]">
        <button
          onClick={() => setActiveTab('profile')}
          className={\`flex flex-col items-center justify-center gap-1 sm:gap-2 sm:flex-row rounded-2xl px-1 sm:px-4 text-[11px] sm:text-xs font-bold transition h-[72px] sm:h-12 text-center leading-tight \${
            activeTab === 'profile'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }\`}
        >
          <User className="h-4 w-4 shrink-0" /> <span>Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={\`flex flex-col items-center justify-center gap-1 sm:gap-2 sm:flex-row rounded-2xl px-1 sm:px-4 text-[11px] sm:text-xs font-bold transition h-[72px] sm:h-12 text-center leading-tight \${
            activeTab === 'security'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }\`}
        >
          <KeyRound className="h-4 w-4 shrink-0" /> <span>Security</span>
        </button>
        <Link
          href="/privacy"
          className="flex flex-col items-center justify-center gap-1 sm:gap-2 sm:flex-row rounded-2xl px-1 sm:px-4 text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100 transition h-[72px] sm:h-12 text-center leading-tight"
        >
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" /> <span>Privacy & Data Center</span>
        </Link>
      </div>`;
code = code.replace(oldTabsRegex, newTabs);

// Form Card Padding
code = code.replace(
  /<form onSubmit=\{handleSaveProfile\} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">/,
  '<form onSubmit={handleSaveProfile} className="rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm w-full box-border">'
);
code = code.replace(
  /<form onSubmit=\{handleChangePassword\} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">/,
  '<form onSubmit={handleChangePassword} className="rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm w-full box-border">'
);

// Form Field inputs spacing & heights
// Current: <div className="space-y-5">
code = code.replace(/<div className="space-y-5">/g, '<div className="space-y-[20px]">');
code = code.replace(/className="block text-xs font-bold text-gray-700 mb-1\.5"/g, 'className="block text-xs font-bold text-gray-700 mb-[7px]"');
code = code.replace(/className="w-full h-\[52px\] rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-900/g, 'className="w-full h-[52px] box-border rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-900');
code = code.replace(/className="w-full h-\[52px\] rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-gray-500/g, 'className="w-full h-[52px] box-border rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-gray-500');

// Avatar section
const oldAvatarRegex = /\{\/\* Avatar Upload \*\/\}\s*<div className="flex items-center gap-4 border-b border-gray-100 pb-5">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const newAvatar = `{/* Avatar Upload */}
          <div className="flex items-center gap-4 border-b border-gray-100 pb-[18px] mb-[18px]">
            <div className="relative shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile Avatar"
                  className="h-[76px] w-[76px] rounded-full object-cover border-2 border-orange-500 shadow-sm"
                />
              ) : (
                <div className="h-[76px] w-[76px] rounded-full border-2 border-orange-200 bg-orange-100 flex items-center justify-center">
                  <span className="text-2xl font-black text-orange-600">{initials}</span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 mb-1">Profile Photo</p>
              <p className="text-[11px] text-gray-500 mb-2.5">JPG, PNG up to 5MB</p>
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="customer-avatar-upload"
                  className="cursor-pointer flex items-center justify-center h-[38px] rounded-xl bg-orange-50 px-[14px] text-xs font-bold text-orange-700 hover:bg-orange-100 transition"
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
                    className="flex items-center justify-center h-[38px] rounded-xl border border-gray-200 bg-white px-[14px] text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>`;
code = code.replace(oldAvatarRegex, newAvatar);

fs.writeFileSync('apps/customer-web/src/app/profile/page.tsx', code);
console.log("Updated Profile Space Pass");
