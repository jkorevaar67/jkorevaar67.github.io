'use strict';
(async()=>{
 const panel=document.getElementById('authPanel'),main=document.querySelector('main'),message=document.getElementById('authStatus'),login=document.getElementById('login'),logout=document.getElementById('logout');
 main.hidden=true;window.WIZNOVA_AUTH=null;
 if(!window.supabase){message.textContent='Login kon niet laden. Vernieuw de pagina.';return}
 const client=window.supabase.createClient('https://wgocbnhtmzxalvwlpvyo.supabase.co','sb_publishable_0yRUp4LVsYdBcdmwLYfqxg_soc0fpQB',{auth:{storageKey:'wiznova-admin-auth-v1',storage:window.sessionStorage,flowType:'pkce',persistSession:true,detectSessionInUrl:true}});
 const endpoint='https://wgocbnhtmzxalvwlpvyo.supabase.co/functions/v1/wiznova-beheer';
 async function call(action,extra={}){const {data:{session}}=await client.auth.getSession();if(!session?.provider_token)throw Error('Log opnieuw in met GitHub.');const res=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action,githubToken:session.provider_token,...extra})});let result;try{result=await res.json()}catch{throw Error('De beheerfunctie is nog niet beschikbaar in Supabase.')}if(!res.ok)throw Error(result.error||'Geen beheertoegang.');return result}
 login.onclick=async()=>{const {error}=await client.auth.signInWithOAuth({provider:'github',options:{redirectTo:'https://wiznova.nl/beheer/',scopes:'public_repo'}});if(error)message.textContent=error.message};
 logout.onclick=async()=>{await client.auth.signOut({scope:'local'});sessionStorage.removeItem('wiznova-admin-auth-v1');location.replace('/beheer/')};
 try{const {data:{session},error}=await client.auth.getSession();if(error)throw error;if(!session){message.textContent='Log in met je GitHub-account om verder te gaan.';return}const result=await call('check');window.WIZNOVA_AUTH={call};main.hidden=false;login.hidden=true;logout.hidden=false;message.textContent='Ingelogd als '+result.login;const script=document.createElement('script');script.src='admin.js';document.body.append(script)}catch(e){message.textContent=e.message;logout.hidden=false}
})();
