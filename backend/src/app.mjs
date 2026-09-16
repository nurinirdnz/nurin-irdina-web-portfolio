import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { resolve } from 'node:path';
const hash = value => createHash('sha256').update(value).digest('hex');
const contactSchema = z.object({name:z.string().trim().min(1).max(100),email:z.email().max(200),message:z.string().trim().min(10).max(3000)}).strict();
const passwordSchema = z.object({password:z.string().min(1).max(256)}).strict();
const statusSchema = z.object({status:z.enum(['new','read','archived'])}).strict();

export function createApp({ db, adminPassword, origin, production=false, frontend, trustProxy=0 }) {
  if (!adminPassword || adminPassword.length < 16) throw new Error('ADMIN_PASSWORD must contain at least 16 characters. Run npm run setup.');
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy',trustProxy);
  app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'",'data:'],connectSrc:["'self'"],objectSrc:["'none'"],frameAncestors:["'none'"],upgradeInsecureRequests:production?[]:null}},strictTransportSecurity:production?undefined:false}));
  app.use(express.json({limit:'16kb'}));
  app.use('/api',(_req,res,next)=>{res.set('Cache-Control','no-store');next();});
  // Require same-origin JSON on every browser write. No wildcard CORS.
  app.use('/api',(req,res,next)=>{
    if(['GET','HEAD','OPTIONS'].includes(req.method))return next();
    if(req.get('origin')!==origin)return res.status(403).json({error:'Request origin is not allowed.'});
    if(!req.is('application/json'))return res.status(415).json({error:'Use application/json.'});
    next();
  });
  const limit=(max,minutes)=>rateLimit({windowMs:minutes*60_000,limit:max,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many attempts. Please try again later.'}});
  app.get('/api/health',(_req,res)=>{db.prepare('SELECT 1').get();res.json({status:'ok'});});
  app.get('/api/portfolio',(_req,res)=>res.json({email:db.prepare('SELECT value FROM settings WHERE key=?').get('email').value,projects:db.prepare('SELECT content FROM projects ORDER BY position').all().map(row=>JSON.parse(row.content))}));
  app.post('/api/contact',limit(5,15),(req,res)=>{
    const parsed=contactSchema.safeParse(req.body);
    if(!parsed.success)return res.status(400).json({error:'Enter a name, valid email, and a message of 10–3000 characters.'});
    const {name,email,message}=parsed.data,id=randomUUID();
    db.prepare('INSERT INTO messages (id,name,email,message) VALUES (?,?,?,?)').run(id,name,email,message);
    res.status(201).json({id,message:'Your message has been received. Thank you for reaching out.'});
  });
  const cookieOptions={httpOnly:true,sameSite:'strict',secure:production,path:'/api/admin'};
  function token(req){const cookie=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('portfolio_session='));const value=cookie?.slice('portfolio_session='.length);return value&&/^[a-f0-9]{64}$/.test(value)?value:null;}
  function authenticated(req,res,next){
    const value=token(req);const session=value&&db.prepare('SELECT expires_at FROM sessions WHERE token_hash=?').get(hash(value));
    if(!session||session.expires_at<=Date.now())return res.status(401).json({error:'Please sign in.'});
    next();
  }
  app.post('/api/admin/login',limit(5,15),(req,res)=>{
    const parsed=passwordSchema.safeParse(req.body);
    if(!parsed.success||!timingSafeEqual(Buffer.from(hash(parsed.data?.password||''),'hex'),Buffer.from(hash(adminPassword),'hex')))return res.status(401).json({error:'Incorrect password.'});
    const previous=token(req);if(previous)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(previous));
    db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());
    const value=randomBytes(32).toString('hex');const expiry=8*60*60*1000;
    db.prepare('INSERT INTO sessions VALUES (?,?)').run(hash(value),Date.now()+expiry);
    res.cookie('portfolio_session',value,{...cookieOptions,maxAge:expiry}).json({authenticated:true});
  });
  app.get('/api/admin/session',authenticated,(_req,res)=>res.json({authenticated:true}));
  app.post('/api/admin/logout',authenticated,(req,res)=>{db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token(req)));res.clearCookie('portfolio_session',cookieOptions).json({ok:true});});
  app.get('/api/admin/messages',authenticated,(req,res)=>{
    const page=Math.max(1,Math.min(Number.parseInt(req.query.page,10)||1,100000));const size=20;
    const total=db.prepare('SELECT COUNT(*) AS count FROM messages').get().count;
    res.json({messages:db.prepare('SELECT * FROM messages ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?').all(size,(page-1)*size),page,total,pages:Math.max(1,Math.ceil(total/size))});
  });
  app.patch('/api/admin/messages/:id',authenticated,(req,res)=>{
    const parsed=statusSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Invalid message status.'});
    const result=db.prepare('UPDATE messages SET status=? WHERE id=?').run(parsed.data.status,req.params.id);
    if(!result.changes)return res.status(404).json({error:'Message not found.'});res.json({ok:true});
  });
  app.use('/api',(_req,res)=>res.status(404).json({error:'API route not found.'}));
  app.get('/admin',(_req,res)=>res.sendFile(resolve(frontend,'admin.html')));
  app.use(express.static(frontend,{dotfiles:'deny',index:'index.html'}));
  app.use((error,_req,res,_next)=>{if(error.type==='entity.too.large')return res.status(413).json({error:'Message is too large.'});if(error.type==='entity.parse.failed')return res.status(400).json({error:'Invalid JSON.'});console.error('Request failed:',error.message);res.status(500).json({error:'Something went wrong. Please try again later.'});});
  return app;
}
