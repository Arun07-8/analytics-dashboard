import React from "react";
import { format } from "date-fns";

const FIRST_PAGE_MAX_ROWS = 7;
const CONTINUATION_PAGE_MAX_ROWS = 16;

/**
 * Splits services into chunks for multi-page rendering.
 * First page gets fewer rows (header takes space), continuation pages get more.
 */
function paginateServices(services) {
    if (services.length <= FIRST_PAGE_MAX_ROWS) {
        return [services];
    }
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

/* ─── Reusable sub-components ─── */

function TopBorder() {
    return (
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#ff5722] via-[#ff7043] to-[#ff8a65]" />
    );
}

function BottomBorder() {
    return (
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#ff5722] via-[#ff7043] to-[#ff8a65]" />
    );
}

function PageNumber({ current, total }) {
    return (
        <div className="absolute bottom-5 left-0 right-0 text-center">
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                Page {current} of {total}
            </span>
        </div>
    );
}

function TableHeader() {
    return (
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] rounded-t-lg px-6 py-3">
            <div className="grid grid-cols-12 text-[11px] font-black text-white uppercase tracking-[0.15em]">
                <div className="col-span-1 text-left">SL</div>
                <div className="col-span-5 text-left">DESCRIPTION</div>
                <div className="col-span-2 text-right">RATE</div>
                <div className="col-span-2 text-right">QTY</div>
                <div className="col-span-2 text-right">AMOUNT</div>
            </div>
        </div>
    );
}

function TableBody({ services, startIndex, totalAmount, isLastPage }) {
    return (
        <div className="border-x border-b border-slate-200 rounded-b-lg overflow-hidden">
            {services.map((s, i) => (
                <div
                    key={i}
                    className="grid grid-cols-12 py-4 px-6 text-[14px] border-b border-slate-100 last:border-0 items-center hover:bg-slate-50/30 transition-colors"
                >
                    <div className="col-span-1 font-medium text-slate-500 text-left">
                        {startIndex + i + 1}
                    </div>
                    <div className="col-span-5 font-semibold text-slate-700 text-left">
                        {s.name}
                    </div>
                    <div className="col-span-2 text-right text-slate-600 font-medium tabular-nums">
                        {"\u20B9"}
                        {s.price?.toLocaleString("en-IN")}
                    </div>
                    <div className="col-span-2 text-right text-slate-600 font-medium">
                        1
                    </div>
                    <div className="col-span-2 text-right text-slate-900 font-bold tabular-nums">
                        {"\u20B9"}
                        {s.price?.toLocaleString("en-IN")}
                    </div>
                </div>
            ))}

            {isLastPage && (
                <div className="grid grid-cols-12 py-5 px-6 items-center bg-slate-50 border-t border-slate-200">
                    <div className="col-span-10 text-right font-black text-slate-500 uppercase tracking-[0.2em] text-[12px]">
                        Total Amount
                    </div>
                    <div className="col-span-2 text-right text-[20px] font-black text-[#ff5722] tabular-nums">
                        {"\u20B9"}
                        {totalAmount?.toLocaleString("en-IN")}
                    </div>
                </div>
            )}
        </div>
    );
}

function ContinuationHeader({ invoiceNo, pageNum }) {
    return (
        <div className="flex justify-between items-center mb-8 px-2">
            <div className="flex items-center gap-3">
                <img
                    src="/Foxon Final Logo-01.png"
                    alt="Foxon Career Hub Logo"
                    className="h-16 w-auto object-contain"
                />
                <div>
                    <p className="text-[14px] font-bold text-[#1e3a5f]">
                        Foxon Career Hub
                    </p>
                    <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#ff5722]">
                        Crafting Career, Word by Word
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Invoice No:{" "}
                    <span className="text-[#1e3a5f]">{invoiceNo}</span>
                </p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Continued - Page {pageNum}
                </p>
            </div>
        </div>
    );
}

/* ─── Summary + Seal + Signature section (last page only) ─── */

function InvoiceFooter({ staffName }) {
    return (
        <div className="mt-auto px-2">
            {/* Seal & Signature on right */}
            <div className="flex justify-end mb-12">
                <div className="flex flex-col items-center shrink-0">
                    <img
                        src="/ciel.png"
                        alt="Company Seal"
                        className="h-[100px] w-[100px] object-contain opacity-90"
                    />
                    <div className="border-t-2 border-slate-300 pt-3 mt-4 min-w-[200px] text-center">
                        <p className="text-[14px] font-black text-slate-800 uppercase tracking-wider mb-0.5">
                            {staffName}
                        </p>
                        <p className="text-[11px] text-[#ff5722] font-black uppercase tracking-widest">
                            Authorized Signature
                        </p>
                    </div>
                </div>
            </div>

            {/* Thank You */}
            <div className="text-center pb-8 border-t border-slate-100 pt-8">
                <p className="text-[13px] font-black text-[#ff5722] uppercase tracking-[0.25em] mb-1.5">
                    Thank You For Your Business!
                </p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
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
        admins.find((a) => a.id === sale.staffId)?.name || "Authorized Signatory";
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
                for (let i = 0; i < pageIndex; i++) {
                    startIndex += pages[i].length;
                }

                return (
                    <div
                        key={pageIndex}
                        className="w-[794px] bg-white px-16 pt-16 pb-20 mx-auto text-slate-800 relative flex flex-col"
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            boxSizing: "border-box",
                            minHeight: "1123px",
                            pageBreakAfter: isLastPage ? "auto" : "always",
                        }}
                    >
                        <TopBorder />

                        {isFirstPage ? (
                            <>
                                {/* HEADER */}
                                <div className="flex justify-between items-start mb-14 px-2">
                                    <div>
                                        <img
                                            src="/Foxon Final Logo-01.png"
                                            alt="Foxon Career Hub Logo"
                                            className="h-32 w-auto object-contain mb-2"
                                        />
                                        <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#ff5722] pl-1">
                                            Crafting Career, Word by Word
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h1 className="text-[56px] font-black tracking-[-0.04em] text-[#1e3a5f] uppercase leading-none mb-2">
                                            INVOICE
                                        </h1>
                                        <div className="h-1 w-32 bg-gradient-to-r from-[#ff5722] to-[#ff8a65] ml-auto" />
                                    </div>
                                </div>

                                {/* INFO BOX */}
                                <div className="bg-gradient-to-br from-[#f8f9fa] to-[#f1f3f5] rounded-lg p-10 mb-14 mx-2 border border-slate-200 shadow-sm">
                                    <div className="grid grid-cols-2 gap-12 mb-8 border-b-2 border-[#ff5722]/20 pb-8">
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-1 h-5 bg-[#ff5722] rounded-full" />
                                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.15em]">
                                                    BILLED TO
                                                </p>
                                            </div>
                                            <p className="text-[17px] font-bold text-slate-800 leading-tight mb-1">
                                                {customer.name}
                                            </p>
                                            <p className="text-[13px] text-slate-600 font-medium">
                                                {customer.mobile}
                                            </p>
                                            {customer.email && (
                                                <p className="text-[13px] text-slate-600 font-medium">
                                                    {customer.email}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center gap-8">
                                                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                                            Invoice No
                                                        </p>
                                                        <p className="text-[15px] font-bold text-[#1e3a5f] tracking-wide">
                                                            {invoiceNo}
                                                        </p>
                                                    </div>
                                                    <div className="h-px bg-slate-200" />
                                                    <div className="flex justify-between items-center gap-8">
                                                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                                            Date
                                                        </p>
                                                        <p className="text-[15px] font-bold text-[#1e3a5f]">
                                                            {format(date, "dd MMM yyyy")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-1 h-5 bg-[#ff5722] rounded-full" />
                                            <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.15em]">
                                                FROM
                                            </p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[15px] font-bold text-[#ff5722]">
                                                Foxon Career Hub
                                            </p>
                                            <p className="text-[13px] font-semibold text-slate-700">
                                                Malappuram, Kerala - 676523
                                            </p>
                                            <p className="text-[13px] font-medium text-slate-600">
                                                foxonhub@gmail.com
                                            </p>
                                            <p className="text-[13px] font-medium text-slate-600">
                                                +91 9072 121 714
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <ContinuationHeader
                                invoiceNo={invoiceNo}
                                pageNum={pageIndex + 1}
                            />
                        )}

                        {/* TABLE */}
                        <div className="px-2 mb-8">
                            <TableHeader />
                            <TableBody
                                services={pageServices}
                                startIndex={startIndex}
                                totalAmount={sale.totalAmount}
                                isLastPage={isLastPage}
                            />
                        </div>

                        {/* "Continued..." indicator on non-last pages */}
                        {!isLastPage && (
                            <div className="px-2 mt-4 mb-4 text-right">
                                <p className="text-[11px] font-semibold text-slate-400 italic tracking-wide">
                                    Continued on next page...
                                </p>
                            </div>
                        )}

                        {/* FOOTER: Seal + Totals (LAST PAGE ONLY) */}
                        {isLastPage && (
                            <InvoiceFooter
                                staffName={staffName}
                            />
                        )}

                        {totalPages > 1 && (
                            <PageNumber current={pageIndex + 1} total={totalPages} />
                        )}
                        <BottomBorder />
                    </div>
                );
            })}

            <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap");
      `}</style>
        </div>
    );
};
