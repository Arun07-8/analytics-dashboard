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
            className="w-[794px] h-[1123px] bg-white px-16 pt-16 pb-20 mx-auto text-slate-800 relative"
            style={{ fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}
        >
            {/* DECORATIVE TOP BORDER */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#ff5722] via-[#ff7043] to-[#ff8a65]"></div>

            {/* HEADER */}
            <div className="flex justify-between items-start mb-16 px-2">
                <div>
                    <img
                        src="/Foxon Final Logo-01.png"
                        alt="Foxon Career Hub Logo"
                        className="h-28 w-auto object-contain mb-2"
                    />
                    <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#ff5722] pl-1">
                        Crafting Career, Word by Word
                    </div>
                </div>
                <div className="text-right">
                    <h1 className="text-[56px] font-black tracking-[-0.04em] text-[#1e3a5f] uppercase leading-none mb-2">
                        INVOICE
                    </h1>
                    <div className="h-1 w-32 bg-gradient-to-r from-[#ff5722] to-[#ff8a65] ml-auto"></div>
                </div>
            </div>

            {/* INFO BOX */}
            <div className="bg-gradient-to-br from-[#f8f9fa] to-[#f1f3f5] rounded-lg p-10 mb-16 mx-2 border border-slate-200 shadow-sm">
                <div className="grid grid-cols-2 gap-12 mb-8 border-b-2 border-[#ff5722]/20 pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-5 bg-[#ff5722] rounded-full"></div>
                            <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.15em]">BILLED TO</p>
                        </div>
                        <p className="text-[17px] font-bold text-slate-800 leading-tight mb-1">{customer.name}</p>
                        <p className="text-[13px] text-slate-600 font-medium">{customer.mobile}</p>
                        {customer.email && (
                            <p className="text-[13px] text-slate-600 font-medium">{customer.email}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center gap-8">
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Invoice No</p>
                                    <p className="text-[15px] font-bold text-[#1e3a5f] tracking-wide">{sale.salesRefId?.[0] || "N/A"}</p>
                                </div>
                                <div className="h-px bg-slate-200"></div>
                                <div className="flex justify-between items-center gap-8">
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Date</p>
                                    <p className="text-[15px] font-bold text-[#1e3a5f]">{format(date, "dd MMM yyyy")}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-5 bg-[#ff5722] rounded-full"></div>
                        <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.15em]">FROM</p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-[15px] font-bold text-[#ff5722]">Foxon Career Hub</p>
                        <p className="text-[13px] font-semibold text-slate-700">Malappuram, Kerala - 676523</p>
                        <p className="text-[13px] font-medium text-slate-600">📧 foxonhub@gmail.com</p>
                        <p className="text-[13px] font-medium text-slate-600">📞 +91 9072 121 714</p>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="mb-16 px-2">
                <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] rounded-t-lg px-4 py-4">
                    <div className="grid grid-cols-12 text-[11px] font-black text-white uppercase tracking-[0.15em]">
                        <div className="col-span-6">DESCRIPTION</div>
                        <div className="col-span-2 text-right">RATE</div>
                        <div className="col-span-2 text-right">QTY</div>
                        <div className="col-span-2 text-right pr-2">AMOUNT</div>
                    </div>
                </div>

                <div className="border border-slate-200 rounded-b-lg overflow-hidden">
                    {(sale.services || []).map((s, i) => (
                        <div
                            key={i}
                            className="grid grid-cols-12 py-4 px-4 text-[14px] border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                        >
                            <div className="col-span-6 font-semibold text-slate-700">{s.name}</div>
                            <div className="col-span-2 text-right text-slate-600 font-medium">₹{s.price?.toLocaleString("en-IN")}</div>
                            <div className="col-span-2 text-right text-slate-600 font-medium">1</div>
                            <div className="col-span-2 text-right pr-2 text-slate-900 font-bold">₹{s.price?.toLocaleString("en-IN")}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SUMMARY */}
            <div className="px-2 mb-20">
                <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-lg p-8 border border-slate-200">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-300">
                        <span className="text-[13px] font-black text-slate-600 uppercase tracking-[0.15em]">Subtotal</span>
                        <span className="text-[18px] font-bold text-slate-900 tabular-nums">₹{sale.totalAmount?.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="bg-gradient-to-r from-[#ff5722] to-[#ff7043] rounded-lg p-6 shadow-md">
                        <div className="flex justify-between items-center">
                            <span className="text-[15px] font-black text-white uppercase tracking-[0.2em]">Total Amount</span>
                            <span className="text-[36px] font-black text-white tabular-nums">₹{sale.totalAmount?.toLocaleString("en-IN")}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="absolute bottom-20 left-16 right-16">
                <div className="flex justify-between items-end">
                    {/* Left side - Thank you message */}
                    <div>
                        <p className="text-[13px] font-black text-[#ff5722] uppercase tracking-[0.2em] mb-2">
                            Thank You For Your Business!
                        </p>
                        <p className="text-[11px] text-slate-600 font-medium">
                            We appreciate your trust in our services
                        </p>
                    </div>

                    {/* Right side - Signature and seal */}
                    <div className="text-right">
                        <div className="relative inline-block">
                            <img
                                src="/ciel.png"
                                alt="Seal"
                                className="h-28 w-auto opacity-90 mb-2"
                            />
                        </div>
                        <div className="border-t-2 border-slate-300 pt-2 mt-2">
                            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                {staffName}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                                Authorized Signature
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM BORDER */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#ff5722] via-[#ff7043] to-[#ff8a65]"></div>

            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            `}</style>
        </div>
    );
};
