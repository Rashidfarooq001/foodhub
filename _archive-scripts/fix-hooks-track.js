const fs = require('fs');
const path = 'apps/customer-web/src/app/orders/[id]/track/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const hookCode = `  const [timeAgoStr, setTimeAgoStr] = useState('LIVE');
  useEffect(() => {
    const interval = setInterval(() => {
      const diffSec = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000);
      if (diffSec < 10) setTimeAgoStr('LIVE');
      else if (diffSec < 60) setTimeAgoStr(\`Updating location...\`);
      else setTimeAgoStr(\`Last updated \${Math.floor(diffSec/60)} min ago\`);
    }, 5000);
    return () => clearInterval(interval);
  }, [lastUpdate]);`;

// Remove the hook code from its current location
content = content.replace(hookCode, '');

// Insert it right after the first useEffect (or just before if (isLoading))
content = content.replace('if (isLoading) {', hookCode + '\n\n  if (isLoading) {');

fs.writeFileSync(path, content, 'utf8');
