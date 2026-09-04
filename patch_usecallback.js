const fs = require('fs');
const pagePath = 'apps/customer-web/src/app/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// Replace standard async function with useCallback
content = content.replace(
  /const fetchRestaurants = async \(coords = userCoords\) => \{/,
  'const fetchRestaurants = useCallback(async (coords = userCoords) => {'
);

// Find where it ends and close the useCallback
// We know it ends with:
//         setIsError(true);
//       } finally {
//         setIsLoading(false);
//       }
//     };
// We need to replace the last }; with }, [userCoords]);
content = content.replace(
  /setIsError\(true\);\s*\}\s*finally\s*\{\s*setIsLoading\(false\);\s*\}\s*\};\s*/,
  `setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }, [userCoords]);
`
);

fs.writeFileSync(pagePath, content, 'utf8');
