let tokenCache = ""; // TODO: maybe move to redis later if this scales

export async function getToken() {
  if (tokenCache) return tokenCache;
  const URL = 'http://4.224.186.213/evaluation-service';
  let res = await fetch(`${URL}/auth`, {
    method: 'POST',
    headers:{'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: "ayushmanmishraji1@gmail.com",
      name: "ayushman mishra",
      rollNo: "9923103189",
      accessCode: "MdprhE",
      clientID: "59b24bad-d41c-4391-b8b1-af4bb73021d7",
      clientSecret: "ExMEphrYqgFFDath"
    })
  });
  const data: any = await res.json();
  tokenCache = data.access_token;
  return tokenCache;
}

export const Log = async (stack: string, level: string, pkg: string, msg: string) => {
  const URL = 'http://4.224.186.213/evaluation-service';
  
  if(stack !== 'backend') return; // only doing backend track

  try {
    const token = await getToken();

    await fetch(`${URL}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ stack, level, package: pkg, message: msg })
    });
  } catch(e) {
    // console.log("log failed", e)
  }
}
