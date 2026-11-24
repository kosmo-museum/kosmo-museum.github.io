import base64
R='source/models_tripo/'
b64=lambda f: base64.b64encode(open(R+f,'rb').read()).decode()
s=open(R+'luna16.tpl.html').read()
for k,f in [('/*GLB*/','21_luna16.glb'),('/*ROCKS*/','moonrocks.glb'),('/*SURF*/','moonsurface.glb'),('/*PANO0*/','pano0.webp'),('/*PANO1*/','pano1.webp')]: s=s.replace(k,b64(f))
open('app/luna16.html','w').write(s)
