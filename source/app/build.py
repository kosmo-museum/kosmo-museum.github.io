import json, os
KO=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # папка kosmo/
os.chdir(os.path.join(KO,'app'))
H=os.path.join(KO,'_hairline_kernel/skills/hairline-create/kernel.js'); HAIR_DIR=os.path.dirname(H)
t=open('src/app2.html').read(); k=open(H).read(); fig=open('fig/zal1.js').read(); F={k:open(f'fig/{k}.js').read() for k in ('vostok','luna9','lunokhod','mir','sputnik','sk1','berkut','container','venera','ps1x','gird09')}; EX=json.load(open('src/data.json')); css=open('src/base.css').read()
import glob, base64, os
PORT = {os.path.splitext(os.path.basename(f))[0]: 'data:image/jpeg;base64,' + base64.b64encode(open(f,'rb').read()).decode() for f in glob.glob('portraits/*.jpg')}
t = t.replace('/*PORTRAITS*/{}', json.dumps(PORT))
EXTRA=['soyuz45','yastreb','orlan','airlock','krechet','luna16','venera4','mars3','painting']
t=t.replace('/*FIG_EXTRA*/','\n'.join(f'(() => {{\n{open(f"fig/{n}.js").read()}\n}})();' for n in EXTRA if os.path.exists(f'fig/{n}.js')))
open('index.html','w').write(t.replace('/*BASECSS*/',css).replace('/*KERNEL*/',k).replace('/*HLMAP*/',open(KO+'/hall1/hlfigs.js').read()+'\n'+open('src/hlmap_app.js').read()).replace('/*FIGURE*/',fig).replace('/*FIG_VOSTOK*/',F['vostok']).replace('/*FIG_LUNA9*/',F['luna9']).replace('/*FIG_LUNOKHOD*/',F['lunokhod']).replace('/*FIG_MIR*/',F['mir']).replace('/*FIG_SPUTNIK*/',F['sputnik']).replace('/*FIG_SK1*/',F['sk1']).replace('/*FIG_BERKUT*/',F['berkut']).replace('/*FIG_CONTAINER*/',F['container']).replace('/*FIG_VENERA*/',F['venera']).replace('/*FIG_PS1X*/',F['ps1x']).replace('/*FIG_GIRD09*/',F['gird09']).replace('/*EARTH_LAND*/',open('src/earth_land.b64').read()).replace('/*EARTH_OCEAN*/',open('src/earth_ocean.b64').read()).replace('/*FONTS*/',open('src/fonts.css').read()).replace('/*MAPDATA*/',open('src/mapdata.js').read()).replace('/*DOG3D*/',open('src/dog3d.js').read()).replace('/*STORYJS*/',open('src/story.js').read()).replace('/*TYPOJS*/',open('src/typo.js').read()).replace('/*DOG2D*/',open(KO+'/dogs/dog2d.js').read()).replace('/*DATA*/',json.dumps(EX,ensure_ascii=False)))

# v173: длительности записей аудиогида — только для mp3, которые реально лежат в app/audio/<id>.mp3
import subprocess, re as _re
def _dur(f):
    try: return round(float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout.strip()),2)
    except Exception: return None
_AD={}
for _f in sorted(glob.glob(os.path.join(KO,'..','app','audio','*.mp3'))):
    _k=os.path.splitext(os.path.basename(_f))[0]; _d=_dur(_f)
    if (_k.isdigit() or _k=='intro') and _d: _AD[_k]=_d
_h=open('index.html').read(); open('index.html','w').write(_h.replace('/*AUDDUR*/',','.join(f'"{k}":{v}' for k,v in _AD.items())))
