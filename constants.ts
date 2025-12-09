
import { InventoryItem, User } from './types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    name: 'Mực In Canon 2900 (Cartridge 303)',
    category: 'Mực In',
    quantity: 45,
    unit: 'hộp',
    minStock: 10,
    location: 'Kệ A1',
    lastUpdated: new Date().toISOString(),
    condition: 'Mới'
  },
  {
    id: '2',
    name: 'Drum Máy Photo Ricoh MP 5002',
    category: 'Linh Kiện',
    quantity: 12,
    unit: 'cái',
    minStock: 5,
    location: 'Tủ B2',
    lastUpdated: new Date().toISOString(),
    condition: 'Mới'
  },
  {
    id: '3',
    name: 'Gạt Mực Lớn HP 1020',
    category: 'Linh Kiện',
    quantity: 150,
    unit: 'cái',
    minStock: 30,
    location: 'Kệ C1',
    lastUpdated: new Date().toISOString(),
    condition: 'Mới'
  },
  {
    id: '4',
    name: 'Rulo Sấy Canon 3300 (Upper)',
    category: 'Nhiệt & Sấy',
    quantity: 8,
    unit: 'cái',
    minStock: 3,
    location: 'Tủ Kỹ Thuật',
    lastUpdated: new Date().toISOString(),
    condition: 'Đã qua sử dụng'
  },
  {
    id: '5',
    name: 'Web Dầu Toshiba e-Studio 855',
    category: 'Vật Tư Tiêu Hao',
    quantity: 6,
    unit: 'cuộn',
    minStock: 5, // Low stock simulation
    location: 'Kho D',
    lastUpdated: new Date().toISOString(),
    condition: 'Mới'
  },
  {
    id: '6',
    name: 'Gạt Từ Nhỏ Canon 2900',
    category: 'Linh Kiện',
    quantity: 200,
    unit: 'cái',
    minStock: 50,
    location: 'Kệ C1',
    lastUpdated: new Date().toISOString(),
    condition: 'Mới'
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Mực In': '#2563eb', // Blue
  'Linh Kiện': '#10b981', // Emerald
  'Nhiệt & Sấy': '#f97316', // Orange
  'Vật Tư Tiêu Hao': '#8b5cf6', // Violet
  'Khác': '#94a3b8', // Slate
};

export const MOCK_USERS: Record<string, User & { password: string }> = {
  'admin': {
    username: 'admin',
    password: '123456', // Demo password
    name: 'Quản Trị Viên',
    role: 'admin'
  },
  'staff': {
    username: 'staff',
    password: '123456',
    name: 'Nhân Viên Kho',
    role: 'staff'
  }
};