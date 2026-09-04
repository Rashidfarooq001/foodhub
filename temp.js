const fs = require('fs');
let c = fs.readFileSync('apps/customer-web/src/components/home/CategoryCarousel.tsx', 'utf8');
c = c.replace(/import React, \{ useState, useEffect, useRef \} from 'react';/, "import React, { useState, useEffect, useRef } from 'react';\nimport Image from 'next/image';");
c = c.replace(/<img[\s\S]*?alt=\{cat\.name\}[\s\S]*?\/>/, '<Image src={cat.image} alt={cat.name} fill sizes="72px" className="rounded-full object-cover" />');
fs.writeFileSync('apps/customer-web/src/components/home/CategoryCarousel.tsx', c);
