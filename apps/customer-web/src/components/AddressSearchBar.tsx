"use client";

import { useEffect, useState } from 'react';

export default function AddressSearchBar() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; 

  return (
    <div style={{ width: '100%', padding: '20px', backgroundColor: 'yellow' }}>
      <h1 style={{ color: 'red', fontWeight: 'bold' }}>
        IF YOU CAN SEE THIS, THE COMPONENT IS CONNECTED!
      </h1>
    </div>
  );
}