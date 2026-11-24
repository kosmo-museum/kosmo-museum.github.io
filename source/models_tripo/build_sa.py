import base64
R='source/models_tripo/'
b64=lambda f: base64.b64encode(open(R+f,'rb').read()).decode()
s=open(R+'soyuzapollo.tpl.html').read().replace('/*GLB*/',b64('soyuzapollo.glb'))
open('app/soyuzapollo.html','w').write(s)
