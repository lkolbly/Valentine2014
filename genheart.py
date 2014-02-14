import math

def heart_fn(t):
    r = 2.0 - 2.0*math.sin(t) + math.sin(t) * math.sqrt(abs(math.cos(t)))/(math.sin(t)+1.4)
    return (r*math.cos(t), r*math.sin(t))

STEPS = 52
PI = 3.14159265

for i in range(STEPS):
    pnt = heart_fn(2.0*PI*(i+1)/STEPS)
    print int(pnt[0]*100),
    print int(pnt[1]*100)
