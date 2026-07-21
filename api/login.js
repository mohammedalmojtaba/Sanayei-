import { db } from './firebase.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { phone, pin } = req.body;

    try {
      const snapshot = await db.collection('technicians')
        .where('phone', '==', phone)
        .where('pin', '==', pin)
        .get();

      if (snapshot.empty) {
        return res.status(401).json({ error: 'رقم الهاتف أو رمز الـ PIN خطأ' });
      }

      const techDoc = snapshot.docs[0];
      const technician = { id: techDoc.id, ...techDoc.data() };
      
      return res.status(200).json({ success: true, technician });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  res.status(405).end();
}
