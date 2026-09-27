import React from 'react';

interface DeveloperCreditFooterProps {
  className?: string;
  isPrintVisible?: boolean;
}

export default function DeveloperCreditFooter({ className = '', isPrintVisible = true }: DeveloperCreditFooterProps) {
  return (
    <footer
      className={`w-full py-3 px-4 text-center border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-sm z-10 select-none ${
        isPrintVisible ? 'print:border-slate-300 print:bg-transparent print:text-slate-800' : 'print:hidden'
      } ${className}`}
      id="developer-credit-footer"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-xs text-slate-400 print:text-slate-700">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-cyan-400 print:text-slate-900">ผู้พัฒนา :</span>
          <span className="text-slate-200 print:text-slate-900 font-medium">
            นายธีรวุฒ จำปาเรือง สาขาคอมพิวเตอร์ศึกษา
          </span>
        </div>
        <span className="hidden sm:inline text-slate-600 print:text-slate-400">•</span>
        <div className="text-slate-300 print:text-slate-800">
          คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น
        </div>
      </div>
    </footer>
  );
}
