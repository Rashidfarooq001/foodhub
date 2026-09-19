const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'apps/customer-web/src/app/forgot-password/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="text-center pt-2">[\s\S]*?Back to Sign In[\s\S]*?<\/Link>[\s\S]*?<\/div>[\s\S]*?<\/form>\s*\)[\s\S]*?\) : \(/;
content = content.replace(regex, `<div className="text-center pt-2">
              <Link href="/login" className="text-xs font-bold text-gray-500 hover:text-orange-600">
                Back to Sign In
              </Link>
            </div>
          </form>
        ) : (`);

fs.writeFileSync(file, content);
console.log('Fixed syntax error');
