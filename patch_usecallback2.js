const fs = require('fs');
const pagePath = 'apps/customer-web/src/app/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

content = content.replace(
  /setIsError\(true\);\s*\}\s*\}\s*finally\s*\{\s*setIsLoading\(false\);\s*\}\s*\};/,
  `setIsError(true);
        }
      } finally {
        setIsLoading(false);
      }
    }, [userCoords]);`
);

fs.writeFileSync(pagePath, content, 'utf8');
