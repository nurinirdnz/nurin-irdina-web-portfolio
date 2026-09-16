import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openDatabase } from './src/database.mjs';
const db=openDatabase(resolve(process.env.DATABASE_PATH||'backend/data/portfolio.sqlite'));
const seed=JSON.parse(readFileSync(new URL('./seed/portfolio.json',import.meta.url),'utf8'));
db.exec('BEGIN');
try {
 for(const [i,p] of seed.projects.entries())db.prepare('INSERT INTO projects (id,position,content) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET position=excluded.position,content=excluded.content').run(p.id,i,JSON.stringify(p));
 db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('email',seed.email);
 db.exec('COMMIT');console.log('Project data refreshed. Existing contact messages and sessions were preserved.');
} catch(error){db.exec('ROLLBACK');throw error;}finally{db.close();}
