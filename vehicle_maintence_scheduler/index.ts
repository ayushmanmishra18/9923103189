import express from 'express';
import { Log, getToken } from '../logging_middleware';

const app = express();
app.use(express.json());

app.post('/api/optimize', async (req, res) => {
  let start = Date.now();
  try {
    await Log('backend', 'info', 'service', 'fetching data');
    const token = await getToken();
    const fetchOpts = { headers: { 'Authorization': `Bearer ${token}` } };
    
    // get depots and tasks
    let [dRes, vRes] = await Promise.all([
      fetch('http://4.224.186.213/evaluation-service/depots', fetchOpts),
      fetch('http://4.224.186.213/evaluation-service/vehicles', fetchOpts)
    ]);
    
    let depots: any = await dRes.json();
    let vData: any = await vRes.json();

    let maxHours = depots.depots.reduce((acc: any, d: any) => acc + d.MechanicHours, 0);
    let tasks = vData.vehicles;
    let n = tasks.length;

    // knapsack array
    let dp = Array(n+1).fill(0).map(()=>Array(maxHours+1).fill(0));

    for(let i=1; i<=n; i++) {
      let t = tasks[i-1];
      for(let w=1; w<=maxHours; w++) {
        if(t.Duration <= w) {
          dp[i][w] = Math.max(dp[i-1][w], dp[i-1][w-t.Duration] + t.Impact);
        } else {
          dp[i][w] = dp[i-1][w];
        }
      }
    }

    let remaining = maxHours;
    let dur = 0;
    let picked = [];

    // traceback
    for(let i=n; i>0 && remaining>0; i--) {
      if(dp[i][remaining] != dp[i-1][remaining]) {
        picked.push(tasks[i-1].TaskID);
        remaining -= tasks[i-1].Duration;
        dur += tasks[i-1].Duration;
      }
    }

    await Log('backend', 'info', 'service', 'done optimizing');

    res.json({
      picked: picked.reverse(),
      totalImpact: dp[n][maxHours],
      timeSpent: dur,
      hoursLeft: maxHours - dur
    });

  } catch(e: any) {
    console.error("Scheduler Error:", e);
    await Log('backend', 'error', 'service', e.message);
    res.status(500).send({ error: e.message });
  }
});

app.listen(3001, () => console.log('server up on 3001'));
