// lib/google-sheets.ts

import { storage, Transaction } from './storage';

export const googleSheetsService = {
  async syncToCloud(transactions: Transaction[]) {
    const settings = storage.getSettings();
    if (!settings.googleSheetUrl) {
      throw new Error('กรุณากำหนด Google Sheet Web App URL ในหน้า Settings ก่อน');
    }

    try {
      const response = await fetch(settings.googleSheetUrl, {
        method: 'POST',
        mode: 'no-cors', // ป้องกัน CORS issue เบื้องต้นสำหรับ Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'syncTransactions',
          data: transactions,
        }),
      });

      return { success: true, message: 'ซิงก์ข้อมูลไปยัง Google Sheets สำเร็จ' };
    } catch (error) {
      console.error('Sync failed:', error);
      throw new Error('ไม่สามารถเชื่อมต่อกับ Google Sheets ได้');
    }
  }
};