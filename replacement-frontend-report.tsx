  import { useState } from 'react';
  import { Download, FileText, CheckCircle2 } from 'lucide-react';
  import { getApiBaseUrl } from '@foodhub/config';
  import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';

  export default function HotelReportsPage() {
    const { accessToken } = useHotelAuthStore();
    const [downloading, setDownloading] = useState<string | null>(null);

    const downloadReport = async (format: string) => {
      if (format !== 'CSV') {
        alert('Only CSV format is supported at this time.');
        return;
      }
      setDownloading(format);
      try {
        const res = await fetch(\\/analytics/restaurant/export?type=orders\, {
          headers: accessToken ? { Authorization: \Bearer \\ } : {},
        });
        if (!res.ok) throw new Error('Failed to generate report');
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', \Restaurant_Report_\_\.\\);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      } catch (err) {
        console.error('Download error:', err);
        alert('Could not download report.');
      } finally {
        setDownloading(null);
      }
    };
