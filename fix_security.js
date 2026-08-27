const fs = require('fs');

let content = fs.readFileSync('apps/customer-web/src/app/profile/page.tsx', 'utf8');

const oldSecurityForm = `<form onSubmit={handleChangePassword} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Change Account Password</h2>
            <p className="text-xs text-gray-500">Update your login password credentials</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-2xl bg-orange-600 px-4 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-orange-700 disabled:opacity-50 transition"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Updating Password...' : 'Update Password'}</span>
          </button>
        </form>`;

const newSecurityForm = `<form onSubmit={handleChangePassword} className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Change Password</h2>
            <p className="text-xs text-gray-500">Update your account login credentials</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1.5">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-xs sm:text-sm font-semibold text-gray-900 focus:border-orange-500 focus:outline-none h-[48px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1.5">New Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-xs sm:text-sm font-semibold text-gray-900 focus:border-orange-500 focus:outline-none h-[48px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-xs sm:text-sm font-semibold text-gray-900 focus:border-orange-500 focus:outline-none h-[48px]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 text-xs font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50 transition"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>`;

content = content.replace(oldSecurityForm, newSecurityForm);

fs.writeFileSync('apps/customer-web/src/app/profile/page.tsx', content);
console.log("Replaced Security Form");
