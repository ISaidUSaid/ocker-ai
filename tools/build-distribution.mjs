// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {mkdir,mkdtemp,readFile,writeFile,cp,readdir,rm,rename,appendFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,dirname,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=new Set(process.argv.slice(2));
for(const arg of args)if(!['--skip-build','--web-only'].includes(arg))throw new Error('Unknown option: '+arg);
const webOnly=args.has('--web-only');
const version=JSON.parse(await readFile(join(root,'package.json'),'utf8')).version;
if(!/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(version))throw new Error('A valid SDK version is required.');
const output=join(root,'.work/distribution');await mkdir(output,{recursive:true});
const name=`ocker-ai-sdk-${version}${webOnly?'-web':''}`;
const temporary=await mkdtemp(join(output,'.build-'));
const bundle=join(temporary,name);await mkdir(bundle);
const log=join(output,'build.log');await writeFile(log,'');
async function run(command,arguments_,cwd=root) {
  const result=spawnSync(command,arguments_,{cwd,encoding:'utf8',maxBuffer:64*1024*1024,env:process.env});
  await appendFile(log,`\n${command} ${arguments_.join(' ')}\n${result.stdout??''}\n${result.stderr??''}`);
  if(result.error||result.status!==0)throw new Error(`Distribution step failed: ${command} ${arguments_.join(' ')}. See ${log}`,{cause:result.error});
  return result.stdout;
}
const npm=process.platform==='win32'?'npm.cmd':'npm';
try {
  if(!args.has('--skip-build')) {
    for(const workspace of ['@ocker-ai/core','@ocker-ai/angular','@ocker-ai/react'])await run(npm,['run','build',`--workspace=${workspace}`]);
    if(!webOnly) {
      const mavenArgs=['--batch-mode','-f','ri/java/pom.xml','verify'];
      if(process.env.MAVEN_REPO_LOCAL)mavenArgs.unshift('-Dmaven.repo.local='+resolve(process.env.MAVEN_REPO_LOCAL));
      await run(process.env.MAVEN_BIN??'mvn',mavenArgs);
    }
  }
  await mkdir(join(bundle,'npm'));
  for(const folder of ['ri/js','ri/angular/dist','ri/react']) {
    const manifest=JSON.parse(await readFile(join(root,folder,'package.json'),'utf8'));
    if(manifest.version!==version)throw new Error('SDK package version differs: '+manifest.name);
    await run(npm,['pack','--ignore-scripts','--pack-destination',join(bundle,'npm')],join(root,folder));
  }
  if(!webOnly) {
    await mkdir(join(bundle,'nuget'));
    await run(process.env.DOTNET_BIN??'dotnet',['build','ri/c#/Ocker.sln','-c','Release']);
    for(const project of ['Ocker.Core','Ocker.Avalonia'])await run(process.env.DOTNET_BIN??'dotnet',['pack',`ri/c#/src/${project}/${project}.csproj`,'-c','Release','--no-build','--no-restore','-o',join(bundle,'nuget')]);
    for(const packageId of ['Ocker.AI.Core','Ocker.AI.Avalonia'])if(!existsSync(join(bundle,'nuget',`${packageId}.${version}.nupkg`)))throw new Error('NuGet version differs from SDK version: '+packageId);
    for(const artifact of ['ocker-java-parent','ocker-core','ocker-javafx']) {
      const repository=join(bundle,'maven/com/ocker',artifact,version);await mkdir(repository,{recursive:true});
      const module=artifact==='ocker-java-parent'?'ri/java':`ri/java/${artifact}`;
      await cp(join(root,module,'pom.xml'),join(repository,`${artifact}-${version}.pom`));
      if(artifact!=='ocker-java-parent')for(const suffix of ['', '-sources','-javadoc'])await cp(join(root,module,'target',`${artifact}-${version}${suffix}.jar`),join(repository,`${artifact}-${version}${suffix}.jar`));
      for(const filename of await readdir(repository)) {
        const bytes=await readFile(join(repository,filename));
        for(const algorithm of ['sha1','sha256'])await writeFile(join(repository,filename+'.'+algorithm),createHash(algorithm).update(bytes).digest('hex')+'\n');
      }
    }
  }
  for(const filename of ['LICENSE','NOTICE'])await cp(join(root,filename),join(bundle,filename));
  await cp(join(root,'spec'),join(bundle,'spec'),{recursive:true});
  await cp(join(root,'prompt-library'),join(bundle,'prompt-library'),{recursive:true,filter:source=>!source.endsWith('prepare.mjs')});
  for(const language of ['js','angular','react','node.js',...(!webOnly?['java','c#']:[])]) {
    await mkdir(join(bundle,'ri',language),{recursive:true});
    await cp(join(root,'ri',language,'README.md'),join(bundle,'ri',language,'README.md'));
  }
  await cp(join(root,'DISTRIBUTION.md'),join(bundle,'README.md'));
  await cp(join(root,'DISTRIBUTION.md'),join(bundle,'DISTRIBUTION.md'));
  async function files(directory) {
    const result=[];
    for(const entry of await readdir(directory,{withFileTypes:true})) {
      const path=join(directory,entry.name);if(entry.isDirectory())result.push(...await files(path));else if(entry.isFile())result.push(path);
    }return result.sort();
  }
  const entries=[];
  for(const path of await files(bundle)) {const bytes=await readFile(path);entries.push({path:relative(bundle,path).replaceAll('\\','/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
  const commit=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout?.trim();
  const dirty=spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).stdout?.trim();
  await writeFile(join(bundle,'MANIFEST.json'),JSON.stringify({format:'ocker-sdk-distribution',version,wireVersion:'0.1.0',components:webOnly?['javascript','angular','react']:['javascript','angular','react','java','javafx','dotnet','avalonia'],sourceCommit:commit,sourceTreeDirty:!!dirty,files:entries},null,2)+'\n');
  const manifestBytes=await readFile(join(bundle,'MANIFEST.json'));
  entries.push({path:'MANIFEST.json',sha256:createHash('sha256').update(manifestBytes).digest('hex')});
  await writeFile(join(bundle,'SHA256SUMS'),entries.sort((a,b)=>a.path.localeCompare(b.path)).map(entry=>`${entry.sha256}  ${entry.path}`).join('\n')+'\n');
  const archive=join(temporary,name+'.tar.gz');await run('tar',['-czf',archive,'-C',temporary,name]);
  const archiveHash=createHash('sha256').update(await readFile(archive)).digest('hex');
  const destination=join(output,name);
  if(existsSync(destination)) {
    const previous=JSON.parse(await readFile(join(destination,'MANIFEST.json'),'utf8'));
    if(previous.format!=='ocker-sdk-distribution')throw new Error('Refusing to replace an unknown output directory.');
    await rm(destination,{recursive:true});
  }
  await rename(bundle,destination);
  await rm(join(output,name+'.tar.gz'),{force:true});await rename(archive,join(output,name+'.tar.gz'));
  await writeFile(join(output,name+'.tar.gz.sha256'),archiveHash+'  '+name+'.tar.gz\n');
  console.log(`Prepared ${join(output,name+'.tar.gz')}\nSHA-256 ${archiveHash}\nPrivate distribution only; no packages were published.`);
} finally {await rm(temporary,{recursive:true,force:true});}
