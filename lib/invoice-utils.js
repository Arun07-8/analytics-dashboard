import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export const downloadInvoice = async (elementId, filename = 'invoice.pdf') => {
    const element = document.getElementById(elementId);
    if (!element) return false;

    // Ensure images are loaded
    const images = element.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
        });
    });
    await Promise.all(imagePromises);

    try {
        // html-to-image is much more robust with modern CSS (oklch/oklab) 
        // than html2canvas because it uses SVG foreignObject rendering
        const dataUrl = await toPng(element, {
            quality: 1.0,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            style: {
                // Ensure the template is visible during capture
                opacity: '1',
                visibility: 'visible',
                display: 'block',
                position: 'relative',
                left: '0',
                top: '0'
            }
        });

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Add the image to PDF
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(filename);

        return true;
    } catch (error) {
        console.error('Error generating PDF with html-to-image:', error);
        return false;
    }
};
