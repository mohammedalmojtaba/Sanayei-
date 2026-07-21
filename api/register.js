import { db } from './firebase.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, phone, pin, trade, area } = req.body;

    if (!phone || !pin || pin.length !== 6) {
      return res.status(400).json({ error: 'بيانات غير مكتملة أو رمز الـ PIN غير صحيح (يجب أن يكون 6 أرقام)' });
    }

    try {
      const querySnapshot = await db.collection('technicians').where('phone', '==', phone).get();
      if (!querySnapshot.empty) {
        return res.status(400).json({ error: 'رقم الهاتف مسجل مسبقاً' });
      }

      const newTech = { name, phone, pin, trade, area, createdAt: new Date().toISOString() };
      const docRef = await db.collection('technicians').add(newTech);
      
      return res.status(200).json({ success: true, technician: { id: docRef.id, ...newTech } });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  res.status(405).end();
}
