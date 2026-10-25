import {mkdir,cp,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=resolve(root,'dist');
await mkdir(output,{recursive:true});
for(const name of ['index.html','adopt.html','about.html','cats.html','kittens.html','contact.html','404.html','previous-litters.html','reviews.html','favicon.svg','robots.txt','sitemap.xml','_headers','_routes.json']) await copyFile(join(root,name),join(output,name));
for(const directory of ['css','js','data','images','admin']) await cp(join(root,directory),join(output,directory),{recursive:true});
console.log('Static assets prepared in dist; source, tests, migrations and dependencies are excluded.');
