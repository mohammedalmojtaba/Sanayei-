import { db } from './firebase.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { techId, clientName, clientPhone, address, description } = req.body;

    if (!techId || !clientName || !clientPhone) {
      return res.status(400).json({ error: 'بيانات الطلب ناقصة' });
    }

    try {
      const newJob = {
        techId,
        clientName,
        clientPhone,
        address,
        description,
        createdAt: new Date().toISOString()
      };

      const docRef = await db.collection('jobs').add(newJob);
      return res.status(200).json({ success: true, job: { id: docRef.id, ...newJob } });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'GET') {
    const { techId } = req.query;
    if (!techId) {
      return res.status(400).json({ error: 'معرف الفني مطلوب' });
    }

    try {
      const snapshot = await db.collection('jobs').where('techId', '==', techId).get();
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(jobs);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.status(405).end();
}
