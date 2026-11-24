import asyncio, sys, json
from playwright.async_api import async_playwright
V='/home/claude/vendor/node_modules/three'
URL=sys.argv[1]; OUT=sys.argv[2]; STEPS=sys.argv[3].split('@@') if len(sys.argv)>3 else []
W=int(sys.argv[4]) if len(sys.argv)>4 else 390; H=int(sys.argv[5]) if len(sys.argv)>5 else 844
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        ctx=await b.new_context(viewport={'width':W,'height':H},device_scale_factor=1)
        async def route(r):
            u=r.request.url
            if 'three@0.160.0/' in u:
                path=u.split('three@0.160.0/')[1]; await r.fulfill(path=f'{V}/{path}', content_type='application/javascript'); return
            if u.startswith('http://localhost') or u.startswith('data:') or u.startswith('blob:'): await r.continue_(); return
            await r.abort()
        await ctx.route('**/*', route)
        await ctx.add_init_script("localStorage.setItem('kosmoOnboarded','1')")
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:print('PE',str(e)[:300])); pg.on('console',lambda m: print('CE',m.text[:200]) if m.type=='error' else None)
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        for i,step in enumerate(STEPS):
            if not step: continue
            if step.startswith('click:'): await pg.click(step[6:],timeout=4000)
            elif step.startswith('wait:'): await pg.wait_for_timeout(int(step[5:])); continue
            elif step.startswith('shot'): pass
            else:
                r=await pg.evaluate(step)
                if r is not None: print(i,json.dumps(r,ensure_ascii=False)[:1500])
            await pg.wait_for_timeout(900)
            await pg.screenshot(path=f'{OUT}_{i}.png')
        if not STEPS: await pg.screenshot(path=f'{OUT}_0.png')
        await b.close()
asyncio.run(main())
