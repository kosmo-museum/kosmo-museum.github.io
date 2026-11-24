import base64
s=open('source/models_tripo/luna16.tpl.html').read()
s=s.replace('/*GLB*/',base64.b64encode(open('source/models_tripo/21_luna16.glb','rb').read()).decode())
s=s.replace('/*ROCKS*/',base64.b64encode(open('source/models_tripo/moonrocks.glb','rb').read()).decode())
open('app/luna16.html','w').write(s)
