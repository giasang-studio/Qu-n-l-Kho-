import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem } from "../types";

// Initialize Gemini client
// Note: In a real production app, you might proxy this through a backend to protect the key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Chats with the AI Assistant about the inventory.
 */
export const chatWithInventoryAssistant = async (
  message: string,
  inventory: InventoryItem[]
): Promise<string> => {
  try {
    const inventoryContext = JSON.stringify(inventory.map(i => ({ name: i.name, quantity: i.quantity, location: i.location })));
    
    // System instruction to give the AI context and persona
    const systemInstruction = `
      Bạn là 'Trợ Lý Quản lý Vật Tư'.
      Nhiệm vụ: Theo dõi tồn kho, trả lời câu hỏi và hỗ trợ nhập/xuất kho.
      
      DỮ LIỆU KHO (JSON Tóm tắt):
      ${inventoryContext}
      
      HƯỚNG DẪN TRẢ LỜI:
      1. Trả lời ngắn gọn, thân thiện bằng Tiếng Việt.
      2. Tra cứu chính xác số lượng từ dữ liệu JSON.
      3. Nếu người dùng muốn 'Lấy', 'Xuất', 'Dùng' -> Hướng dẫn họ xác nhận số lượng.
      4. Nếu người dùng muốn 'Thêm', 'Nhập' -> Hướng dẫn xác nhận thông tin.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Xin lỗi, tôi không thể xử lý yêu cầu lúc này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Đã xảy ra lỗi khi kết nối với AI. Vui lòng kiểm tra API Key.";
  }
};

export interface ParsedInventoryAction {
  action: 'import' | 'export';
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  location?: string;
  minStock?: number;
}

/**
 * Parses natural language input to extract item details and INTENT (Add vs Remove).
 */
export const parseNewItemInput = async (input: string): Promise<ParsedInventoryAction | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Phân tích câu lệnh kho vận này: "${input}". 
      Xác định xem đây là hành động NHẬP KHO (thêm mới/mua thêm) hay XUẤT KHO (lấy ra/dùng/bán).
      - Keywords NHẬP: thêm, mua, nhập, add, new.
      - Keywords XUẤT: lấy, dùng, xuất, bán, trừ, remove, take.
      Trích xuất thông tin vật tư.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ["import", "export"], description: "Loại hành động: import (nhập) hoặc export (xuất/lấy)" },
            name: { type: Type.STRING, description: "Tên vật tư" },
            category: { type: Type.STRING, description: "Danh mục (nếu có)" },
            quantity: { type: Type.NUMBER, description: "Số lượng" },
            unit: { type: Type.STRING, description: "Đơn vị tính" },
            location: { type: Type.STRING, description: "Vị trí" },
            minStock: { type: Type.NUMBER, description: "Min stock (chỉ dùng cho nhập mới)" }
          },
          required: ["action", "name", "quantity"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ParsedInventoryAction;
    }
    return null;
  } catch (error) {
    console.error("Parsing Error:", error);
    return null;
  }
};