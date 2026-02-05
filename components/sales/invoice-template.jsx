import React from "react";
import { format } from "date-fns";

export const InvoiceTemplate = ({ sale, customer, admins = [] }) => {
    if (!sale || !customer) return null;

    const date = sale.createdAt?.toDate
        ? sale.createdAt.toDate()
        : new Date(sale.createdAt || Date.now());

    const staffName = admins.find(a => a.id === sale.staffId)?.name || "Authorized Signatory";

    return (
        <div
            id="invoice-template"
            className="w-[794px] h-[1123px] bg-white px-16 pt-16 pb-20 mx-auto text-slate-800 relative bg-white"
            style={{ fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}
        >
            {/* HEADER */}
            <div className="flex justify-between items-start mb-20 px-2">
                <div>
                    <img
                        src="/Foxon Final Logo-01.png"
                        alt="Foxon Career Hub Logo"
                        className="h-28 w-auto object-contain mb-1"
                    />
                    <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#ff5722] pl-1">
                        Crafting Career, Word by Word
                    </div>
                </div>
                <h1 className="text-[52px] font-black tracking-[-0.04em] text-[#2c5282] uppercase mt-4 leading-none pr-2">
                    INVOICE
                </h1>
            </div>

            {/* INFO BOX */}
            <div className="bg-[#f2f2f2] rounded-sm p-10 mb-20 mx-2">
                <div className="grid grid-cols-2 gap-10 mb-8 border-b border-slate-300 pb-8">
                    <div>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">ISSUED TO:</p>
                        <p className="text-[15px] font-semibold text-slate-700 leading-tight mb-0.5">{customer.name}</p>
                        <p className="text-[13px] text-slate-500 font-medium">{customer.mobile}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2.5">
                        <div className="flex justify-end items-baseline gap-10">
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">INVOICE NO:</p>
                            <p className="text-[13px] font-bold text-slate-800 uppercase tracking-widest w-24 text-right">{sale.salesRefId?.[0] || "01234"}</p>
                        </div>
                        <div className="flex justify-end items-baseline gap-10">
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">DATE:</p>
                            <p className="text-[13px] font-bold text-slate-800 uppercase tracking-widest w-24 text-right">{format(date, "dd.MM.yyyy")}</p>
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">ADDRESS :</p>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-[#ff5722]">Foxon Career Hub</p>
                        <p className="text-[13px] font-semibold text-slate-600">Malappuram, Kerala- 676523</p>
                        <p className="text-[13px] font-medium text-slate-600">foxonhub@gmail.com</p>
                        <p className="text-[13px] font-medium text-slate-600">+91 9072 121 714</p>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="mb-14 px-2">
                <div className="grid grid-cols-12 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b-[1.5px] border-slate-400 pb-4 mb-4 px-2">
                    <div className="col-span-6">DESCRIPTION</div>
                    <div className="col-span-2 text-right">RATE</div>
                    <div className="col-span-2 text-right">QTY</div>
                    <div className="col-span-2 text-right pr-2">TOTAL</div>
                </div>

                <div className="space-y-1">
                    {(sale.services || []).map((s, i) => (
                        <div key={i} className="grid grid-cols-12 py-3.5 px-2 text-[13px] text-slate-600 font-medium border-b border-slate-100 last:border-0">
                            <div className="col-span-6">{s.name}</div>
                            <div className="col-span-2 text-right">{s.price}</div>
                            <div className="col-span-2 text-right">1</div>
                            <div className="col-span-2 text-right pr-2 text-slate-800 font-semibold">₹{s.price?.toLocaleString("en-IN")}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SUMMARY */}
            <div className="border-t-[1.5px] border-slate-400 pt-8 px-4 mb-20">
                <div className="flex justify-between items-center mb-10 w-full">
                    <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest">SUBTOTAL</span>
                    <span className="text-[15px] font-black text-slate-900 tabular-nums pr-2">₹{sale.totalAmount?.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-end items-center gap-16">
                    <span className="text-[13px] font-black text-slate-600 uppercase tracking-[0.2em]">TOTAL</span>
                    <span className="text-[32px] font-black text-slate-900 tabular-nums pr-2">₹{sale.totalAmount?.toLocaleString("en-IN")}</span>
                </div>
            </div>

            {/* FOOTER */}
            <div className="absolute bottom-20 right-16 text-right">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">THANK YOU</p>
                <div className="relative inline-block pr-2">
                    <img
                        src="/ciel.png"
                        alt="Seal"
                        className="h-32 w-auto opacity-90"
                    />
                    <p
                        className="text-xl text-slate-700 mt-2 font-semibold tracking-tight"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                        {staffName}
                    </p>
                </div>
            </div>

            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Dancing+Script:wght@400;500;600;700&display=swap');
            `}</style>
        </div>
    );
};
