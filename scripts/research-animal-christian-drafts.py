"""Prepare source-attributed ATLAS drafts. Network cache stays checkout-local."""
import urllib.request,urllib.parse,urllib.error,json,re,time,concurrent.futures,uuid,hashlib,html,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];CACHE=ROOT/'.sites-runtime/animals-research';CACHE.mkdir(parents=True,exist_ok=True)
UA='ATLAS Educational Catalogue/1.0 (small-batch attributed research)'
def request(url):
 for attempt in range(4):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=30) as r:return r.read(),r.headers.get('Content-Type','')
  except Exception as e:
   if attempt==3:raise
   time.sleep(min(30,3*(attempt+1)))
def api(domain,params):return json.loads(request('https://'+domain+'/w/api.php?'+urllib.parse.urlencode({'format':'json',**params}))[0])
def clean(s):return html.unescape(re.sub('<[^>]+>','',s)).strip()
def text_for(p,animal=False):
 sections=[];heading='Repères et contexte';lines=[]
 banned=r'notes|références|bibliographie|filmographie|discographie|statistiques|annexes|liens externes|voir aussi|ouvrages|publications|sources|documents|articles connexes|ressources|vie privée|anecdotes'
 for line in p.get('extract','').splitlines():
  if re.fullmatch(r'Notes(?: et références)?|Références|Bibliographie|Annexes|Voir aussi|Liens externes',line.strip('= '),re.I):break
  if re.search(r'ISBN|https?://|consulté le|présentation en ligne|lire en ligne',line,re.I):continue
  if line.strip() and (line.startswith('==') or (len(line.split())<=10 and '[' not in line and not re.search(r'[.!?…»:;]$',line.strip()) and not line.strip()[0].isdigit())):
   if lines:sections.append((heading,lines));lines=[]
   heading=line.strip('= ').strip()
  else:
   line=re.sub(r'\[.*?\]','',line).strip()
   if len(line.split())>=15 and re.search(r'[.!?…»]$',line) and not re.search(banned,heading,re.I):lines.append(line)
 if lines:sections.append((heading,lines))
 sections=[(h,l) for h,l in sections if not re.search(banned,h,re.I)]
 if not sections:return None
 selected=[];used=set();count=0
 indices=[0]+(sorted(set(round(1+i*(len(sections)-2)/5) for i in range(6))) if len(sections)>7 else list(range(1,len(sections))))
 if animal:
  preferred=[0]
  for pattern in ['description|morphologie|anatomie','répartition|distribution|habitat','alimentation|régime alimentaire|chasse','reproduction|cycle de vie','comportement|mode de vie|social','conservation|menaces|protection']:
   match=next((i for i,(h,ls) in enumerate(sections) if i not in preferred and re.search(pattern,h,re.I)),None)
   if match is not None:preferred.append(match)
  indices=preferred+[i for i in indices if i not in preferred]
  indices=indices[:7]
 for si in indices:
  h,ls=sections[si];allowance=170 if si==0 else 100;cur=[];n=0
  for li,l in enumerate(ls):
   if n>=allowance:break
   chosen=[]
   for sent in re.split(r'(?<=[.!?])\s+(?=[A-ZÀ-Ý«])',l):
    wc=len(sent.split())
    if n+wc>allowance+70 and chosen:break
    if wc>260:continue
    chosen.append(sent);n+=wc
   if chosen:cur.append(' '.join(chosen));used.add((si,li))
  if cur and count+n<=805:selected.append((si,h,cur));count+=n
  if count>=690:break
 if count<620:
  for si,(h,ls) in enumerate(sections):
   for li,l in enumerate(ls):
    wc=len(l.split())
    if (si,li) not in used and count+wc<=815:
     match=next((x for x in selected if x[0]==si),None)
     if match:match[2].append(l)
     else:selected.append((si,h,[l]))
     count+=wc
    if count>=650:break
   if count>=650:break
 if count<620:return None
 source='https://fr.wikipedia.org/w/index.php?oldid='+str(p['revisions'][0]['revid'])
 footer='Source du texte : contributeurs de Wikipédia, « '+p['title']+' », version consultée le 28 octobre 2026. Extraits sélectionnés et réorganisés pour cette fiche, sous licence CC BY-SA 4.0. Historique et attribution : '+source+'. Licence : https://creativecommons.org/licenses/by-sa/4.0/.'
 body='\n\n'.join(h+'\n'+'\n\n'.join(ls) for si,h,ls in sorted(selected))+'\n\n'+footer
 return body if 600<=len(body.split())<=900 else None

def subjects():
 result=[]
 data=json.load(open(ROOT/'scripts/data/animal-christian-subjects.json'))
 for file,universe in [('animals','Animaux'),('christian','Chrétienté')]:
  groups=data[file]
  result.extend({'title':name,'universe':universe,'group':group} for group,names in groups.items() for name in names)
 return result

def article(subject):
 title=subject['title'];cache=CACHE/('article-'+hashlib.sha256(title.encode()).hexdigest()+'.json')
 try:
  if cache.exists():p=json.load(open(cache))
  else:
   d=api('fr.wikipedia.org',{'action':'query','prop':'extracts|pageimages|revisions','explaintext':1,'exsectionformat':'plain','redirects':1,'titles':title.replace('’',"'"),'pithumbsize':500,'piprop':'thumbnail|name','rvprop':'ids'})
   p=next(iter(d.get('query',{}).get('pages',{}).values()));cache.write_text(json.dumps(p,ensure_ascii=False))
  return {**subject,'page':p}
 except Exception as e:return {**subject,'error':str(e)}

def metadata(articles):
 files=sorted(set(x['page']['pageimage'].replace('_',' ') for x in articles if x.get('page',{}).get('pageimage') and x['page'].get('revisions') and text_for(x['page'])))
 files=sorted(set(files)|set(json.load(open(ROOT/'scripts/data/animal-christian-subjects.json')).get('imageOverrides',{}).values()))
 files=[f for f in files if not (CACHE/('image-'+hashlib.sha256(f.encode()).hexdigest()+'.json')).exists()]
 for start in range(0,len(files),15):
  try:
   data=api('commons.wikimedia.org',{'action':'query','prop':'imageinfo','iiprop':'url|extmetadata','titles':'|'.join('File:'+f for f in files[start:start+15])})
   for p in data.get('query',{}).get('pages',{}).values():
    if p.get('imageinfo'):(CACHE/('image-'+hashlib.sha256(p['title'][5:].encode()).hexdigest()+'.json')).write_text(json.dumps(p['imageinfo'][0],ensure_ascii=False))
   print('Image credits',min(start+15,len(files)),'/',len(files),flush=True)
  except Exception as e:print('Metadata failed',str(e),flush=True)
  time.sleep(1)

def illustrate(subject):
 p=subject.get('page',{})
 override=json.load(open(ROOT/'scripts/data/animal-christian-subjects.json')).get('imageOverrides',{}).get(subject['title'])
 if override:p={**p,'pageimage':override,'thumbnail':{}}
 text=text_for(p,subject['universe']=='Animaux') if p.get('revisions') and p.get('pageimage') else None
 if not text:return None
 cache=CACHE/('image-'+hashlib.sha256(p['pageimage'].replace('_',' ').encode()).hexdigest()+'.json')
 if not cache.exists():return None
 info=json.load(open(cache));meta=info.get('extmetadata',{});lic=clean(meta.get('LicenseShortName',{}).get('value',''))
 if not re.search('CC BY|CC0|Public domain|PD|PDM',lic,re.I):return None
 out=ROOT/'public/animal-christian-drafts';out.mkdir(exist_ok=True);imageid=str(uuid.uuid5(uuid.NAMESPACE_URL,info['descriptionurl']));dest=out/(imageid+'.jpg')
 try:
  if not dest.exists():
   data,mime=request(p.get('thumbnail',{}).get('source') or info.get('thumburl') or info['url'])
   if not(data.startswith(b'\xff\xd8') or data.startswith(b'\x89PNG') or data[:4]==b'RIFF'):return None
   dest.write_bytes(data)
  description=p['extract'].split('\n')[0][:650];sentences=re.split(r'(?<=[.!?])\s+',description);short=''
  for sentence in sentences:
   if len(short)+len(sentence)+1>650:break
   short+=(' ' if short else '')+sentence
  return {k:v for k,v in {**subject,'page':None,'name':subject['title'] if subject['universe']=='Animaux' else p['title'],'id':str(uuid.uuid5(uuid.NAMESPACE_URL,'atlas-animals-christian-20261028:'+p['title'])),'category':subject['group'] if subject['universe']=='Animaux' else 'Catholicisme','description':short or description,'learningText':text,'imageKey':dest.name,'asset':'/animal-christian-drafts/'+dest.name,'imageCredit':clean(meta.get('Artist',{}).get('value','Contributeurs Wikimedia Commons'))[:210]+' · '+lic[:80],'imageSource':info['descriptionurl'],'imageLicense':lic,'imageLicenseUrl':clean(meta.get('LicenseUrl',{}).get('value','')),'textSource':'https://fr.wikipedia.org/w/index.php?oldid='+str(p['revisions'][0]['revid']),'specializedAlbums':[subject['group']]}.items() if k!='page'}
 except Exception as e:print('Image unavailable',subject['title'],str(e),flush=True);return None

if __name__=='__main__':
 import sys
 stage=sys.argv[1] if len(sys.argv)>1 else 'articles'
 if stage=='articles':
  results=[];selection=subjects()
  with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
   for i,r in enumerate(pool.map(article,selection)):
    results.append(r)
    if i%20==0:print('Articles',i+1,'/',len(selection),flush=True)
  (CACHE/'articles.json').write_text(json.dumps(results,ensure_ascii=False));print('Articles complete',len(results),flush=True)
 elif stage=='metadata':metadata(json.load(open(CACHE/'articles.json')))
 elif stage=='images':
  results=[];selection=json.load(open(CACHE/'articles.json'))
  with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
   for i,r in enumerate(pool.map(illustrate,selection)):
    if r:results.append(r)
    if i%20==0:print('Illustrated',len(results),'/',i+1,flush=True)
  (CACHE/'prepared.json').write_text(json.dumps(results,ensure_ascii=False));from collections import Counter;print(Counter(x['group'] for x in results),flush=True)
 elif stage=='finalize':
  from PIL import Image,ImageDraw
  from collections import Counter
  prepared=json.load(open(CACHE/'prepared.json'));valid=[];ids=set()
  for x in prepared:
   try:
    Image.open(ROOT/'public'/x['asset'].lstrip('/')).verify()
    if x['id'] not in ids:valid.append(x);ids.add(x['id'])
   except Exception:pass
  print('Verified candidates',Counter(x['group'] for x in valid),flush=True)
  policies=[('Animaux',100,{'Mammifères':30,'Oiseaux':20,'Reptiles':15,'Amphibiens':10,'Poissons':15,'Invertébrés':10}),('Chrétienté',25,{'Saints et saintes':15,'Édifices religieux':5,'Textes sacrés':3,'Objets et symboles':2})]
  chosen=[]
  for universe,total,quotas in policies:
   group=[]
   for name,n in quotas.items():group.extend([x for x in valid if x['universe']==universe and x['group']==name][:n])
   group.extend([x for x in valid if x['universe']==universe and x not in group][:total-len(group)])
   if len(group)!=total:raise ValueError('Not enough illustrated long drafts for '+universe+': '+str(len(group)))
   chosen.extend(group)
  catholicAlbums={'Saints et saintes':'Saints','Édifices religieux':'Batiments Catholiques','Textes sacrés':'Textes sacrés','Objets et symboles':'Objets Divin'}
  for i,x in enumerate(chosen):
   x['code']=f'ANI-{i+1:03d}' if i<100 else f'CAT-{103+i-100:03d}'
   if x['universe']=='Chrétienté':x['specializedAlbums']=[catholicAlbums[x['group']]]
   old=ROOT/'public'/x['asset'].lstrip('/');fmt=Image.open(old).format;ext={'JPEG':'jpg','PNG':'png','WEBP':'webp'}[fmt]
   if old.suffix!='.'+ext:
    new=old.with_suffix('.'+ext);new.write_bytes(old.read_bytes());x['imageKey']=new.name;x['asset']='/animal-christian-drafts/'+new.name
  (ROOT/'app/content/animal-christian-drafts-20261028.json').write_text(json.dumps(chosen,ensure_ascii=False,indent=2)+'\n')
  keep={Path(x['asset']).name for x in chosen}
  for f in (ROOT/'public/animal-christian-drafts').iterdir():
   if f.name not in keep:f.unlink()
  for offset in range(0,125,25):
   sheet=Image.new('RGB',(1000,925),'#eef1f7');draw=ImageDraw.Draw(sheet)
   for j,x in enumerate(chosen[offset:offset+25]):
    im=Image.open(ROOT/'public'/x['asset'].lstrip('/')).convert('RGB');im.thumbnail((185,135));left=(j%5)*200+(200-im.width)//2;top=(j//5)*185;sheet.paste(im,(left,top));draw.text(((j%5)*200+4,top+139),x['code']+' '+x['name'][:24],fill='black')
   sheet.save(CACHE/f'contact-{offset}.jpg')
  print('Final 125 drafts',Counter(x['universe'] for x in chosen),'words',min(len(x['learningText'].split()) for x in chosen),max(len(x['learningText'].split()) for x in chosen),flush=True)
