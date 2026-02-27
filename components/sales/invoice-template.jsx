import React from "react";
import { format } from "date-fns";

const FIRST_PAGE_MAX_ROWS = 7;
const CONTINUATION_PAGE_MAX_ROWS = 16;

function paginateServices(services) {
    if (services.length <= FIRST_PAGE_MAX_ROWS) return [services];
    const pages = [];
    let remaining = [...services];
    pages.push(remaining.slice(0, FIRST_PAGE_MAX_ROWS));
    remaining = remaining.slice(FIRST_PAGE_MAX_ROWS);
    while (remaining.length > 0) {
        pages.push(remaining.slice(0, CONTINUATION_PAGE_MAX_ROWS));
        remaining = remaining.slice(CONTINUATION_PAGE_MAX_ROWS);
    }
    return pages;
}

function PageNumber({ current, total }) {
    return (
        <div className="absolute bottom-6 left-0 right-0 text-center">
            <span className="text-[10px] font-medium text-slate-300 tracking-widest uppercase">
                Page {current} of {total}
            </span>
        </div>
    );
}

function StatusBadge({ paidAmount, totalAmount }) {
    const isPaid = Number(paidAmount) >= Number(totalAmount);
    const isPartial = Number(paidAmount) > 0 && Number(paidAmount) < Number(totalAmount);

    if (isPaid) {
        return (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Paid in Full
            </span>
        );
    }
    if (isPartial) {
        return (
            <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                Partial Payment
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            Unpaid
        </span>
    );
}

function TableHeader() {
    return (
        <div className="bg-[#1e3a5f] px-6 py-3.5 rounded-t-lg">
            <div className="grid grid-cols-12 text-[10px] font-black text-white/90 uppercase tracking-[0.18em]">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Amount</div>
            </div>
        </div>
    );
}

function TableBody({ services, startIndex, totalAmount, paidAmount, isLastPage }) {
    const isPartial = isLastPage && Number(paidAmount) > 0 && Number(paidAmount) < Number(totalAmount);
    const balanceDue = Number(totalAmount) - Number(paidAmount);

    return (
        <div className="border border-t-0 border-slate-200 rounded-b-lg overflow-hidden">
            {services.map((s, i) => (
                <div
                    key={i}
                    className={`grid grid-cols-12 py-3.5 px-6 text-[13px] border-b border-slate-100 last:border-0 items-center ${i % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}`}
                >
                    <div className="col-span-1 text-slate-400 font-semibold">{startIndex + i + 1}</div>
                    <div className="col-span-5 text-slate-700 font-semibold">{s.name}</div>
                    <div className="col-span-2 text-right text-slate-500 font-medium tabular-nums">
                        ₹{s.price?.toLocaleString("en-IN")}
                    </div>
                    <div className="col-span-2 text-center text-slate-500 font-medium">1</div>
                    <div className="col-span-2 text-right text-slate-900 font-bold tabular-nums">
                        ₹{s.price?.toLocaleString("en-IN")}
                    </div>
                </div>
            ))}

            {isLastPage && (
                <div className="border-t-2 border-slate-200">
                    {/* Total */}
                    <div className="flex justify-between items-center px-6 py-4 bg-slate-50">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">Total Amount</span>
                        <span className="text-[22px] font-black text-[#1e3a5f] tabular-nums">
                            ₹{Number(totalAmount)?.toLocaleString("en-IN")}
                        </span>
                    </div>

                    {isPartial && (
                        <>
                            <div className="flex justify-between items-center px-6 py-3 bg-emerald-50 border-t border-emerald-100">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                    <span className="text-[11px] font-black text-emerald-700 uppercase tracking-[0.15em]">Advance Paid</span>
                                </div>
                                <span className="text-[17px] font-black text-emerald-600 tabular-nums">
                                    ₹{Number(paidAmount)?.toLocaleString("en-IN")}
                                </span>
                            </div>
                            <div className="flex justify-between items-center px-6 py-4 bg-orange-50 border-t border-orange-200">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                                    <span className="text-[12px] font-black text-orange-700 uppercase tracking-[0.18em]">Balance Due</span>
                                </div>
                                <span className="text-[20px] font-black text-orange-600 tabular-nums">
                                    ₹{balanceDue?.toLocaleString("en-IN")}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function ContinuationHeader({ invoiceNo, pageNum }) {
    return (
        <div className="flex justify-between items-center mb-8 pb-5 border-b border-slate-100">
            <img
                src="/Foxon Final Logo-01.png"
                alt="Foxon Career Hub Logo"
                className="h-28 w-auto object-contain -mt-6"
            />
            <div className="text-right">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Invoice <span className="text-[#1e3a5f] font-black">{invoiceNo}</span> · Continued
                </p>
                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Page {pageNum}</p>
            </div>
        </div>
    );
}

function InvoiceFooter({ staffName }) {
    return (
        <div className="mt-auto">
            <div className="h-px bg-slate-100 mb-8" />

            {/* Terms + Signature row */}
            <div className="flex justify-between items-end mb-8">
                {/* Payment Terms */}
                <div className="max-w-[260px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Payment Terms</p>
                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed mb-2">
                        Payment is due upon receipt. Please retain this invoice for your records.
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                        foxonhub@gmail.com · +91 9072 121 714
                    </p>
                </div>

                {/* Seal + Signature */}
                <div className="flex flex-col items-center">
                    <img
                        src="/ciel.png"
                        alt="Company Seal"
                        className="h-[88px] w-[88px] object-contain opacity-90 mb-3"
                    />
                    <div className="border-t-2 border-slate-300 pt-2.5 min-w-[190px] text-center">
                        <p className="text-[13px] font-black text-slate-800 uppercase tracking-wide mb-0.5">
                            {staffName}
                        </p>
                        <p className="text-[10px] font-black text-[#ff5722] uppercase tracking-[0.18em]">
                            Authorized Signature
                        </p>
                    </div>
                </div>
            </div>

            {/* Thank You Banner */}
            <div className="bg-[#1e3a5f] rounded-xl px-8 py-5 text-center">
                <p className="text-[13px] font-black text-white uppercase tracking-[0.25em] mb-1">
                    Thank You For Your Business!
                </p>
                <p className="text-[11px] text-white/50 font-medium tracking-wide">
                    We appreciate your trust in Foxon Career Hub
                </p>
            </div>
        </div>
    );
}

/* ─── Main Invoice Template ─── */

export const InvoiceTemplate = ({ sale, customer, admins = [] }) => {
    if (!sale || !customer) return null;

    const date =
        sale.createdAt &&
            typeof sale.createdAt === "object" &&
            "toDate" in sale.createdAt &&
            sale.createdAt.toDate
            ? sale.createdAt.toDate()
            : new Date(sale.createdAt || Date.now());

    const staffName =
        admins.find((a) => a.id === sale.staffId)?.name ||
        admins.find((a) => a.id === sale.createdBy)?.name ||
        sale.staffName ||
        "Authorized Signatory";

    const services = sale.services || [];
    const pages = paginateServices(services);
    const totalPages = pages.length;
    const invoiceNo = sale.salesRefId?.[0] || "N/A";

    return (
        <div id="invoice-template">
            {pages.map((pageServices, pageIndex) => {
                const isFirstPage = pageIndex === 0;
                const isLastPage = pageIndex === totalPages - 1;

                let startIndex = 0;
                for (let i = 0; i < pageIndex; i++) startIndex += pages[i].length;

                return (
                    <div
                        key={pageIndex}
                        className="w-[794px] bg-white px-14 pt-14 pb-20 mx-auto text-slate-800 relative flex flex-col"
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            boxSizing: "border-box",
                            minHeight: "1123px",
                            pageBreakAfter: isLastPage ? "auto" : "always",
                        }}
                    >
                        {/* Top accent */}
                        <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-[#1e3a5f] to-[#ff5722]" />

                        {isFirstPage ? (
                            <>
                                {/* HEADER */}
                                <div className="flex justify-between items-center mb-6 -mt-14">
                                    <img
                                        src="/Foxon Final Logo-01.png"
                                        alt="Foxon Career Hub Logo"
                                        className="h-80 w-auto object-contain -ml-14"
                                    />
                                    <div className="text-right">
                                        <h1 className="text-[50px] font-black text-[#1e3a5f] tracking-[-0.04em] leading-none uppercase mb-2">
                                            Invoice
                                        </h1>
                                        <div className="h-[3px] w-28 bg-gradient-to-r from-[#ff5722] to-[#ff8a65] rounded-full ml-auto mb-3" />
                                        <StatusBadge paidAmount={sale.paidAmount} totalAmount={sale.totalAmount} />
                                    </div>
                                </div>

                                {/* INFO SECTION */}
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-7 mb-8">
                                    <div className="grid grid-cols-2 gap-10 pb-6 mb-6 border-b border-slate-200">
                                        {/* Billed To */}
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Billed To</p>
                                            <p className="text-[17px] font-bold text-slate-900 leading-tight mb-1.5">{customer.name}</p>
                                            <p className="text-[13px] text-slate-500 font-medium mb-0.5">{customer.mobile}</p>
                                            {customer.email && (
                                                <p className="text-[13px] text-slate-500 font-medium">{customer.email}</p>
                                            )}
                                        </div>

                                        {/* Invoice Meta */}
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Invoice Details</p>
                                            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Invoice No</span>
                                                    <span className="text-[14px] font-black text-[#1e3a5f]">{invoiceNo}</span>
                                                </div>
                                                <div className="h-px bg-slate-100" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</span>
                                                    <span className="text-[14px] font-bold text-[#1e3a5f]">{format(date, "dd MMM yyyy")}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* From */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-[3px] h-10 bg-[#ff5722] rounded-full shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-1.5">From</p>
                                            <p className="text-[15px] font-black text-[#ff5722]">Foxon Career Hub</p>
                                            <p className="text-[12px] text-slate-500 font-medium">
                                                Malappuram, Kerala - 676523 · foxonhub@gmail.com · +91 9072 121 714
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <ContinuationHeader invoiceNo={invoiceNo} pageNum={pageIndex + 1} />
                        )}

                        {/* TABLE */}
                        <div className="mb-8">
                            <TableHeader />
                            <TableBody
                                services={pageServices}
                                startIndex={startIndex}
                                totalAmount={sale.totalAmount}
                                paidAmount={sale.paidAmount}
                                isLastPage={isLastPage}
                            />
                        </div>

                        {!isLastPage && (
                            <div className="text-right mb-4">
                                <p className="text-[11px] text-slate-300 font-medium italic">Continued on next page...</p>
                            </div>
                        )}

                        {isLastPage && <InvoiceFooter staffName={staffName} />}

                        {totalPages > 1 && <PageNumber current={pageIndex + 1} total={totalPages} />}

                        {/* Bottom accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#1e3a5f] to-[#ff5722]" />
                    </div>
                );
            })}

            <style jsx>{`
                @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap");
            `}</style>
        </div>
    );
};
