
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  location: string;
  lastUpdated: string;
  condition: 'Mới' | 'Đã qua sử dụng';
}

export interface InventoryLog {
  id: string;
  timestamp: string;
  actionType: 'NHẬP' | 'XUẤT' | 'THÊM MỚI' | 'XÓA' | 'XÓA TẤT CẢ';
  itemName: string;
  quantityChange: number; // Positive or negative
  category: string;
  location: string;
  performedBy: string; // User name
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  ASSISTANT = 'ASSISTANT'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface User {
  username: string;
  name: string;
  role: 'admin' | 'staff';
}