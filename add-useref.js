const fs = require('fs');
const file = 'apps/hotel-dashboard/src/app/orders/page.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect, useRef } from 'react';");
fs.writeFileSync(file, code);
