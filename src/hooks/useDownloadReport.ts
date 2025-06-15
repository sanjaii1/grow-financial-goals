
import { RefObject } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface UseDownloadReportProps {
  reportRef: RefObject<HTMLElement>;
  fileName: string;
}

export const useDownloadReport = ({ reportRef, fileName }: UseDownloadReportProps) => {

  const handleDownloadPdf = () => {
    if (reportRef.current) {
      const scale = 2;
      html2canvas(reportRef.current, { 
        scale,
        useCORS: true,
        backgroundColor: null 
       }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${fileName}.pdf`);
      });
    }
  };

  const handleDownloadJson = (data: any) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `${fileName}.json`;
    link.click();
  };

  return { handleDownloadPdf, handleDownloadJson };
};
