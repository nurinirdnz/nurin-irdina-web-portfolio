import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { openDatabase } from '../src/database.mjs';
import { createApp } from '../src/app.mjs';
const origin='http://localhost:3000',password='test-only-long-password-2026';
function fixture(t,options={}){const db=openDatabase(':memory:');t.after(()=>db.close());const app=createApp({db,adminPassword:password,origin,frontend:resolve('frontend'),...options});return {app,db};}
function post(client,path,body){return client.post(path).set('Origin',origin).send(body);}
const message={name:'Example Visitor',email:'visitor@example.com',message:'I would like to discuss a software project.'};

test('public portfolio is served from SQLite and static assets load',async t=>{
 const {app,db}=fixture(t),client=request(app);
 const result=await client.get('/api/portfolio').expect(200);assert.equal(result.body.projects.length,11);
 db.prepare("UPDATE settings SET value=? WHERE key='email'").run('updated@example.com');
 assert.equal((await client.get('/api/portfolio')).body.email,'updated@example.com');
 await client.get('/').expect(200).expect('Content-Type',/html/);
 await client.get('/admin').expect(200);
 await client.get('/vendor/gsap.min.js').expect(200);
 await client.get('/assets/favicon.svg').expect(200);
 await client.get('/backend/data/portfolio.json').expect(404);
 await client.get('/.env').expect(404);
});
test('validated contact persists and private inbox requires login',async t=>{
 const {app,db}=fixture(t),client=request(app);
 await client.get('/api/admin/messages').expect(401);
 await post(client,'/api/contact',{...message,email:'invalid'}).expect(400);
 await post(client,'/api/contact',{...message,message:'short'}).expect(400);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM messages').get().n,0);
 const result=await post(client,'/api/contact',message).expect(201);
 assert.equal(db.prepare('SELECT email FROM messages WHERE id=?').get(result.body.id).email,message.email);
 const agent=request.agent(app);
 await post(agent,'/api/admin/login',{password:'wrong'}).expect(401);
 const login=await post(agent,'/api/admin/login',{password}).expect(200);
 assert.match(login.headers['set-cookie'][0],/HttpOnly/);assert.match(login.headers['set-cookie'][0],/SameSite=Strict/);
 const token=login.headers['set-cookie'][0].split(';')[0].split('=')[1];
 assert.notEqual(db.prepare('SELECT token_hash FROM sessions').get().token_hash,token);
 const inbox=await agent.get('/api/admin/messages').expect(200);assert.equal(inbox.body.total,1);
 await agent.patch('/api/admin/messages/'+result.body.id).set('Origin',origin).send({status:'read'}).expect(200);
 assert.equal(db.prepare('SELECT status FROM messages').get().status,'read');
 await post(agent,'/api/admin/logout',{}).expect(200);
 await agent.get('/api/admin/messages').expect(401);
});
test('foreign-origin writes, malformed bodies and invalid statuses are rejected',async t=>{
 const {app}=fixture(t),client=request(app);
 await client.post('/api/contact').set('Origin','https://untrusted.example').send(message).expect(403);
 await client.post('/api/contact').send(message).expect(403);
 await client.post('/api/contact').set('Origin',origin).set('Content-Type','application/json').send('{bad').expect(400);
 await client.post('/api/contact').set('Origin',origin).send({...message,message:'x'.repeat(20000)}).expect(413);
 await post(client,'/api/contact',{...message,admin:true}).expect(400);
 const agent=request.agent(app);await post(agent,'/api/admin/login',{password}).expect(200);
 await agent.patch('/api/admin/messages/missing').set('Origin',origin).send({status:'deleted'}).expect(400);
 await agent.patch('/api/admin/messages/missing').set('Origin',origin).send({status:'read'}).expect(404);
});
test('contact throttling rejects excess submissions',async t=>{
 const {app}=fixture(t),client=request(app);
 for(let i=0;i<5;i++)await post(client,'/api/contact',message).expect(201);
 await post(client,'/api/contact',message).expect(429);
});
test('expired sessions are rejected and production cookies are secure',async t=>{
 const {app,db}=fixture(t),agent=request.agent(app);
 await post(agent,'/api/admin/login',{password}).expect(200);
 db.prepare('UPDATE sessions SET expires_at=0').run();
 await agent.get('/api/admin/messages').expect(401);
 const {app:secure}=fixture(t,{production:true});
 const response=await post(request(secure),'/api/admin/login',{password}).expect(200);
 assert.match(response.headers['set-cookie'][0],/Secure/);
});
test('SQLite retains submissions across restart without duplicating seed projects',()=>{
 const dir=mkdtempSync(join(tmpdir(),'portfolio-test-')),file=join(dir,'test.sqlite');
 try{let db=openDatabase(file);db.prepare('INSERT INTO messages(id,name,email,message) VALUES(?,?,?,?)').run('test-id',message.name,message.email,message.message);db.close();db=openDatabase(file);assert.equal(db.prepare('SELECT COUNT(*) n FROM messages').get().n,1);assert.equal(db.prepare('SELECT COUNT(*) n FROM projects').get().n,11);db.close();}finally{rmSync(dir,{recursive:true,force:true});}
});
const mail={notifyEmail:'owner@example.com',brevoApiKey:'test-key',brevoSenderEmail:'sender@example.com'};
function mockFetch(t,ok=true){const calls=[];const original=globalThis.fetch;globalThis.fetch=async(url,init)=>{calls.push({url,body:JSON.parse(init.body)});return {ok,status:ok?201:500,text:async()=>'fail'};};t.after(()=>{globalThis.fetch=original;});return calls;}
test('email-only mode sends before replying, stores nothing and exposes no inbox',async t=>{
 const calls=mockFetch(t);
 const {app,db}=fixture(t,{inbox:false,adminPassword:undefined,...mail}),client=request(app);
 await client.get('/api/portfolio').expect(200);
 const result=await post(client,'/api/contact',message).expect(201);
 assert.ok(result.body.id);
 assert.equal(calls.length,1);assert.equal(calls[0].body.to[0].email,mail.notifyEmail);assert.equal(calls[0].body.replyTo.email,message.email);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM messages').get().n,0);
 await post(client,'/api/admin/login',{password}).expect(404);
 await client.get('/api/admin/messages').expect(404);
 await client.get('/admin').expect(404);
 await client.get('/admin.html').expect(404);
 await post(client,'/api/contact',{...message,email:'invalid'}).expect(400);
 assert.equal(calls.length,1);
});
test('email-only mode reports a failed send instead of claiming success',async t=>{
 mockFetch(t,false);
 const {app}=fixture(t,{inbox:false,adminPassword:undefined,...mail});
 const result=await post(request(app),'/api/contact',message).expect(502);
 assert.match(result.body.error,/could not be sent/);
});
test('email-only mode without email settings keeps projects up but refuses contact',async t=>{
 const calls=mockFetch(t);
 const {app}=fixture(t,{inbox:false,adminPassword:undefined}),client=request(app);
 assert.equal((await client.get('/api/portfolio').expect(200)).body.projects.length,11);
 await post(client,'/api/contact',message).expect(503);
 assert.equal(calls.length,0);
});
test('Vercel entry loads seeded projects in email-only mode',async t=>{
 const keys=['NOTIFY_EMAIL','BREVO_API_KEY','BREVO_SENDER_EMAIL','APP_ORIGIN'],saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 Object.assign(process.env,{NOTIFY_EMAIL:mail.notifyEmail,BREVO_API_KEY:mail.brevoApiKey,BREVO_SENDER_EMAIL:mail.brevoSenderEmail,APP_ORIGIN:'https://portfolio.example'});
 t.after(()=>{for(const k of keys){if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}});
 const {default:app}=await import('../../api/index.mjs');
 const result=await request(app).get('/api/portfolio').expect(200);
 assert.equal(result.body.projects.length,11);
 await request(app).get('/api/admin/session').expect(404);
 await request(app).post('/api/contact').set('Origin',origin).send(message).expect(403);
});
