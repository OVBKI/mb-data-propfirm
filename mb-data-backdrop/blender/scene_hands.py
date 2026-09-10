"""scene_hands.py — le hero « Cathédrale » : deux mains de bronze (modèle libhand,
CC-BY 3.0) qui s'élèvent et se referment doucement autour de la pièce gravée
Quantara, laquelle tourne et flotte légèrement. Boucle parfaite sur T images.
Usage : python3 scene_hands.py -- --frame N [--to M] --total T --out frame_XXXX.png [--samples S --w W --h H --threads K]"""
import bpy, math, sys, argparse, os
from mathutils import Vector
ap=argparse.ArgumentParser(); ap.add_argument("--frame",type=int,default=0); ap.add_argument("--to",type=int,default=None); ap.add_argument("--total",type=int,default=150)
ap.add_argument("--out",required=True); ap.add_argument("--samples",type=int,default=64); ap.add_argument("--w",type=int,default=1536); ap.add_argument("--h",type=int,default=691); ap.add_argument("--threads",type=int,default=0)
ap.add_argument("--open",type=float,default=1.0)   # facteur d'ouverture des mains (test de composition)
A=ap.parse_args(sys.argv[sys.argv.index("--")+1:])
HERE=os.path.dirname(os.path.abspath(__file__))
BLEND=os.path.join(HERE,"libhand","hand_model","blender","hand.blend")
MASK=os.path.join(HERE,"logo_mask.png")

bpy.ops.wm.read_factory_settings(use_empty=True); sc=bpy.context.scene
sc.render.engine="CYCLES"; sc.cycles.device="CPU"; sc.cycles.samples=A.samples; sc.cycles.use_denoising=True
sc.render.resolution_x=A.w; sc.render.resolution_y=A.h; sc.render.film_transparent=True
sc.render.image_settings.file_format="PNG"; sc.render.image_settings.color_mode="RGBA"
if A.threads>0: sc.render.threads_mode="FIXED"; sc.render.threads=A.threads

# ── BRONZE : métal sombre, plus doré sur les bords rasants (Layer Weight), grain de fonte ──
bronze=bpy.data.materials.new("Bronze"); bronze.use_nodes=True; nt=bronze.node_tree; p=nt.nodes["Principled BSDF"]
p.inputs["Metallic"].default_value=1.0
try: p.inputs["Coat Weight"].default_value=0.25; p.inputs["Coat Roughness"].default_value=0.15
except Exception: pass
geo=nt.nodes.new("ShaderNodeLayerWeight"); geo.inputs["Blend"].default_value=0.55; ramp=nt.nodes.new("ShaderNodeValToRGB"); ramp.color_ramp.elements[0].position=0.15; ramp.color_ramp.elements[1].position=0.85
ramp.color_ramp.elements[0].color=(0.30,0.18,0.08,1); ramp.color_ramp.elements[1].color=(0.78,0.56,0.26,1)
nt.links.new(geo.outputs["Facing"],ramp.inputs["Fac"]); nt.links.new(ramp.outputs["Color"],p.inputs["Base Color"])
noise=nt.nodes.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value=9; noise.inputs["Detail"].default_value=6
rr=nt.nodes.new("ShaderNodeMapRange"); rr.inputs["From Min"].default_value=0.3; rr.inputs["From Max"].default_value=0.7; rr.inputs["To Min"].default_value=0.32; rr.inputs["To Max"].default_value=0.46
nt.links.new(noise.outputs["Fac"],rr.inputs["Value"]); nt.links.new(rr.outputs["Result"],p.inputs["Roughness"])
bump=nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value=0.012; nt.links.new(noise.outputs["Fac"],bump.inputs["Height"]); nt.links.new(bump.outputs["Normal"],p.inputs["Normal"])

# ── LES DEUX MAINS ────────────────────────────────────────────────────────────
# Le modèle libhand : doigts vers -X, paume vers -Z, poignet vers +X. Chaque main
# est parentée à un pivot (Empty) qui porte placement et animation.
with bpy.data.libraries.load(BLEND) as (src,dst): dst.objects=["Armature","hand_mesh"]
def make_hand(name,mirror):
    arm=dst.objects[0].copy(); arm.data=dst.objects[0].data.copy(); mesh=dst.objects[1].copy(); mesh.data=dst.objects[1].data.copy()
    arm.name=f"Arm_{name}"; mesh.name=f"Hand_{name}"
    sc.collection.objects.link(arm); sc.collection.objects.link(mesh)
    mesh.parent=arm; mesh.modifiers["Armature"].object=arm
    mesh.data.materials.clear(); mesh.data.materials.append(bronze)
    for pg in mesh.data.polygons: pg.use_smooth=True
    piv=bpy.data.objects.new(f"Pivot_{name}",None); sc.collection.objects.link(piv); arm.parent=piv
    # Doigts ouverts et légèrement courbés (négatif = flexion vers la paume).
    for f in ("finger1","finger2","finger3","finger4","finger5"):
        for i in (1,2,3):
            pb=arm.pose.bones[f"{f}joint{i}"]; pb.rotation_mode="XYZ"
    # Doigts vers le haut. Paume vers -X : c'est la main de DROITE (B) ; la main de gauche (A) est son miroir, paume vers +X.
    arm.rotation_mode="XYZ"   # ⚠️ le fichier libhand est en QUATERNION : sans ça rotation_euler est ignoré
    arm.rotation_euler=(0,math.radians(90),0)    # +90 : doigts vers +Z (vérifié au rendu) ; la paume regarde alors -X
    if mirror: piv.scale=(-1,1,1)
    return piv
HS=1.0
pivA=make_hand("A",True); pivB=make_hand("B",False)

# ── PIÈCE gravée, entre les paumes ───────────────────────────────────────────
coin_root=bpy.data.objects.new("CoinRoot",None); sc.collection.objects.link(coin_root)
bpy.ops.mesh.primitive_cylinder_add(vertices=180,radius=1.0,depth=0.14); coin=bpy.context.object; coin.name="Coin"
b=coin.modifiers.new("Bevel","BEVEL"); b.width=0.03; b.segments=6; bpy.ops.object.shade_smooth()
img=bpy.data.images.load(MASK); tex=bpy.data.textures.new("LogoTex",type="IMAGE"); tex.image=img
bpy.ops.mesh.primitive_grid_add(x_subdivisions=600,y_subdivisions=600,size=1.62); face=bpy.context.object; face.name="Face"; face.location.z=0.0705
d=face.modifiers.new("Engrave","DISPLACE"); d.texture=tex; d.texture_coords="UV"; d.direction="Z"; d.strength=0.05; d.mid_level=0.0
bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_cylinder_add(vertices=180,radius=0.86,depth=0.4,location=(0,0,0.07)); cut=bpy.context.object; cut.hide_render=True; cut.display_type="WIRE"
bo=face.modifiers.new("Disc","BOOLEAN"); bo.operation="INTERSECT"; bo.object=cut; bo.solver="EXACT"
for o in (coin,face): o.data.materials.append(bronze)   # même matière que les mains
for o in (coin,face,cut): o.parent=coin_root
CS=0.72; coin_root.scale=(CS,CS,CS)

OPEN={"finger1":(-8,-14,-8),"finger2":(-6,-12,-8),"finger3":(-5,-12,-8),"finger4":(-8,-14,-8),"finger5":(-4,-12,-10)}
WRAP={"finger1":(-26,-30,-20),"finger2":(-24,-30,-20),"finger3":(-22,-28,-18),"finger4":(-24,-28,-18),"finger5":(-14,-22,-16)}
def ease(x): return x*x*(3-2*x)
def pose(frame):
    t=frame/A.total; w=2*math.pi*t
    # Cycle : ouvertes (t=0) → enroulées autour de la pièce (t=0.5) → ouvertes. Périodique, donc bouclable.
    close=ease(0.5-0.5*math.cos(w))
    tilt=10+7*close                    # les avant-bras se rapprochent
    lift=0.12*close                    # et montent un peu du sol
    for piv,sgn,name in ((pivA,-1,"A"),(pivB,1,"B")):
        piv.scale=(HS*(-1 if sgn<0 else 1),HS,HS)
        piv.location=(sgn*2.35,0.10,-2.95+lift)
        piv.rotation_euler=(math.radians(4),math.radians(sgn*tilt),math.radians(sgn*10))
        arm=bpy.data.objects[f"Arm_{name}"]
        for f in OPEN:
            for i in (1,2,3):
                a=OPEN[f][i-1]+(WRAP[f][i-1]-OPEN[f][i-1])*close
                arm.pose.bones[f"{f}joint{i}"].rotation_euler=(math.radians(a),0,0)
    # La pièce : vue 3/4 (lacet 38°) qui oscille de ±14°, flotte et bascule légèrement.
    coin_root.rotation_euler=(math.radians(90+4*math.sin(w+0.7)),0,math.radians(38+14*math.sin(w)))
    coin_root.location=(0,-0.45,0.42+0.10*math.sin(w+1.2)-0.06*close)
pose(A.frame)

# ── LUMIÈRE et CAMÉRA ────────────────────────────────────────────────────────
def area(n,loc,rot,e,s,c=(1,1,1)):
    bpy.ops.object.light_add(type="AREA",location=loc,rotation=rot); L=bpy.context.object; L.name=n; L.data.energy=e; L.data.size=s; L.data.color=c
area("Key",(-3.0,-4.5,4.6),(math.radians(48),0,math.radians(-33)),2200,3.0,(1.0,0.92,0.80))
area("Rim",(2.6,3.8,2.8),(math.radians(68),0,math.radians(148)),1600,2.5,(0.40,0.66,1.0))
area("Kick",(3.6,-2.4,-0.6),(math.radians(-48),0,math.radians(58)),380,1.2,(0.98,0.78,0.45))
bpy.ops.object.light_add(type="POINT",location=(0.0,1.6,1.3)); halo=bpy.context.object; halo.data.energy=260; halo.data.color=(1.0,0.72,0.35); halo.data.shadow_soft_size=0.4
w=bpy.data.worlds.new("W"); w.use_nodes=True; sc.world=w
w.node_tree.nodes["Background"].inputs["Color"].default_value=(0.02,0.03,0.06,1); w.node_tree.nodes["Background"].inputs["Strength"].default_value=0.5
bpy.ops.object.camera_add(location=(0.0,-9.0,0.35),rotation=(math.radians(86),0,0)); cam=bpy.context.object; cam.data.lens=50; sc.camera=cam

last=A.to if A.to is not None else A.frame
for f in range(A.frame,last+1):
    pose(f); out=A.out.replace("XXXX",f"{f:04d}")
    if os.path.exists(out): continue
    sc.render.filepath=out; bpy.ops.render.render(write_still=True); print("RENDU_OK",out,flush=True)
