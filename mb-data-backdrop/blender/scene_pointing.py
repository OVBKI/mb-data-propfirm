"""scene.py — la scène du hero : main-statue pointant la pièce gravée Quantara.
Usage : python3 scene.py -- --frame N --total T --out fichier.png [--samples S] [--w W --h H]
La pièce tourne d'un tour complet sur T images : l'image T est identique à
l'image 0, la boucle est parfaite. La main est immobile — une statue."""
import bpy, math, sys, argparse
from mathutils import Vector
ap=argparse.ArgumentParser(); ap.add_argument("--frame",type=int,default=0); ap.add_argument("--total",type=int,default=150)
ap.add_argument("--out",required=True); ap.add_argument("--samples",type=int,default=96); ap.add_argument("--layer",default="all"); ap.add_argument("--w",type=int,default=1280); ap.add_argument("--h",type=int,default=720); ap.add_argument("--to",type=int,default=None); ap.add_argument("--threads",type=int,default=0)
A=ap.parse_args(sys.argv[sys.argv.index("--")+1:])
import os; MASK=os.path.join(os.path.dirname(os.path.abspath(__file__)),"logo_mask.png")

bpy.ops.wm.read_factory_settings(use_empty=True); sc=bpy.context.scene
sc.render.engine="CYCLES"; sc.cycles.device="CPU"; sc.cycles.samples=A.samples; sc.cycles.use_denoising=True
sc.render.resolution_x=A.w; sc.render.resolution_y=A.h; sc.render.film_transparent=True
sc.render.image_settings.file_format="PNG"; sc.render.image_settings.color_mode="RGBA"
if A.threads>0: sc.render.threads_mode="FIXED"; sc.render.threads=A.threads
if A.layer=="coin":
    # La pièce occupe x∈[0.67,0.97], y∈[0.25,0.78] du cadre (mesuré) : on ne rend
    # que cette zone, avec marge, sans recadrer (image pleine, transparente autour).
    sc.render.use_border=True; sc.render.use_crop_to_border=False
    sc.render.border_min_x=0.62; sc.render.border_max_x=1.0; sc.render.border_min_y=0.18; sc.render.border_max_y=0.85

BUILD_HAND = A.layer != "coin"   # en mode pièce, la main (chère à remesher) n'est jamais rendue
hand=None
if BUILD_HAND:
    # ── MAIN (statue de marbre) ─────────────────────────────────────────────────
    parts=[]
    def capsule(a,b,r):
        a,b=Vector(a),Vector(b); d=b-a
        bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=r,depth=d.length,location=(a+b)/2)
        c=bpy.context.object; c.rotation_mode='QUATERNION'; c.rotation_quaternion=d.to_track_quat('Z','Y'); parts.append(c)
        for p in (a,b):
            bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,radius=r*0.96,location=p); parts.append(bpy.context.object)
    def finger(base,heading,lens,r,curls,lift=0.0):
        p=Vector(base); h=Vector(heading).normalized(); ang=lift
        for i,L in enumerate(lens):
            ang+=curls[i]; d=Vector((h.x*math.cos(ang),h.y*math.cos(ang),math.sin(ang))); q=p+d*L; capsule(p,q,r*(1-0.10*i)); p=q
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0.02,0),scale=(1.05,1.25,0.30)); palm=bpy.context.object
    bv=palm.modifiers.new("B","BEVEL"); bv.width=0.22; bv.segments=10; parts.append(palm)
    capsule((0,-0.62,0),(0,-2.6,-0.03),0.30)
    finger((0.36,0.66,0.03),(0.06,1,0),[0.50,0.38,0.30],0.15,[0.08,-0.05,-0.03])          # index tendu
    for x,s in ((0.10,1.0),(-0.14,0.94),(-0.37,0.84)): finger((x,0.60,0.0),(0,1,0),[0.42*s,0.34*s,0.27*s],0.145*s,[-0.75,-1.05,-0.9])
    finger((0.62,0.0,0.10),(0.35,1,0),[0.42,0.34],0.17,[0.10,-0.95],lift=0.30)           # pouce
    for o in parts: o.select_set(True)
    bpy.context.view_layer.objects.active=palm; bpy.ops.object.join(); hand=bpy.context.object; hand.name="Hand"
    rm=hand.modifiers.new("Voxel","REMESH"); rm.mode='VOXEL'; rm.voxel_size=0.022; rm.use_smooth_shade=True
    sm=hand.modifiers.new("Smooth","CORRECTIVE_SMOOTH"); sm.iterations=30; sm.factor=1.0
    sd=hand.modifiers.new("Subd","SUBSURF"); sd.levels=1; sd.render_levels=2
    bpy.ops.object.shade_smooth()
    # L'index est modelé le long de +Y ; on tourne la main pour qu'il pointe vers +X
    # (la droite du cadre), paume légèrement inclinée, et on la pose à gauche.
    hand.rotation_euler=(math.radians(-8),math.radians(12),math.radians(-90)); hand.location=(-1.25,0,0.30)
    marble=bpy.data.materials.new("Marble"); marble.use_nodes=True; p=marble.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value=(0.88,0.86,0.82,1); p.inputs["Roughness"].default_value=0.40
    try: p.inputs["Subsurface Weight"].default_value=0.22
    except Exception: pass
    hand.data.materials.append(marble)

# ── PIÈCE gravée, debout sur sa tranche, face à la caméra, qui tourne ────────
coin_root=bpy.data.objects.new("CoinRoot",None); sc.collection.objects.link(coin_root)
bpy.ops.mesh.primitive_cylinder_add(vertices=180,radius=1.0,depth=0.14); coin=bpy.context.object; coin.name="Coin"
b=coin.modifiers.new("Bevel","BEVEL"); b.width=0.03; b.segments=6; bpy.ops.object.shade_smooth()
img=bpy.data.images.load(MASK); tex=bpy.data.textures.new("LogoTex",type="IMAGE"); tex.image=img
bpy.ops.mesh.primitive_grid_add(x_subdivisions=600,y_subdivisions=600,size=1.62); face=bpy.context.object; face.name="Face"; face.location.z=0.0705
d=face.modifiers.new("Engrave","DISPLACE"); d.texture=tex; d.texture_coords="UV"; d.direction="Z"; d.strength=0.05; d.mid_level=0.0
bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_cylinder_add(vertices=180,radius=0.86,depth=0.4,location=(0,0,0.07)); cut=bpy.context.object; cut.hide_render=True; cut.display_type="WIRE"
bo=face.modifiers.new("Disc","BOOLEAN"); bo.operation="INTERSECT"; bo.object=cut; bo.solver="EXACT"
steel=bpy.data.materials.new("Steel"); steel.use_nodes=True; q=steel.node_tree.nodes["Principled BSDF"]
q.inputs["Base Color"].default_value=(0.30,0.46,0.74,1); q.inputs["Metallic"].default_value=1.0; q.inputs["Roughness"].default_value=0.20
for o in (coin,face): o.data.materials.append(steel)
for o in (coin,face,cut): o.parent=coin_root
# Debout (face vers -Y = vers la caméra), au bout de l'index, à l'échelle d'une pièce dans une main
coin_root.scale=(0.64,0.64,0.64); coin_root.location=(1.42,0.0,0.50)
def pose(frame):
    t=frame/A.total
    coin_root.rotation_euler=(math.radians(90),0,0)        # la face regarde -Y
    coin_root.rotation_euler.z=0.0
    coin_root.rotation_euler.y=2*math.pi*t                 # un tour complet sur la boucle
    # Léger flottement vertical, lui aussi périodique
    coin_root.location.z=0.50+0.035*math.sin(2*math.pi*t)
pose(A.frame)

# ── LUMIÈRE : clé froide, contre bleu, kicker laiton pour la tranche ─────────
def area(n,loc,rot,e,s,c=(1,1,1)):
    bpy.ops.object.light_add(type="AREA",location=loc,rotation=rot); L=bpy.context.object; L.name=n; L.data.energy=e; L.data.size=s; L.data.color=c
area("Key",(1.6,-3.2,3.4),(math.radians(48),0,math.radians(24)),1400,3.0,(1.0,0.98,0.95))
area("Rim",(-1.5,3.2,1.6),(math.radians(72),0,math.radians(-155)),650,2.5,(0.45,0.70,1.0))
area("Kick",(3.2,-1.0,-0.6),(math.radians(-60),0,math.radians(75)),260,1.2,(0.85,0.70,0.42))
w=bpy.data.worlds.new("W"); w.use_nodes=True; sc.world=w
w.node_tree.nodes["Background"].inputs["Color"].default_value=(0.02,0.03,0.06,1); w.node_tree.nodes["Background"].inputs["Strength"].default_value=0.5
bpy.ops.object.camera_add(location=(0.10,-7.2,0.85),rotation=(math.radians(87),0,math.radians(0.5))); cam=bpy.context.object; cam.data.lens=60; sc.camera=cam
# Une couche à la fois : la main coûte cher et ne bouge pas (une image),
# la pièce est petite et tourne (une image par frame). Remotion recompose.
if A.layer=="coin" and hand is not None: hand.hide_render=True
if A.layer=="hand":
    for o in (coin,face): o.hide_render=True
# Une plage d'images par processus : la scène n'est construite qu'une fois.
# --out contient XXXX, remplacé par le numéro d'image sur 4 chiffres.
last=A.to if A.to is not None else A.frame
import os
for f in range(A.frame,last+1):
    pose(f); out=A.out.replace("XXXX",f"{f:04d}")
    if os.path.exists(out): continue   # reprise après interruption
    sc.render.filepath=out; bpy.ops.render.render(write_still=True); print("RENDU_OK",out,flush=True)
