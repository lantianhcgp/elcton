#!/usr/bin/env python3
"""Make labeled visual-QA sheets from actual screenshots; raw evidence is never overwritten."""
from pathlib import Path
from typing import cast
from PIL import Image, ImageDraw, ImageFont, ImageStat
import argparse, hashlib, json, re, xml.etree.ElementTree as ET

parser=argparse.ArgumentParser()
parser.add_argument('--phone',type=Path,required=True,help='Exact Android product screenshot directory')
parser.add_argument('--watch',type=Path,required=True,help='Exact original-app watch tour directory')
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args();phone=args.phone;watch=args.watch;out=args.output;out.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans.ttf',16) if Path('/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans.ttf').exists() else ImageFont.load_default(size=16)

def sheet(items,name,cellw=390,cellh=560,cols=3):
    rows=(len(items)+cols-1)//cols
    image=Image.new('RGB',(cols*(cellw+12)+12,rows*(cellh+36)+12),(9,12,17));draw=ImageDraw.Draw(image)
    for index,(label,frame) in enumerate(items):
        frame=frame.convert('RGB');frame.thumbnail((cellw,cellh))
        x=12+(index%cols)*(cellw+12);y=12+(index//cols)*(cellh+36)
        draw.text((x,y),label,fill=(235,240,248),font=font)
        image.paste(frame,(x+(cellw-frame.width)//2,y+28))
    target=out/(name+'.png');image.save(target);return str(target)

def phone_crop(name,region):
    im=Image.open(phone/name);return im.crop(region)

pages=sorted(phone.glob('*.png'))
phone_sheets=[]
for start in range(0,len(pages),6):
    subset=pages[start:start+6]
    phone_sheets.append(sheet([(p.stem,Image.open(p)) for p in subset],f'phone-states-{start+1:02d}',340,605))

component_groups={
    'phone-header-nav': [('01-today-empty.png',(0,60,1080,275)),('05-week-course.png',(0,275,1080,960)),('13-device.png',(0,60,1080,280)),('05-week-course.png',(0,1560,1080,1800))],
    'phone-editor': [('06-editor-filled.png',(30,275,1050,1515)),('15-editor-bottom.png',(35,830,1045,1590)),('29-keyboard-visible.png',(0,265,1080,1380)),('16-delete-confirm.png',(105,625,975,1230))],
    'phone-import-export': [('10-import.png',(70,470,1010,1420)),('11-import-preview.png',(100,570,980,1260)),('12-export-preview.png',(100,370,980,1470)),('19-restore-confirm.png',(155,650,925,1220))],
    'phone-device-settings': [('08-settings.png',(35,360,1045,1565)),('09-settings-invalid.png',(30,275,1050,990)),('14-device-unavailable.png',(30,355,1050,1585)),('13-device.png',(30,1170,1050,1585))],
    'phone-file-roundtrip': [('23-file-export-picker.png',(0,60,1080,1460)),('25-file-import-picker.png',(0,60,1080,1420)),('26-file-import-preview.png',(70,490,1010,1350)),('28-restarted-file-import.png',(30,260,1050,960))]
}
for name,items in component_groups.items():
    phone_sheets.append(sheet([(Path(n).stem,phone_crop(n,r)) for n,r in items],name,500,650,2))

watch_sheets=[]
for prefix in ['rect-412x484','round-390x390','round-466x466','rect-336x480','rect-280x456']:
    frames=sorted(watch.glob(prefix+'-*.png'))
    assert len(frames)==23,(prefix,len(frames))
    for start in range(0,len(frames),8):
        watch_sheets.append(sheet([(p.stem.removeprefix(prefix+'-'),Image.open(p)) for p in frames[start:start+8]],f'watch-{prefix}-{start//8+1}',390,500,4))

# Pixel checks on real decoded pixels, not PNG filter bytes or file length.
checks=[]
for p in watch.glob('*.png'):
    im=Image.open(p).convert('RGB');m=re.match(r'(round|rect)-(\d+)x(\d+)',p.name)
    assert m is not None, p.name
    shape,w,h=m.group(1),int(m.group(2)),int(m.group(3));assert im.size==(w,h),(p.name,im.size)
    pixels=cast(list[tuple[int,int,int]],list(im.get_flattened_data()))
    bright=sum(1 for rgb in pixels if min(rgb)>100)
    stat=ImageStat.Stat(im);assert bright>30 and max(stat.stddev)>12,(p.name,bright,stat.stddev)
    outside=0
    if shape=='round':
        external=pixels[0]
        for index,rgb in enumerate(pixels):
            y,x=divmod(index,w)
            # hmlwsim's clipped outer page is grey. Exclude only that sampled background.
            if (x-w/2)**2+(y-h/2)**2>(w/2+2)**2 and min(rgb)>90 and max(abs(rgb[i]-external[i]) for i in range(3))>12:
                outside+=1
        assert outside<10,(p.name,outside)
    purple=[(index%w,index//w) for index,rgb in enumerate(pixels) if rgb[2]>150 and rgb[2]-rgb[0]>55 and rgb[2]-rgb[1]>50]
    purple_bottom=max((y for x,y in purple),default=None)
    if w==412 and h==484 and purple_bottom is not None:assert purple_bottom<=410,(p.name,purple_bottom)
    checks.append({'file':p.name,'bright_pixels':bright,'outside_round_bright':outside,'purple_bottom':purple_bottom,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})

navigation=[]
hierarchy_count=0
for p in pages:
    xml=p.with_suffix('.xml')
    assert xml.exists() and xml.stat().st_size>100,('Missing original hierarchy',p.name)
    tree=ET.parse(xml).getroot()
    packages={value for node in tree.iter('node') if (value:=node.get('package'))}
    assert packages,('Empty hierarchy',p.name)
    hierarchy_count+=1
    if any(k in p.name for k in ['picker','preview','confirm','keyboard-visible','import.png']):continue
    im=Image.open(p).convert('RGB');assert im.size==(1080,1920)
    ys=[]
    for y in range(60,1840):
        rgb=cast(tuple[int,int,int],im.getpixel((1,y)))
        if max(abs(rgb[i]-(21,26,35)[i]) for i in range(3))<=2:ys.append(y)
    runs=[]
    for y in ys:
        if not runs or y>runs[-1][1]+1:runs.append([y,y])
        else:runs[-1][1]=y
    candidates=[r for r in runs if r[1]-r[0]>=180]
    assert len(candidates)==1,('Missing/ambiguous navigation',p.name,runs)
    top,bottom=candidates[0];state=json.loads(p.with_name(p.stem+'-state.json').read_text())
    navigation.append({'file':p.name,'top':top,'bottom':bottom,'ime_visible':state['imeVisible']})
assert navigation
for ime in [False,True]:
    group=[r for r in navigation if r['ime_visible']==ime]
    if group:assert len({(r['top'],r['bottom']) for r in group})==1,group
assert len({r['bottom']-r['top'] for r in navigation})==1,navigation
assert all(r['bottom']<1500 if r['ime_visible'] else r['bottom']>1700 for r in navigation),navigation
report={'pixel_checks_passed':True,'phone_input':str(phone),'watch_input':str(watch),'phone_raw_states':len(pages),'phone_hierarchies':hierarchy_count,'watch_raw_states':len(checks),'watch_pixel_checks':checks,'phone_navigation_bounds':navigation,'phone_sheets':phone_sheets,'watch_sheets':watch_sheets,'manual_review_status':'PENDING: galleries are inputs, not evidence of having viewed them','missing_expected_phone_xml':False}
(out/'pixel-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'phone_states':len(pages),'watch_states':len(checks),'pixel_pass':True,'phone_sheets':phone_sheets,'watch_sheet_count':len(watch_sheets),'output':str(out)},ensure_ascii=False))
