// app/income-expenses/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { storage, Transaction, Settings } from '@/lib/storage';
import { googleSheetsService } from '@/lib/google-sheets';

export default function IncomeExpensePage() {
  const [activeTab, setActiveTab] = useState<'ledger' | 'flower' | 'expense'>('flower');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings>(storage.getSettings());

  // Form states for Flower Income
  const [flowerDate, setFlowerDate] = useState('');
  const [flowerAmount, setFlowerAmount] = useState('');
  const [flowerCurrency, setFlowerCurrency] = useState<'USD' | 'CHF' | 'THB'>('USD');
  const [flowerNote, setFlowerNote] = useState('');

  // Form states for General Expense
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState('Groceries');
  const [expAmount, setExpAmount] = useState('');
  const [expCurrency, setExpCurrency] = useState<'USD' | 'CHF' | 'THB'>('USD');
  const [expNote, setExpNote] = useState('');

  const [syncStatus, setSyncStatus] = useState<string>('');

  useEffect(() => {
    setTransactions(storage.getTransactions());
  }, []);

  const handleSaveFlower = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flowerAmount || Number(flowerAmount) <= 0) return;

    // บันทึกเข้า Ledger ในฐานะ Income โดยอัตโนมัติ (Single Source of Truth)
    storage.addTransaction({
      date: flowerDate,
      type: 'income',
      category: 'Flower Income',
      description: `รายรับดอกไม้ประจำวันที่ ${flowerDate}`,
      amount: Number(flowerAmount),
      currency: flowerCurrency,
      source_type: 'flower_income',
      note: flowerNote,
    });

    setTransactions(storage.getTransactions());
    setFlowerAmount('');
    setFlowerNote('');
    alert('บันทึกรายรับดอกไม้สำเร็จ และเพิ่มลงบัญชีรายรับ-รายจ่ายเรียบร้อยแล้ว');
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || Number(expAmount) <= 0 || !expDesc) return;

    storage.addTransaction({
      date: expDate,
      type: 'expense',
      category: expCategory,
      description: expDesc,
      amount: Number(expAmount),
      currency: expCurrency,
      source_type: 'manual',
      note: expNote,
    });

    setTransactions(storage.getTransactions());
    setExpDesc('');
    setExpAmount('');
    setExpNote('');
    alert('บันทึกรายจ่ายสำเร็จ');
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      storage.deleteTransaction(id);
      setTransactions(storage.getTransactions());
    }
  };

  const handleCloudSync = async () => {
    try {
      setSyncStatus('กำลังซิงก์...');
      const res = await googleSheetsService.syncToCloud(transactions);
      setSyncStatus(res.message);
    } catch (err: any) {
      setSyncStatus(err.message);
    }
  };

  // คำนวณยอดรวมแยกตามสกุลเงิน
  const totalIncomeFlower = transactions
    .filter(t => t.source_type === 'flower_income')
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-24 text-gray-800 font-sans shadow-xl">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold text-center">รายรับ-รายจ่าย & ดอกไม้</h1>
        <div className="flex justify-around mt-4 text-sm font-medium border-t border-emerald-500 pt-2">
          <button onClick={() => setActiveTab('flower')} className={activeTab === 'flower' ? 'border-b-2 border-white pb-1' : 'opacity-80'}>
            🌸 ดอกไม้
          </button>
          <button onClick={() => setActiveTab('expense')} className={activeTab === 'expense' ? 'border-b-2 border-white pb-1' : 'opacity-80'}>
            💸 เพิ่มรายจ่าย
          </button>
          <button onClick={() => setActiveTab('ledger')} className={activeTab === 'ledger' ? 'border-b-2 border-white pb-1' : 'opacity-80'}>
            📊 ประวัติและสรุป
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Sync Status Bar */}
        <div className="bg-gray-50 border p-3 rounded-xl flex items-center justify-between text-sm">
          <div>
            <span className="font-semibold text-gray-600">สถานะข้อมูล:</span> บันทึกในเครื่องแล้ว (LocalStorage)
            {syncStatus && <div className="text-emerald-600 text-xs mt-1">{syncStatus}</div>}
          </div>
          <button onClick={handleCloudSync} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow hover:bg-blue-700">
            ซิงก์ Sheets
          </button>
        </div>

        {/* Tab 1: Flower Income */}
        {activeTab === 'flower' && (
          <form onSubmit={handleSaveFlower} className="bg-pink-50 border border-pink-200 p-4 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-pink-700">🌸 บันทึกรายได้ดอกไม้รายวัน</h2>
            <div>
              <label className="block text-sm font-medium mb-1">วันที่</label>
              <input type="date" value={flowerDate} onChange={e => setFlowerDate(e.target.value)} className="w-full p-3 border rounded-xl bg-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">จำนวนเงิน</label>
              <input type="number" step="0.01" placeholder="0.00" value={flowerAmount} onChange={e => setFlowerAmount(e.target.value)} className="w-full p-3 border rounded-xl bg-white text-lg font-bold" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">สกุลเงิน</label>
              <select value={flowerCurrency} onChange={e => setFlowerCurrency(e.target.value as any)} className="w-full p-3 border rounded-xl bg-white">
                <option value="USD">USD ($)</option>
                <option value="CHF">CHF (ฟรังก์สวิส)</option>
                <option value="THB">THB (บาท)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">หมายเหตุ (ถ้ามี)</label>
              <input type="text" placeholder="เช่น ขายดอกไม้หน้าตลาด" value={flowerNote} onChange={e => setFlowerNote(e.target.value)} className="w-full p-3 border rounded-xl bg-white" />
            </div>
            <button type="submit" className="w-full bg-pink-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-pink-700">
              บันทึกรายรับดอกไม้
            </button>
          </form>
        )}

        {/* Tab 2: Expense Entry */}
        {activeTab === 'expense' && (
          <form onSubmit={handleSaveExpense} className="bg-gray-50 border p-4 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-700">💸 บันทึกรายจ่ายทั่วไป</h2>
            <div>
              <label className="block text-sm font-medium mb-1">วันที่</label>
              <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className="w-full p-3 border rounded-xl bg-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อรายการ / รายละเอียด</label>
              <input type="text" placeholder="เช่น ซื้อวัตถุดิบ, ค่าเดินทาง" value={expDesc} onChange={e => setExpDesc(e.target.value)} className="w-full p-3 border rounded-xl bg-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
              <select value={expCategory} onChange={e => setExpCategory(e.target.value)} className="w-full p-3 border rounded-xl bg-white">
                <option value="Groceries">อาหารและของใช้ (Groceries)</option>
                <option value="Transport">ค่าเดินทาง (Transport)</option>
                <option value="Bills">ค่าน้ำ/ค่าไฟ/บิล (Bills)</option>
                <option value="Other">อื่น ๆ (Other)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">จำนวนเงิน</label>
              <input type="number" step="0.01" placeholder="0.00" value={expAmount} onChange={e => setExpAmount(e.target.value)} className="w-full p-3 border rounded-xl bg-white text-lg font-bold" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">สกุลเงิน</label>
              <select value={expCurrency} onChange={e => setExpCurrency(e.target.value as any)} className="w-full p-3 border rounded-xl bg-white">
                <option value="USD">USD ($)</option>
                <option value="CHF">CHF (ฟรังก์สวิส)</option>
                <option value="THB">THB (บาท)</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-gray-800 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-black">
              บันทึกรายจ่าย
            </button>
          </form>
        )}

        {/* Tab 3: Ledger & History */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-700">📊 ประวัติธุรกรรมทั้งหมด</h2>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-center text-gray-400 py-8">ยังไม่มีประวัติการบันทึกข้อมูล</p>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="p-4 rounded-2xl border bg-white shadow-sm flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                        </span>
                        <span className="text-xs text-gray-400">{tx.date}</span>
                      </div>
                      <p className="font-semibold text-gray-800 mt-1">{tx.description || tx.category}</p>
                      {tx.note && <p className="text-xs text-gray-500 mt-0.5">{tx.note}</p>}
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-base ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} {tx.currency}
                      </p>
                      <button onClick={() => handleDelete(tx.id)} className="text-xs text-red-400 hover:text-red-600 mt-2">
                        ลบ
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
