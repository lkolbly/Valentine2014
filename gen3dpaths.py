import json, math

def dist(v1, v2):
    dx = v2["x"] - v1["x"]
    dy = v2["y"] - v1["y"]
    dz = v2["z"] - v1["z"]
    return math.sqrt(dx*dx+dy*dy+dz*dz)

def halfway(v1, v2):
    return {"x": (v2["x"]+v1["x"])/2.0,
            "y": (v2["y"]+v1["y"])/2.0,
            "z": (v2["z"]+v1["z"])/2.0}

class Letter:
    def __init__(self, s):
        self.points = []
        for line in s.split("\n"):
            if len(line) == 0:
                continue
            if line[0] == '#':
                continue
            p = line.split(" ")
            p = [int(p[0]), int(p[1])]
            self.points.append(p)

        # Subtract the base point from all of them
        for i in range(len(self.points)-1):
            self.points[i+1][0] -= self.points[0][0]
            self.points[i+1][1] -= self.points[0][1]
        self.points[0] = [0,0]

    def to3d(self):
        verts = []
        z = 0
        for p in self.points:
            v = {"x": p[0], "y": p[1], "z": z}
            verts.append(v)
            z += 10
        i = 1
        while i < len(verts):
            print i, verts[i-1], verts[i], dist(verts[i-1], verts[i])
            if dist(verts[i-1], verts[i]) > 50:
                newv = halfway(verts[i-1], verts[i])
                print "Inserting new vert %s at %s"%(newv, i)
                verts.insert(i, newv)
            else:
                i+=1
            pass
        return verts

"""l = Letter("1 1\n2 2\n100 100")
print l.to3d()
import sys
sys.exit(0)"""

letters = {}
for c in "abcdefghijklmnopqrstuvwxyz":
    try:
        l = Letter(open("letters/"+c).read())
        letters[c] = l.to3d()
    except:
        print "Couldn't load letter "+c

l = Letter(open("letters/heart").read())
letters["heart"] = l.to3d()
for p in letters["heart"]:
    p["y"] = -p["y"]

# For the heart, we also need to rotate the points ~45 degrees (1/8th around)
new_pnts = []
z = 0
offset = len(letters["heart"])/8
for i in range(len(letters["heart"])):
    new_i = (i-offset)%len(letters["heart"])
    print new_i, i
    new_pnts.append(letters["heart"][new_i])
    #new_pnts[len(new_pnts)-1]["x"] -= space_offset["x"]
    #new_pnts[len(new_pnts)-1]["y"] -= space_offset["y"]
    new_pnts[len(new_pnts)-1]["z"] = z
    z += 10

# Now re-adjust everything so the heart's first point is at (0,0,0)
offset = {"x": new_pnts[0]["x"], "y": new_pnts[0]["y"]}
for i in range(len(new_pnts)):
    new_pnts[i]["x"] -= offset["x"]
    new_pnts[i]["y"] -= offset["y"]
    pass

letters["heart"] = new_pnts
f = open("tmp", "w")
for p in new_pnts:
    f.write("%s %s\n"%(p["x"], -p["y"]))

open("letters.js", "w").write("var letter_Definitions = "+json.dumps(letters)+";")
