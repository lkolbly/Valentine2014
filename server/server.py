import tornado.ioloop
import tornado.web
import json
import Image, ImageDraw
import random
from boto.s3.connection import S3Connection
from boto.s3.key import Key as S3Key

aws_creds = json.loads(open("aws.config.json").read())
s3_Conn = S3Connection(aws_creds["accessKeyId"], aws_creds["secretAccessKey"])
s3_Bucket = s3_Conn.get_bucket("pillow.rscheme.org")

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")

class ImageHandler(tornado.web.RequestHandler):
    def get(self):
        self.write(open("image.png").read())

    def post(self):
        d = json.loads(self.request.body)
        out = Image.new("RGB", (512, 512), "white")

        # Pull all the points into two-space
        pnts = []
        for p in d["points"]:
            pnts.append((p["x"], p["y"]))

        # Render the image
        imdraw = ImageDraw.Draw(out)
        for i in xrange(len(pnts)-1):
            imdraw.line(pnts[i]+pnts[i+1], fill=128)
            pass

        out.save("image.png")
        url = ""
        for i in range(15):
            url += random.choice("abcdefghijklmnopqrstuvwxyz")
        k = S3Key(s3_Bucket)
        k.key = "valentines-2014/"+url+".png"
        k.set_contents_from_filename("image.png")
        self.add_header("Access-Control-Allow-Origin", "*");
        self.write(url)
	self.finish()
        print url
        pass

application = tornado.web.Application([
    (r"/", MainHandler),
    (r"/image", ImageHandler),
])

if __name__ == "__main__":
    application.listen(1414)
    tornado.ioloop.IOLoop.instance().start()
