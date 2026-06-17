import { MapPin, Phone, Mail, Globe, Diamond, X, Printer } from 'lucide-react';
import logo from '../../logo.png';

const InvoiceModal = ({ data, onClose }) => {
  // Always render exactly 10 rows to keep the invoice layout perfectly sized
  const rows = [...data.items];
  while (rows.length < 10) {
    rows.push({ isEmpty: true });
  }

  return (
    <div id="invoice-print-wrapper" className="fixed inset-0 z-[9999] bg-stone/90 overflow-y-auto flex flex-col items-center pb-20 print:block print:bg-white print:pb-0">
      {/* Print-specific overrides to hide the rest of the app */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-wrapper, #invoice-print-wrapper * { visibility: visible; }
          #invoice-print-wrapper { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; padding: 0; background-color: white; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      {/* Action Bar (Hidden during print) */}
      <div className="print:hidden w-full max-w-5xl bg-onyx text-white p-4 flex justify-between items-center rounded-b-3xl shadow-lg mb-8 sticky top-0 z-50">
        <h2 className="font-display text-xl text-cream tracking-wide">Invoice Preview</h2>
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="bg-rose px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-rose/90 transition-colors shadow-md">
            <Printer size={18} /> Print / Save as PDF
          </button>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* A5 Landscape Print Area (210mm x 148mm) */}
      <div className="w-[210mm] h-[148mm] bg-white p-[8mm] text-black font-sans box-border shadow-2xl print:shadow-none shrink-0 relative overflow-hidden mx-auto print:mx-0">
        {/* Outer Ornate Border Equivalent */}
        <div className="border-[3px] border-black p-1 h-full box-border relative">
          {/* Decorative Corner Blocks */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-[3px] border-black bg-white"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 border-[3px] border-black bg-white"></div>
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-[3px] border-black bg-white"></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-[3px] border-black bg-white"></div>

          {/* Inner Content Wrapper */}
          <div className="border border-black h-full flex flex-col p-3 box-border">
            {/* Header Section */}
            <div className="flex items-center justify-between pb-2 border-b border-black">
              <div className="flex-1 text-center">
                <img src={logo} alt="Nagneshwari Logo" className="h-24 mx-auto mb-2 object-contain grayscale" />
                <p className="text-[7px] mt-1 font-medium italic text-gray-700">Timeless Elegance. Crafted for Generations.</p>
              </div>
              <div className="flex-1 border-l border-r border-black px-4 flex flex-col gap-1.5 text-[9px]">
                <p className="flex items-start gap-2"><MapPin size={10} className="shrink-0 mt-0.5" /> <span>Giri Complex, Kursi Road,<br />Lucknow - 226022</span></p>
                <p className="flex items-center gap-2"><Phone size={10} className="shrink-0" /> 7007810114</p>
                <p className="flex items-center gap-2"><Mail size={10} className="shrink-0" /> schirgsoni20@gmail.com</p>
                <p className="flex items-center gap-2"><Globe size={10} className="shrink-0" /> www.nagneshwari.in</p>
              </div>
              <div className="flex-[0.8] text-center px-4">
                <h2 className="font-serif text-2xl tracking-widest mb-3 flex justify-center items-center gap-2">
                  <span className="text-xs">◈</span> INVOICE <span className="text-xs">◈</span>
                </h2>
                <div className="text-[10px] text-left space-y-2 font-medium">
                  <div className="flex items-end"><span className="w-16 shrink-0 leading-none">Invoice No.</span> <span className="mr-2 leading-none">:</span> <span className="border-b border-black flex-1 text-center font-bold pb-0.5 leading-none">{data.invoiceNo}</span></div>
                  <div className="flex items-end"><span className="w-16 shrink-0 leading-none">Date</span> <span className="mr-2 leading-none">:</span> <span className="border-b border-black flex-1 text-center pb-0.5 leading-none">{data.date}</span></div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="flex gap-4 py-1.5 text-[10px] font-medium">
              <div className="flex-[1.2] space-y-2">
                <div className="flex items-end"><span className="w-24 shrink-0 leading-none">Customer Name</span> <span className="mr-2 leading-none">:</span> <span className="border-b border-black flex-1 uppercase pb-0.5 leading-none truncate">{data.customerName}</span></div>
                <div className="flex items-end"><span className="w-24 shrink-0 leading-none">Mobile No.</span> <span className="mr-2 leading-none">:</span> <span className="border-b border-black flex-1 pb-0.5 leading-none">{data.mobile}</span></div>
              </div>
              <div className="w-px bg-black shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="flex items-end"><span className="w-16 shrink-0 leading-none">Address</span> <span className="mr-2 leading-none">:</span> <span className="border-b border-black flex-1 uppercase pb-0.5 leading-none truncate">{data.address?.split(',')[0]}</span></div>
                <div className="flex items-end"><span className="w-16 shrink-0 leading-none"></span> <span className="mr-2 leading-none"></span> <span className="border-b border-black flex-1 uppercase pb-0.5 leading-none truncate">{data.address?.split(',').slice(1).join(',')}</span></div>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-left border-collapse border border-black mt-1 text-[9px]">
              <thead>
                <tr className="bg-black text-white text-center">
                  <th className="border border-black py-1 px-1 w-10 font-bold">SR. NO.</th>
                  <th className="border border-black py-1 px-2 text-left font-bold">DESCRIPTION</th>
                  <th className="border border-black py-1 px-1 w-12 font-bold">QTY</th>
                  <th className="border border-black py-1 px-1 w-20 font-bold">PRICE (₹)</th>
                  <th className="border border-black py-1 px-1 w-[22%] font-bold">DISCOUNTED PRICE (₹)</th>
                  <th className="border border-black py-1 px-1 w-20 font-bold">TOTAL (₹)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="text-center h-[14px]">
                    <td className="border-r border-black">{!row.isEmpty ? idx + 1 : ''}</td>
                    <td className="border-r border-black text-left px-2 truncate max-w-[200px]">{!row.isEmpty ? row.product_name : ''}</td>
                    <td className="border-r border-black font-medium">{!row.isEmpty ? row.quantity : ''}</td>
                    <td className="border-r border-black">{!row.isEmpty ? Number(row.price_per_unit).toFixed(2) : ''}</td>
                    <td className="border-r border-black font-medium">{!row.isEmpty ? Number(row.discount_price).toFixed(2) : ''}</td>
                    <td className="font-bold">{!row.isEmpty ? Number(row.total_price).toFixed(2) : ''}</td>
                  </tr>
                ))}
                <tr className="border-t border-black"><td colSpan="6" className="p-0"></td></tr>
              </tbody>
            </table>

            {/* Footer */}
            <div className="flex mt-auto pt-1 items-end">
              <div className="flex-1 text-[8px] font-medium leading-tight">
                <p className="font-bold mb-1 flex items-center gap-1 text-[9px]">◈ TERMS & CONDITIONS ◈</p>
                <ol className="list-decimal pl-3 space-y-0.5">
                  <li>Item priced above 500 are liable to 6months to 1yr of warranty.</li>
                  <li>We are not responsible for any damage after delivery.</li>
                  <li>We do not entertain any warranty claim without bill.</li>
                </ol>
              </div>
              <div className="flex-[0.8] text-center flex flex-col items-center justify-center pt-2">
                <Diamond size={16} className="mb-0.5 text-gray-800" />
                <p className="font-serif text-lg italic leading-none font-medium">Thank You</p>
                <p className="text-[7px] tracking-widest mt-1 font-bold">FOR SHOPPING WITH US</p>
                <div className="text-[6px] tracking-[0.2em] mt-1.5 flex items-center justify-center gap-1 w-full opacity-60">
                  <span className="flex-1 h-[1px] bg-black inline-block"></span> ◈ <span className="flex-1 h-[1px] bg-black inline-block"></span>
                </div>
              </div>
              <div className="flex-1 pl-4 flex flex-col justify-end text-[10px]">
                <div className="space-y-1 w-48 ml-auto font-medium">
                  <div className="flex justify-between"><span>SUBTOTAL</span> <span>: {Number(data.subtotal).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>TOTAL DISCOUNT</span> <span>: {Number(data.totalDiscount).toFixed(2)}</span></div>
                  <div className="flex justify-between border-y border-black p-1 font-bold mt-1.5 bg-gray-100 uppercase"><span>GRAND TOTAL</span> <span>: {Number(data.grandTotal).toFixed(2)}</span></div>
                  {data.paymentMethod && (
                    <div className="flex justify-between border-b border-black p-1 text-[9px]">
                        <span>PAYMENT</span>
                        <span className="font-bold">{data.paymentMethod}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 border-t border-dashed border-gray-500 pt-1 text-center text-[8px] w-48 ml-auto font-bold text-gray-600">AUTHORIZED SIGNATURE</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default InvoiceModal;