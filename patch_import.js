const fs = require('fs');
const pagePath = 'apps/customer-web/src/app/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

content = content.replace(
  /import React, \{ useState, useEffect, useMemo \} from 'react';/,
  "import React, { useState, useEffect, useMemo, useCallback } from 'react';"
);

fs.writeFileSync(pagePath, content, 'utf8');
