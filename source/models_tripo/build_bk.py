import base64
R='source/models_tripo/'
b64=lambda f: base64.b64encode(open(R+f,'rb').read()).decode()
s=open(R+'baikonur.tpl.html').read().replace('/*GLB*/',b64('31_soyuz.glb'))
open('app/baikonur.html','w').write(s)
