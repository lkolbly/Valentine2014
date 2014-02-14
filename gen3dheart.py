import math

def heart_fn(t):
    r = 2.0 - 2.0*math.sin(t) + math.sin(t) * math.sqrt(abs(math.cos(t)))/(math.sin(t)+1.4)
    return (r*math.cos(t), r*math.sin(t))

SCALE = (0.9,1.0,0.5)

def scale(v):
    return (v[0]*SCALE[0], v[1]*SCALE[1], v[2]*SCALE[2])

STEPS = 52
PI = 3.14159265

verts = []
faces = []

# Do it a first time
hp = heart_fn(2.0*PI*0/STEPS - PI)
v1 = scale((hp[0],hp[1], 0.5))
v2 = scale((hp[0],hp[1], -0.5))
verts.append(v1)
verts.append(v2)

for i in range(STEPS):
    hp = heart_fn(2.0*PI*(i+1)/STEPS - PI)
    v1 = scale((hp[0],hp[1], 0.5))
    v2 = scale((hp[0],hp[1], -0.5))
    verts.append(v1)
    verts.append(v2)

    nvs = len(verts);
    faces.append([nvs-2, nvs-3, nvs-1, nvs])

bigface = []
bigface2 = []
for i in range(STEPS):
    bigface.append(i*2+1)
    bigface2.append(i*2+2)
    pass
faces.append(bigface)
faces.append(bigface2)

# Print out our findings
print "mtllib heart.mtl"
print "o heart.009"
for v in verts:
    print "v %f %f %f"%v
for f in faces:
    print "f ",
    for i in f:
        print i,
    print
