import React, { useMemo } from 'react';
import { InventoryItem } from '../types';
import StatsCard from './StatsCard';
import { Package, Layers, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CATEGORY_COLORS } from '../constants';

interface DashboardProps {
  inventory: InventoryItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ inventory }) => {
  
  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const totalQuantity = inventory.reduce((acc, curr) => acc + curr.quantity, 0);
    const categoryCount = new Set(inventory.map(i => i.category)).size;

    return { totalItems, totalQuantity, categoryCount };
  }, [inventory]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [inventory]);

  const stockData = useMemo(() => {
      // Top 5 items by quantity
      return [...inventory]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
        .map(i => ({ name: i.name.length > 15 ? i.name.substring(0, 15) + '...' : i.name, quantity: i.quantity }));
  }, [inventory]);

  return (
    <div className="space-y-6">
      {/* Updated grid to 3 columns since we removed one card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="animate-fade-in-up delay-100">
          <StatsCard 
            title="Tổng mã hàng" 
            value={stats.totalItems} 
            icon={Package} 
            colorClass="bg-blue-500" 
            trend="Danh mục đang hoạt động"
          />
        </div>
        <div className="animate-fade-in-up delay-200">
          <StatsCard 
            title="Tổng số lượng" 
            value={stats.totalQuantity.toLocaleString()} 
            icon={Layers} 
            colorClass="bg-emerald-500" 
            trend="Đơn vị sản phẩm"
          />
        </div>
        <div className="animate-fade-in-up delay-300">
          <StatsCard 
            title="Nhóm hàng" 
            value={stats.categoryCount} 
            icon={DollarSign} 
            colorClass="bg-violet-500" 
            trend="Phân loại chính"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        {/* Category Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80 hover:shadow-md transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Phân Bổ Danh Mục</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationDuration={1500}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, 'Mã hàng']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Stock Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80 hover:shadow-md transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Kho Còn Cao Nhất</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} tick={{fill: '#64748b'}} />
              <YAxis fontSize={12} tick={{fill: '#64748b'}} />
              <Tooltip cursor={{fill: '#f1f5f9'}} />
              <Bar dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Số lượng" animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;