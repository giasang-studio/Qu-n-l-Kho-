
import React, { useState } from 'react';
import { InventoryLog } from '../types';
import { FileSpreadsheet, FileText, Printer, Calendar, Search, ArrowDown, ArrowUp, Trash2, AlertTriangle, X } from 'lucide-react';

interface ReportsProps {
  logs: InventoryLog[];
  onClearLogs: () => void;
  onDeleteLog: (id: string) => void;
}

const Reports: React.FC<ReportsProps> = ({ logs, onClearLogs, onDeleteLog }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  
  // State for single delete
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  const filteredLogs = logs.filter(log => 
    log.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actionType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (isoString: string) => {
    // Only display Date (Day/Month/Year), remove Time
    return new Date(isoString).toLocaleDateString('vi-VN');
  };

  // 1. Export to Excel (CSV)
  const exportToExcel = () => {
    const headers = ["Ngày", "Người Thực Hiện", "Hành Động", "Tên Vật Tư", "Danh Mục", "Số Lượng", "Vị Trí"];
    const rows = filteredLogs.map(log => [
      formatDate(log.timestamp),
      log.performedBy,
      log.actionType,
      `"${log.itemName}"`, // Quote to handle commas
      log.category,
      log.quantityChange,
      log.location
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bao_Cao_Kho_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export to Word
  const exportToWord = () => {
    const tableHtml = document.getElementById('report-table')?.outerHTML;
    if (!tableHtml) return;

    const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Báo Cáo Kho</title></head><body>";
    const postHtml = "</body></html>";
    const html = preHtml + `<h2 style="text-align:center">BÁO CÁO XUẤT NHẬP TỒN</h2><p style="text-align:center">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</p>` + tableHtml + postHtml;

    const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
    });
    
    const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bao_Cao_Kho_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Export to PDF (via Print)
  const exportToPDF = () => {
    window.print();
  };
  
  const handleConfirmClear = () => {
      onClearLogs();
      setIsClearModalOpen(false);
  };

  const handleConfirmDeleteSingle = () => {
    if (logToDelete) {
      onDeleteLog(logToDelete);
      setLogToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
                type="text" 
                placeholder="Tìm kiếm lịch sử (tên, người dùng, hành động)..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         
         <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button onClick={exportToExcel} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium transition-colors border border-emerald-200 whitespace-nowrap">
                <FileSpreadsheet className="w-5 h-5" />
                <span className="hidden lg:inline">Excel</span>
            </button>
            <button onClick={exportToWord} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors border border-blue-200 whitespace-nowrap">
                <FileText className="w-5 h-5" />
                <span className="hidden lg:inline">Word</span>
            </button>
            <button onClick={exportToPDF} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors border border-slate-200 whitespace-nowrap">
                <Printer className="w-5 h-5" />
                <span className="hidden lg:inline">In / PDF</span>
            </button>
            {logs.length > 0 && (
                <button 
                    onClick={() => setIsClearModalOpen(true)} 
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors border border-red-200 whitespace-nowrap"
                    title="Xóa lịch sử"
                >
                    <Trash2 className="w-5 h-5" />
                    <span className="hidden lg:inline">Xóa tất cả</span>
                </button>
            )}
         </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none">
        <div className="p-6 border-b border-slate-100 print:hidden">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-500" />
                Lịch Sử Hoạt Động
            </h3>
        </div>
        
        {/* Print Header (Only visible when printing) */}
        <div className="hidden print:block p-8 text-center mb-4">
            <h1 className="text-2xl font-bold uppercase mb-2">Báo Cáo Xuất Nhập Kho</h1>
            <p className="text-slate-500">Ngày xuất báo cáo: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        <div className="overflow-x-auto">
            <table id="report-table" className="w-full text-left text-sm print:text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase print:bg-white print:text-black print:border-black">
                    <tr>
                        <th className="px-6 py-4 print:px-2 print:py-2">Ngày</th>
                        <th className="px-6 py-4 print:px-2 print:py-2">Người Dùng</th>
                        <th className="px-6 py-4 print:px-2 print:py-2">Hành Động</th>
                        <th className="px-6 py-4 print:px-2 print:py-2">Tên Vật Tư</th>
                        <th className="px-6 py-4 print:px-2 print:py-2">Danh Mục</th>
                        <th className="px-6 py-4 text-center print:px-2 print:py-2">Số Lượng</th>
                        <th className="px-6 py-4 print:px-2 print:py-2">Vị Trí</th>
                        <th className="px-6 py-4 print:hidden text-right"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 group">
                                <td className="px-6 py-4 text-slate-600 print:px-2 print:py-2">{formatDate(log.timestamp)}</td>
                                <td className="px-6 py-4 font-medium text-slate-800 print:px-2 print:py-2">{log.performedBy}</td>
                                <td className="px-6 py-4 print:px-2 print:py-2">
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold border ${
                                        log.actionType === 'NHẬP' || log.actionType === 'THÊM MỚI' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 print:border-none' :
                                        log.actionType === 'XUẤT' ? 'bg-orange-50 text-orange-700 border-orange-100 print:border-none' :
                                        'bg-red-50 text-red-700 border-red-100 print:border-none'
                                    }`}>
                                        {log.actionType}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-800 print:px-2 print:py-2">{log.itemName}</td>
                                <td className="px-6 py-4 text-slate-600 print:px-2 print:py-2">{log.category}</td>
                                <td className="px-6 py-4 text-center font-bold print:px-2 print:py-2">
                                    <span className={log.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600'}>
                                        {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600 print:px-2 print:py-2">{log.location}</td>
                                <td className="px-6 py-4 text-right print:hidden">
                                  <button 
                                    onClick={() => setLogToDelete(log.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Xóa dòng này"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                                Chưa có dữ liệu lịch sử nào.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Clear All History Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-scale-in border-2 border-red-100 relative">
             <button 
                onClick={() => setIsClearModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
             >
                <X className="w-5 h-5" />
             </button>
             <div className="flex items-center gap-3 mb-4 text-red-600">
               <div className="bg-red-100 p-2 rounded-full">
                  <AlertTriangle className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-slate-900">Xóa TOÀN BỘ Lịch Sử?</h3>
             </div>
             <p className="text-slate-600 mb-6 leading-relaxed">
               Bạn có chắc chắn muốn xóa toàn bộ <strong>lịch sử xuất nhập kho</strong> không? <br/>
               Hành động này không thể hoàn tác và các báo cáo cũ sẽ bị mất.
             </p>
             <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsClearModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleConfirmClear}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-bold shadow-md hover:shadow-lg"
                >
                  Xóa Lịch Sử
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Delete Single Log Confirmation Modal */}
      {logToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-scale-in border border-slate-100 relative">
             <button 
                onClick={() => setLogToDelete(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
             >
                <X className="w-5 h-5" />
             </button>
             <div className="flex items-center gap-3 mb-4 text-red-600">
               <div className="bg-red-50 p-2 rounded-full">
                  <Trash2 className="w-6 h-6" />
               </div>
               <h3 className="text-lg font-bold text-slate-900">Xóa dòng nhật ký này?</h3>
             </div>
             <p className="text-slate-600 mb-6 text-sm">
               Bạn có chắc muốn xóa dòng lịch sử này không?
             </p>
             <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setLogToDelete(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleConfirmDeleteSingle}
                  className="px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium text-sm shadow-sm"
                >
                  Xóa
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
