const fs = require('fs');

let content = fs.readFileSync('apps/customer-web/src/app/profile/page.tsx', 'utf8');

const oldProfileForm = `<form onSubmit={handleSaveProfile} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
            <div className="relative shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile Avatar"
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-orange-500 shadow-sm"
                />
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-orange-200 bg-orange-100 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black text-orange-600">{initials}</span>
                </div>
              )}
              <label
                htmlFor="customer-avatar-upload"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-orange-600 text-white shadow hover:bg-orange-700 transition"
              >
                <Camera className="h-3 w-3" />
                <input
                  id="customer-avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-2 text-left">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Profile Photo</h3>
                <p className="text-[10px] sm:text-xs text-gray-500">JPG, PNG up to 5MB.</p>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2">
                <label
                  htmlFor="customer-avatar-upload"
                  className="cursor-pointer rounded-xl bg-orange-50 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-orange-700 border border-orange-200 hover:bg-orange-100 transition"
                >
                  Change
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Registered Phone (Verified)</label>
            <input
              type="text"
              disabled
              value={user?.phone || '+919876543210'}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-500 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-2xl bg-orange-600 px-4 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-orange-700 disabled:opacity-50 transition"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </form>`;

const newProfileForm = `<form onSubmit={handleSaveProfile} className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm space-y-5">
          {/* Avatar Upload */}
          <div className="flex items-start sm:items-center gap-3.5 border-b border-gray-100 pb-5">
            <div className="relative shrink-0 mt-0.5 sm:mt-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile Avatar"
                  className="h-[72px] w-[72px] sm:h-20 sm:w-20 rounded-full object-cover border border-orange-200 shadow-sm"
                />
              ) : (
                <div className="h-[72px] w-[72px] sm:h-20 sm:w-20 rounded-full border border-orange-200 bg-orange-50 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black text-orange-600">{initials}</span>
                </div>
              )}
              <label
                htmlFor="customer-avatar-upload"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-orange-600 text-white shadow hover:bg-orange-700 transition"
              >
                <Camera className="h-3 w-3" />
                <input
                  id="customer-avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-col text-left">
              <h3 className="text-sm font-bold text-gray-900 mb-0.5">Profile Photo</h3>
              <p className="text-[10px] sm:text-xs text-gray-500 mb-2.5">JPG, PNG up to 5MB.</p>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="customer-avatar-upload"
                  className="cursor-pointer rounded-xl bg-orange-50 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-orange-700 border border-orange-200 hover:bg-orange-100 transition"
                >
                  Change
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1.5">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-xs sm:text-sm font-semibold text-gray-900 focus:border-orange-500 focus:outline-none h-[48px]"
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-xs sm:text-sm font-semibold text-gray-900 focus:border-orange-500 focus:outline-none h-[48px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-xs sm:text-sm font-semibold text-gray-900 focus:border-orange-500 focus:outline-none h-[48px]"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="block text-[11px] sm:text-xs font-bold text-gray-700">Registered Phone</label>
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 border border-emerald-100">Verified</span>
              </div>
              <input
                type="text"
                disabled
                value={user?.phone || '+919876543210'}
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs sm:text-sm font-semibold text-gray-500 cursor-not-allowed h-[48px]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 text-xs font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50 transition"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>`;

content = content.replace(oldProfileForm, newProfileForm);

fs.writeFileSync('apps/customer-web/src/app/profile/page.tsx', content);
console.log("Replaced Profile Form");
