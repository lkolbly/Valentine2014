import json

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
            verts.append({"x": p[0], "y": p[1], "z": z})
            z += 10
        return verts

letters = {}
for c in "abcdefghijklmnopqrstuvwxyz":
    try:
        l = Letter(open("letters/"+c).read())
        letters[c] = l.to3d()
    except:
        print "Couldn't load letter "+c

open("letters.js", "w").write("var letter_Definitions = "+json.dumps(letters)+";")
