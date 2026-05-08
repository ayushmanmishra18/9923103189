import express from 'express';
import { Log } from '../logging_middleware';

const app = express();
app.use(express.json());

app.get('/api/notifications', async (req, res) => {
  try {
    await Log('backend', 'info', 'service', 'fetching inbox');
    
    // stub data 
    let items = [
      { id: 1, type: 'Event', msg: 'Hackathon starts', time: Date.now() - 86400000 },
      { id: 2, type: 'Placement', msg: 'Offer letter', time: Date.now() - 3600000 },
      { id: 3, type: 'Result', msg: 'Exam results out', time: Date.now() - 7200000 }
    ];

    let w: any = { 'Placement': 100, 'Result': 70, 'Event': 40 };

    let scored = items.map(x => {
      let age = (Date.now() - x.time) / 3600000; // in hours
      let recency = Math.max(0, 30 - age); 
      let score = (w[x.type] || 0) + recency;
      return { ...x, score };
    });

    scored.sort((a, b) => b.score - a.score);

    res.json({ success: true, items: scored });

  } catch(err: any) {
    await Log('backend', 'error', 'service', err.message);
    res.status(500).json({ err: 'fetch failed' });
  }
});

app.listen(3002, () => console.log('notif app on 3002'));
