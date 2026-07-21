import { db } from './firebase.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const snapshot = await db.collection('technicians').get();
      const technicians = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(technicians);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
