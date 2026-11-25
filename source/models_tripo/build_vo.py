import base64
R='source/models_tripo/'
s=open(R+'vostok.tpl.html').read().replace('/*GLB*/',base64.b64encode(open(R+'vostok.glb','rb').read()).decode())
open('app/vostok.html','w').write(s)
