import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem, ChatMessage } from '../types';
import { chatWithInventoryAssistant, parseNewItemInput, ParsedInventoryAction } from '../services/geminiService';
import { Send, Bot, User, Loader2, Sparkles, PlusCircle, MinusCircle, ArrowRight } from 'lucide-react';

interface AssistantProps {
  inventory: InventoryItem[];
  onQuickAdd: (item: InventoryItem) => void;
  onUpdateQuantity: (id: string, change: number) => void;
}

// Helper to find the best matching item in inventory
const findMatchingItem = (inventory: InventoryItem[], name: string): InventoryItem | undefined => {
  const lowerName = name.toLowerCase();
  return inventory.find(item => item.name.toLowerCase().includes(lowerName) || lowerName.includes(item.name.toLowerCase()));
};

const Assistant: React.FC<AssistantProps> = ({ inventory, onQuickAdd, onUpdateQuantity }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Chào bạn! Tôi có thể giúp bạn kiểm tra kho còn, nhập thêm hàng hoặc lấy vật tư ra dùng. Ví dụ: "Lấy 2 hộp mực Canon 2900" hoặc "Thêm 5 cuộn Web dầu".',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for Pending Actions (Import or Export)
  const [pendingAction, setPendingAction] = useState<{
    type: 'import' | 'export';
    data: ParsedInventoryAction;
    matchedItem?: InventoryItem; // Only for export
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingAction]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setPendingAction(null);

    // Check action keywords to decide whether to parse as a structured command
    const lowerInput = userMessage.text.toLowerCase();
    const actionKeywords = ['thêm', 'nhập', 'tạo', 'mua', 'lấy', 'xuất', 'dùng', 'bán', 'trừ'];
    const hasActionKeyword = actionKeywords.some(kw => lowerInput.includes(kw));

    if (hasActionKeyword) {
       try {
         const extractedData = await parseNewItemInput(userMessage.text);
         if (extractedData && extractedData.name && extractedData.quantity) {
             
             // Handle EXPORT (Taking items)
             if (extractedData.action === 'export') {
                 const matchedItem = findMatchingItem(inventory, extractedData.name);
                 
                 if (matchedItem) {
                     setPendingAction({
                         type: 'export',
                         data: extractedData,
                         matchedItem: matchedItem
                     });
                     setMessages(prev => [...prev, {
                        id: Date.now().toString() + '_response',
                        role: 'model',
                        text: `Tôi tìm thấy "${matchedItem.name}" trong kho. Bạn muốn lấy ra ${extractedData.quantity} ${extractedData.unit || matchedItem.unit || ''} phải không?`,
                        timestamp: new Date()
                    }]);
                 } else {
                     // Item not found for export
                     setMessages(prev => [...prev, {
                        id: Date.now().toString() + '_response',
                        role: 'model',
                        text: `⚠️ Tôi hiểu bạn muốn lấy "${extractedData.name}", nhưng tôi không tìm thấy sản phẩm nào khớp tên này trong kho để xuất. Vui lòng kiểm tra lại tên chính xác.`,
                        timestamp: new Date()
                    }]);
                 }
             } 
             // Handle IMPORT (Adding items)
             else {
                 setPendingAction({
                     type: 'import',
                     data: extractedData
                 });
                 setMessages(prev => [...prev, {
                     id: Date.now().toString() + '_response',
                     role: 'model',
                     text: `Tôi đã chuẩn bị phiếu nhập kho cho "${extractedData.name}". Vui lòng xác nhận thông tin:`,
                     timestamp: new Date()
                 }]);
             }

             setIsLoading(false);
             return;
         }
       } catch (e) {
         // Fallback to normal chat if parsing fails
       }
    }

    // Normal Chat Interaction
    try {
      const responseText = await chatWithInventoryAssistant(userMessage.text, inventory);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAction = () => {
      if (!pendingAction) return;

      if (pendingAction.type === 'import') {
          const newItem: InventoryItem = {
              id: Date.now().toString(),
              name: pendingAction.data.name,
              category: pendingAction.data.category || 'Khác',
              quantity: pendingAction.data.quantity,
              unit: pendingAction.data.unit || 'cái',
              minStock: pendingAction.data.minStock || 10,
              location: pendingAction.data.location || 'Kho chung',
              lastUpdated: new Date().toISOString(),
              condition: 'Mới'
          };
          onQuickAdd(newItem);
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: `✅ Đã nhập kho thành công: "${newItem.name}" (+${newItem.quantity}).`,
              timestamp: new Date()
          }]);
      } else if (pendingAction.type === 'export' && pendingAction.matchedItem) {
          // Check if sufficient stock
          if (pendingAction.matchedItem.quantity < pendingAction.data.quantity) {
               setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'model',
                  text: `❌ Lỗi: Số lượng kho còn không đủ! (Hiện có: ${pendingAction.matchedItem?.quantity}, Muốn lấy: ${pendingAction.data.quantity})`,
                  timestamp: new Date()
              }]);
          } else {
              onUpdateQuantity(pendingAction.matchedItem.id, -pendingAction.data.quantity);
              setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'model',
                  text: `✅ Đã xuất kho: "${pendingAction.matchedItem.name}" (-${pendingAction.data.quantity}). Kho còn lại: ${pendingAction.matchedItem.quantity - pendingAction.data.quantity}.`,
                  timestamp: new Date()
              }]);
          }
      }

      setPendingAction(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
            <h3 className="font-bold text-slate-800">Trợ Lý AI</h3>
            <p className="text-xs text-slate-500">Hỗ trợ tra cứu & nhập/xuất kho thông minh</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-blue-100'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-blue-600" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        
        {/* Smart Action Confirmation Card */}
        {pendingAction && (
             <div className="flex justify-start animate-fade-in">
                 <div className={`ml-11 max-w-[90%] bg-white border-2 rounded-xl p-4 shadow-sm ${
                     pendingAction.type === 'import' ? 'border-indigo-100' : 'border-orange-100'
                 }`}>
                     <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                         pendingAction.type === 'import' ? 'text-indigo-900' : 'text-orange-800'
                     }`}>
                         {pendingAction.type === 'import' 
                            ? <><PlusCircle className="w-4 h-4" /> Xác nhận NHẬP kho</> 
                            : <><MinusCircle className="w-4 h-4" /> Xác nhận XUẤT kho</>
                         }
                     </h4>
                     
                     <div className="text-sm space-y-1 text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                         {pendingAction.type === 'export' && pendingAction.matchedItem ? (
                             <>
                                <p className="font-medium text-slate-800 border-b border-slate-200 pb-1 mb-1">{pendingAction.matchedItem.name}</p>
                                <div className="flex items-center justify-between text-xs mt-2">
                                    <span className="text-slate-500">Hiện có: {pendingAction.matchedItem.quantity}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                    <span className="text-red-600 font-bold">Lấy: {pendingAction.data.quantity}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                    <span className="text-emerald-600 font-bold">Còn: {pendingAction.matchedItem.quantity - pendingAction.data.quantity}</span>
                                </div>
                             </>
                         ) : (
                             <>
                                <p><strong>📦 Tên:</strong> {pendingAction.data.name}</p>
                                <p><strong>🔢 Số lượng:</strong> <span className="text-blue-600 font-bold">+{pendingAction.data.quantity}</span> {pendingAction.data.unit}</p>
                                {pendingAction.data.category && <p><strong>🏷️ Loại:</strong> {pendingAction.data.category}</p>}
                             </>
                         )}
                     </div>

                     <div className="flex gap-2">
                         <button 
                            onClick={confirmAction}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex-1 text-white shadow-sm transition-colors ${
                                pendingAction.type === 'import' 
                                ? 'bg-indigo-600 hover:bg-indigo-700' 
                                : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                         >
                             {pendingAction.type === 'import' ? 'Xác nhận Nhập' : 'Xác nhận Lấy'}
                         </button>
                         <button 
                            onClick={() => {
                                setPendingAction(null);
                                setMessages(prev => [...prev, {id: Date.now().toString(), role:'model', text:'Đã hủy thao tác.', timestamp: new Date()}])
                            }}
                            className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 font-medium"
                         >
                             Hủy
                         </button>
                     </div>
                 </div>
             </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 ml-0">
               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                 <Bot className="w-4 h-4 text-blue-600" />
               </div>
               <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                 <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                 <span className="text-xs text-slate-500">Đang xử lý thông tin...</span>
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-100 p-4">
        <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Nhập lệnh (vd: Lấy 2 hộp mực, Thêm 5 cuộn băng dính)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-inner transition-colors"
                    disabled={isLoading}
                />
            </div>

            <button 
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm flex-shrink-0"
            >
                <Send className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Assistant;