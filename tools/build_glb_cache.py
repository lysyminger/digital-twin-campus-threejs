"""
将 assets/ 下所有 .glb 文件转为 base64，写入 data/glb_cache.js
双击 build_glb_cache.bat 运行
生成的 glb_cache.js 通过 <script> 标签加载，file:// 协议也能用
"""
import os, base64, glob

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(ROOT_DIR, 'assets')
OUT_FILE = os.path.join(ROOT_DIR, 'data', 'glb_cache.js')

files = glob.glob(os.path.join(ASSETS_DIR, '*.glb'))

if not files:
    print('assets/ 下没有 .glb 文件')
else:
    entries = []
    for fp in files:
        name = os.path.basename(fp)
        with open(fp, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('ascii')
        entries.append('  "{}": "{}"'.format(name, b64))
        size_kb = os.path.getsize(fp) / 1024
        print('  OK {} ({:.0f} KB)'.format(name, size_kb))

    js = 'var GLB_CACHE = {\n' + ',\n'.join(entries) + '\n};\n'
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        f.write(js)
    print('\n已生成 data/glb_cache.js ({:.0f} KB)'.format(os.path.getsize(OUT_FILE) / 1024))

input('\n按回车关闭...')
