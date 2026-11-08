#!/usr/bin/env python3
"""Импорт старого объекта (SIMPL Windows + iRidium) в модель проекта.

    python3 -I model/legacy/import_sosny.py ap3.smw cp3.smw <scripts iRidium phone> <scripts iRidium tablet> > model/objects/sosny.json

Что делается автоматически: нагрузки света, моторы штор, климатические контуры, датчики
присутствия и охраны, клавишные панели — из сигналов SIMPL; русские имена и то, что жилец видел
в интерфейсе, — из скриптов iRidium. Что сделано руками (это и есть работа техника в редакторе):
реестр помещений с кодами электропроекта, зоны, медиа-граф.
"""
import json, re, sys, glob, collections

ap_path, cp_path, *ui_dirs = sys.argv[1:]

def load_smw(p):
    txt = open(p, encoding='latin-1').read()
    out = []
    for blk in re.findall(r'\[\n(.*?)\n\]', txt, re.S):
        o = {}
        for line in blk.split('\n'):
            if '=' in line:
                k, v = line.split('=', 1); o[k] = v
        out.append(o)
    return out

ap = load_smw(ap_path); cp = load_smw(cp_path)
ap_sig = [x.get('Nm', '') for x in ap if x.get('ObjTp') == 'Sg']
cp_sig = [x.get('Nm', '') for x in cp if x.get('ObjTp') == 'Sg']
ap_set = set(ap_sig)

# ——— что жилец видел в интерфейсе: «имя → сигнал» из скриптов iRidium ———
ui, ui_room = {}, collections.defaultdict(set)
file_space = [('bedroom_bathroom', 'bath2b'), ('bedroombathroom', 'bath2b'), ('kids_room_bathroom', 'bath2k'), ('kidroombathroom', 'bath2k'),
              ('highfloor', 'bath3'), ('bathroom', 'bath1'), ('living', 'living'), ('kitchen', 'kitchen'), ('bedroom', 'bed'), ('kid', 'kids'),
              ('cabinet', 'cabinet'), ('workshop', 'workshop'), ('garage', 'garage'), ('stairs', 'stairs')]
for d in ui_dirs:
    for f in glob.glob(d + '/*.js'):
        t = re.sub(r'/\*.*?\*/', '', open(f, encoding='utf-8', errors='replace').read(), flags=re.S)
        t = '\n'.join(l for l in t.split('\n') if not l.strip().startswith('//'))
        for m in re.finditer(r"\{[^{}]*?\bn\s*:\s*['\"]([^'\"]+)['\"][^{}]*?\bs\s*:\s*['\"](\[[^'\"]+)['\"]", t):
            ui.setdefault(m.group(2), m.group(1))
            fs = next((sp for k, sp in file_space if k in f.split('/')[-1].lower()), None)
            if fs: ui_room[m.group(2)].add(fs)

def nice(n):
    return n[:1] + n[1:].lower() if n.isupper() else n

# ——— реестр помещений (ручная часть: так их видит электропроект и жилец) ———
floors = [
    {'id': 'f0', 'name': 'Цоколь', 'level': 0},
    {'id': 'f1', 'name': '1 этаж', 'level': 1},
    {'id': 'f2', 'name': '2 этаж', 'level': 2},
    {'id': 'f3', 'name': '3 этаж', 'level': 3},
    {'id': 'site', 'name': 'Участок', 'level': 99, 'outdoor': True},
]
S = lambda id, floor, name, kind, code=None, aliases=(): {k: v for k, v in dict(id=id, floor=floor, name=name, kind=kind, code=code, aliases=list(aliases) or None).items() if v}
spaces = [
    S('garage', 'f0', 'Гараж', 'garage', 'L0', ['Garage']),
    S('corridor0', 'f0', 'Коридор', 'hall', None, ['Corridor', 'Basement']),
    S('boiler', 'f0', 'Бойлерная', 'boiler', None, ['Boiler']),
    S('tech', 'f0', 'Подсобка', 'tech', None, ['Technical_room']),
    S('hallway', 'f1', 'Прихожая', 'hallway', 'L1', ['Hallway']),
    S('hall1', 'f1', 'Холл', 'hall', 'L2', ['Hall', '1st floor Hall']),
    S('living', 'f1', 'Гостиная', 'living', 'L3', ['Living_room', 'Livingroom', 'Living Room']),
    S('kitchen', 'f1', 'Кухня', 'kitchen', 'L4', ['Kitchen', 'Kitechen']),
    S('bath1', 'f1', 'Санузел', 'bath', 'L5', ['Bathroom', '1st_Bathroom']),
    S('stairs', 'f1', 'Лестница', 'stairs', None, ['Stairs']),
    S('bed', 'f2', 'Спальня', 'bedroom', 'L6', ['Bedroom']),
    S('kids', 'f2', 'Детская', 'kids', 'L7', ['Kids_room', 'Kids_toom']),
    S('bath2b', 'f2', 'Санузел спальни', 'bath', 'L8', ['Bedroom_bathroom']),
    S('bath2k', 'f2', 'Санузел детской', 'bath', 'L9', ['Kids_room_bathroom']),
    S('hall2', 'f2', 'Холл 2 этажа', 'hall', 'L10'),
    S('cabinet', 'f3', 'Кабинет', 'office', 'L11', ['Cabinet', 'Kabinet']),
    S('hall3', 'f3', 'Холл 3 этажа', 'hall', 'L12'),
    S('bath3', 'f3', 'Санузел 3 этажа', 'bath', 'L13', ['3rd_floor_Bathroom', 'Highfloor_Bathroom']),
    S('workshop', 'f3', 'Мастерская', 'workshop', 'L14', ['Workshop', '1st_level']),
    S('balcony', 'f3', 'Балкон', 'balcony', 'L15', ['Balcony']),
    S('entrance', 'site', 'Вход и ворота', 'outdoor', None, ['Entrance', 'House entrance', 'Vorota']),
]
by_num = {1: 'hallway', 2: 'hall1', 3: 'living', 4: 'kitchen', 5: 'bath1', 6: 'bed', 7: 'kids', 8: 'bath2b', 9: 'bath2k',
          10: 'hall2', 11: 'cabinet', 12: 'hall3', 13: 'bath3', 14: 'workshop', 15: 'balcony'}
by_l0 = {'L0-1': 'garage', 'L0-2': 'corridor0', 'L0-3': 'boiler', 'L0-4': 'tech', 'Ll1': 'stairs', 'Ll2': 'stairs', 'Ll3': 'cabinet'}
token_space = {'Garage': 'garage', 'Corridor': 'corridor0', 'Boiler': 'boiler', 'Technical_room': 'tech', 'Stairs': 'stairs',
               'Hallway': 'hallway', 'Living_room': 'living', 'Livingroom': 'living', 'Kitchen': 'kitchen', 'Bedroom': 'bed',
               'Kids_room': 'kids', 'Bedroom_bathroom': 'bath2b', 'Bedroom_Bathroom': 'bath2b', 'Kids_room_bathroom': 'bath2k',
               'Kids_room_Bathroom': 'bath2k', 'Cabinet': 'cabinet', 'Workshop': 'workshop', '1st_level': 'workshop',
               'Balcony': 'balcony', 'Entrance': 'entrance', 'Basement': 'corridor0', 'Stairs_1st_floor': 'stairs',
               'Stairs_2nd_floor': 'stairs', 'Stairs_3rd_floor': 'stairs', '3rd_floor_Bathroom': 'bath3', '3rd_floor_bathroom': 'bath3',
               '2nd_floor_Bathrooms': 'bath2b', '2nd_floor_stairs': 'stairs', '3rd_floor_stairs': 'stairs', 'Hall': 'hall1', 'Bathroom': 'bath1'}

def code_space(code):
    if code in by_l0: return by_l0[code]
    m = re.match(r'[LS](\d+)', code)
    return by_num.get(int(m.group(1))) if m else None

devices, notes, zone_include, swapped = [], [], collections.defaultdict(list), set()
used = set()
def dev(**d):
    base = d['id']; n = 2
    while d['id'] in used: d['id'] = f'{base}-{n}'; n += 1
    used.add(d['id'])
    devices.append({k: v for k, v in d.items() if v not in (None, [], {})})
    return d['id']

# ——— свет: одна запись на контур электропроекта ———
role_of = {'Luster': 'main', 'Ceiling': 'main', 'Lamp': 'main', 'Spot': 'spot', 'LED': 'accent', 'Stained_glass': 'accent',
           'Pillars': 'accent', 'Built-in': 'accent', 'Bra': 'sconce', 'Bra_mirror': 'mirror', 'Mirror': 'mirror',
           'Outlet': 'outlet', 'Balcony': 'main'}
name_of = {'main': 'Свет', 'spot': 'Споты', 'accent': 'Подсветка', 'sconce': 'Бра', 'mirror': 'Зеркало', 'outlet': 'Розетка'}
slug = {'main': 'main', 'spot': 'spot', 'accent': 'accent', 'sconce': 'sconce', 'mirror': 'mirror', 'outlet': 'outlet'}
loads = collections.OrderedDict()
for s in ap_sig:
    m = re.match(r'(\[Light\]\[([^\]]+)\]([A-Za-z_-]+)\[(L[l\d][\d/-]*)\])', s)
    if m and m.group(1) not in [x[2] for x in loads.get(m.group(4), [])]:
        loads.setdefault(m.group(4), []).append((m.group(2), m.group(3), m.group(1)))
def code_key(c):
    return [int(x) if x.isdigit() else 0 for x in re.split(r'[^\d]+', c) if x != ''] or [99]
for code in sorted(loads, key=code_key):
    sigs = loads[code]
    if '/' in code and re.match(r'L\d+-\d+/\d+-\d+', code):
        notes.append(f'Свет {code}: групповой сигнал двух бра в SIMPL — в модели группа выводится сама, отдельного устройства нет'); continue
    space = code_space(code)
    shown = [x for x in sigs if x[2] in ui]
    tok, kind, sig = (shown or sigs)[0]
    role = role_of.get(kind, 'main')
    name = nice(ui[sig]) if sig in ui else name_of[role]
    dimmer = any(f'{x[2]}[Level][0-100]*in' in ap_set or f'{x[2]}[Level]' in ap_set for x in sigs)
    did = dev(id=f'{space}.{slug[role]}', type='light.dimmer' if dimmer else 'light.switch', space=space, name=name, role=role, code=code,
              bind={'driver': 'crestron', 'controller': 'ap3', 'signal': sig},
              flags=None if shown else {'serviceOnly': 'не было в интерфейсе жильца'}, legacy=[x[2] for x in sigs])
    # где жилец видел этот светильник: страница какой комнаты в старом интерфейсе
    for ts in {r for x in sigs for r in ui_room.get(x[2], ())}:
        if {ts, space} == {'bath2b', 'bath2k'}:
            swapped.add(code); continue
        if ts != space and not (ts == 'garage' and space in ('corridor0', 'boiler', 'tech')):
            zone_include[ts].append(did)
    if len({k for _, k, _ in sigs}) > 1:
        notes.append(f'Свет {code}: в SIMPL под разными именами ({", ".join(sorted({t + "/" + k for t, k, _ in sigs}))}) — одно устройство')

# ——— шторы ———
for s in sorted({m.group(0) for m in (re.match(r'\[Shade\]\[[^\]]+\]S\d+-\d+', x) for x in ap_sig) if m}):
    tok, code = re.match(r'\[Shade\]\[([^\]]+)\](S\d+-\d+)', s).groups()
    space = code_space(code)
    nm = ui.get(s) or ui.get(f'[Shade][{tok}]All') or 'Штора'
    dev(id=f'{space}.shade', type='shade.motor', space=space, name=nice(nm), code=code,
        bind={'driver': 'crestron', 'controller': 'ap3', 'signal': s},
        flags=None if (s in ui or f'[Shade][{tok}]All' in ui) else {'serviceOnly': 'не было в интерфейсе жильца'})
if swapped:
    notes.append(f'ПРОВЕРИТЬ НА ОБЪЕКТЕ: санузлы 2 этажа перепутаны — в SIMPL контуры {", ".join(sorted(swapped))} числятся в одном санузле, '
                 'а в интерфейсе показывались на странице другого. В модели оставлены по электропроекту')
notes.append('Шторы: групповые сигналы All/Both из SIMPL не перенесены — «открыть все» выводится из зоны')

# ——— климат: контуры пола, радиаторы, вытяжки ———
ctype = {'Floor': ('climate.floor', 'Тёплый пол', 'floor'), 'Heater': ('climate.radiator', 'Радиатор', 'radiator'), 'Fan': ('vent.fan', 'Вытяжка', 'fan')}
seen = set()
for s in ap_sig:
    m = re.match(r'\[Climate\]\[([^\]]+)\](Floor|Heater|Fan)', s)
    if not m: continue
    tok, kind = m.groups(); key = (tok.lower(), kind)
    if key in seen: continue
    seen.add(key)
    space = token_space[tok]
    sig = f'[Climate][{tok}]{kind}'
    typ, nm, sl = ctype[kind]
    if 'stairs' in tok: nm = f'{nm} · {tok[0]} этаж'
    vis = sig in ui
    did = dev(id=f'{space}.{sl}', type=typ, space=space, name=nm, bind={'driver': 'crestron', 'controller': 'ap3', 'signal': sig},
              flags=None if vis else {'hidden': 'не было в интерфейсе жильца'})
    if tok == '2nd_floor_Bathrooms':
        zone_include['bath2k'].append(did)
        notes.append('Климат: один контур пола на оба санузла 2 этажа — устройство в санузле спальни, показывается и в санузле детской')
for sp in ['bed', 'kids', 'cabinet', 'workshop']:
    dev(id=f'{sp}.ac', type='climate.ac', space=sp, name='Кондиционер', bind={'driver': 'coolmaster', 'unit': sp})
dev(id='tech.vent1', type='vent.unit', space='tech', scope='house', name='Приточная установка 1', bind={'driver': 'modbus', 'unit': 'Lessar 1200 / Segnetics 103'})
dev(id='tech.vent2', type='vent.unit', space='tech', scope='house', name='Приточная установка 2', bind={'driver': 'modbus', 'unit': 'Lessar 700 / Segnetics 104'})

# ——— клавишные панели и датчики присутствия ———
loc_space = {'1st floor Hall': 'hall1', '1st floor Living Room': 'living', '1st floor Kitchen': 'kitchen', '2nd floor Bedroom': 'bed',
             '2n floor Bedroom': 'bed', '2nd floor Kids room': 'kids', '3rd floor Cabinet': 'cabinet', '3rd floor 1st level': 'workshop',
             'Garage': 'garage', 'Garage stairs': 'stairs', 'House entrance': 'entrance', '1st floor hall': 'hall1',
             '1st floor bathroom': 'bath1', '2nd floor hall': 'hall2', '3rd floor hall': 'hall3', None: 'corridor0'}
for d in ap:
    if d.get('ObjTp') != 'Dv' or ' #' not in d.get('Nm', ''): continue
    if d['Nm'].startswith('C2NI-CB'):
        sp = loc_space[d.get('Loc')]
        dev(id=f'{sp}.keypad', type='keypad', space=sp, name='Клавишная панель', bind={'driver': 'crestron', 'cresnet': d.get('Ad'), 'model': 'C2NI-CB'})
    if d['Nm'].startswith('GLS-OIR'):
        sp = loc_space[d.get('Loc')]
        dev(id=f'{sp}.occupancy', type='sensor.occupancy', space=sp, name='Датчик присутствия', bind={'driver': 'crestron', 'cresnet': d.get('Ad'), 'model': 'GLS-OIR-C-CN'})

# ——— охрана ———
sec_name = {'Movement': 'Движение', 'Break': 'Разбитие стекла', 'Door': 'Дверь', 'Window': 'Окно', 'Fire': 'Дым', 'Leak': 'Протечка', 'Gas': 'Газ', 'CO': 'CO'}
sec_parts = {'Movement': ['full'], 'Break': ['full'], 'Door': ['full', 'perimeter'], 'Window': ['full', 'perimeter'], 'Fire': ['fire'], 'Gas': ['fire'], 'CO': ['fire'], 'Leak': ['leak']}
sensors = {}
for s in cp_sig:
    m = re.match(r'\[Security\]\[Jablotron\]\[Sensor\]\[ID(\d+)\](?:\[([^\]]+)\])?([A-Za-z]+)(?:_(\d+))?$', s)
    if not m: continue
    num, tok, kind, n = m.groups()
    if kind in ('Control_Panel', 'Gate'): continue
    sp = token_space.get(tok, 'hallway')
    nm = sec_name.get(kind, kind) + (f' {n}' if n else '')
    did = dev(id=f'{sp}.sec-{kind.lower()}', type='security.sensor', space=sp, name=nm, role=kind.lower(), bind={'driver': 'jablotron', 'id': int(num)})
    sensors[did] = sec_parts.get(kind, ['full'])
dev(id='hallway.alarm', type='security.panel', space='hallway', name='Охранная панель Jablotron', bind={'driver': 'jablotron', 'id': 0})
dev(id='entrance.gate', type='access.gate', space='entrance', name='Ворота', bind={'driver': 'crestron', 'controller': 'cp3', 'signal': '[Security][Jablotron]Gate'})
dev(id='entrance.barrier', type='access.gate', space='entrance', name='Шлагбаум', bind={'driver': 'crestron', 'controller': 'cp3', 'signal': '[Security][Jablotron]Barrier'})

# ——— медиа (ручная часть: граф собран по CP3 и скриптам медиа iRidium) ———
M = lambda id, type, space, name, **kw: dev(id=id, type=type, space=space, name=name, **kw)
src = [M('tech.atv1', 'av.source', 'tech', 'Apple TV 1', bind={'driver': 'appletv'}), M('tech.atv2', 'av.source', 'tech', 'Apple TV 2', bind={'driver': 'appletv'}),
       M('tech.kodi1', 'av.source', 'tech', 'Kodi 1', bind={'driver': 'kodi'}), M('tech.kodi2', 'av.source', 'tech', 'Kodi 2', bind={'driver': 'kodi'})]
matrix = M('tech.matrix', 'av.matrix', 'tech', 'HDMI-матрица WyreStorm', bind={'driver': 'wyrestorm'})
M('tech.amp', 'av.receiver', 'tech', 'Усилитель мультирума 6×100', bind={'driver': 'crestron', 'controller': 'cp3', 'model': 'C2N-AMP-6x100'})
pj = M('living.projector', 'av.projector', 'living', 'Проектор', bind={'driver': 'jvc'})
scr = M('living.screen', 'av.screen', 'living', 'Экран и лифт проектора', bind={'driver': 'crestron', 'controller': 'cp3', 'signal': '[Media][Projector]'})
avr = M('living.avr', 'av.receiver', 'living', 'Ресивер Yamaha RX-A3010', bind={'driver': 'yamaha'})
tvs = {sp: M(f'{sp}.tv', 'av.tv', sp, 'Телевизор', bind={'driver': 'ir', 'profile': 'Samsung Modern'},
             flags=None if sp != 'kids' else {'hidden': 'в старом интерфейсе не было — только ИК-пульт'}) for sp in ['living', 'kitchen', 'bed', 'kids']}
audio = {sp: M(f'{sp}.audio', 'av.audiozone', sp, 'Музыка', bind={'driver': 'musiccast' if sp in ('living', 'kitchen', 'bed') else 'crestron-amp'})
         for sp in ['living', 'kitchen', 'bath1', 'bed', 'bath2b', 'bath3']}
mz = [{'id': 'mz-cinema', 'name': 'Кинотеатр', 'space': 'living', 'sinks': [pj, scr, avr], 'sources': [src[0], src[2]]},
      {'id': 'mz-living', 'name': 'Гостиная', 'space': 'living', 'sinks': [tvs['living'], audio['living']], 'sources': [src[1], src[3]]}]
mz += [{'id': f'mz-{sp}', 'name': next(x['name'] for x in spaces if x['id'] == sp), 'space': sp,
        'sinks': [x for x in [tvs.get(sp), audio.get(sp)] if x], 'sources': src if sp in tvs else []}
       for sp in ['kitchen', 'bed', 'kids', 'bath1', 'bath2b', 'bath3']]

# ——— зоны: только отличия от «помещение = комната» ———
zones = [
    {'id': 'z-basement', 'name': 'Цоколь', 'spaces': ['garage', 'corridor0', 'boiler', 'tech'], 'kind': 'room', 'floor': 'f0'},
    {'id': 'z-workshop', 'name': 'Мастерская', 'spaces': ['workshop', 'balcony'], 'kind': 'room'},
    {'id': 'z-baths', 'name': 'Все санузлы', 'spaces': ['bath1', 'bath2b', 'bath2k', 'bath3'], 'kind': 'group'},
]
for sp, ids in zone_include.items():
    z = next((z for z in zones if sp in z['spaces'] and z['kind'] == 'room'), None)
    if not z:
        z = {'id': f'z-{sp}', 'name': next(x['name'] for x in spaces if x['id'] == sp), 'spaces': [sp], 'kind': 'room'}; zones.append(z)
    z['include'] = sorted(set(z.get('include', []) + ids))
    notes.append(f'Зона «{z["name"]}»: добавлены устройства из соседних помещений — {", ".join(z["include"])}')

scenes = [{'id': f'scene-{k.lower()}', 'name': n, 'scope': 'house', 'bind': {'driver': 'crestron', 'controller': 'ap3', 'signal': f'[Scene]{k}'}}
          for k, n in [('Day', 'День'), ('Comfort', 'Комфорт'), ('Cozy', 'Уют'), ('Friends', 'Гости'), ('Night', 'Ночь'), ('Leaving', 'Ухожу')]]
scenes += [{'id': f'scene-{k.lower().replace("_", "")}', 'name': k, 'scope': 'house', 'flags': {'hidden': 'в старом интерфейсе не использовалась'},
            'bind': {'driver': 'crestron', 'controller': 'ap3', 'signal': f'[Scene]{k}'}} for k in ['Home', 'Scene_1', 'Scene_2', 'Scene_3']]

project = {
    'schema': 1,
    'site': {'id': 'sosny', 'name': 'Дом с проектором'},
    'floors': floors, 'spaces': spaces, 'zones': zones, 'devices': devices,
    'media': {'matrix': matrix, 'sources': src, 'zones': mz},
    'security': {'partitions': [{'id': 'full', 'name': 'Весь дом'}, {'id': 'perimeter', 'name': 'Двери и окна'},
                                {'id': 'fire', 'name': 'Пожар и газ'}, {'id': 'leak', 'name': 'Протечка'}], 'sensors': sensors},
    'scenes': scenes,
    'notes': notes,
}
json.dump(project, sys.stdout, ensure_ascii=False, indent=1)
