import tornado.ioloop
import tornado.web
import json
import Image, ImageDraw
import random
from boto.s3.connection import S3Connection
from boto.s3.key import Key as S3Key
import boto.ses

aws_creds = json.loads(open("aws.config.json").read())
s3_Conn = S3Connection(aws_creds["accessKeyId"], aws_creds["secretAccessKey"])
s3_Bucket = s3_Conn.get_bucket("pillow.rscheme.org")

ses_Conn = boto.ses.connect_to_region("us-east-1", aws_access_key_id=aws_creds["accessKeyId"], aws_secret_access_key=aws_creds["secretAccessKey"])
#ses_Conn.send_email("lane@rscheme.org", "I <3 U", "This is a body!", ["lane@rscheme.org"])

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

class EmailHandler(tornado.web.RequestHandler):
    def post(self):
        self.add_header("Access-Control-Allow-Origin", "*");
        d = json.loads(self.request.body)
        to_email = d["to_email"]
        img_hash = d["img_hash"]
        race_duration = d["time"]
        from_name = d["fullname"]
        to_name = d["toname"]
        text_body = "Dear %s,\n\nI made this picture in %s seconds! http://pillow.rscheme.org.s3-website-us-east-1.amazonaws.com/valentines-2014/%s.png\n\nLove,\n%s"%(to_name, race_duration, img_hash, from_name)
        html_body = "<html><body>%s <img src='http://pillow.rscheme.org.s3-website-us-east-1.amazonaws.com/valentines-2014/%s.png'></img></body></html>"%(text_body, img_hash)
        ses_Conn.send_email("pillow.computing.consortium@gmail.com", "I <3 U", None, ["lane@rscheme.org"], html_body=html_body, text_body=text_body)
        self.write("OK")
        pass

application = tornado.web.Application([
    (r"/", MainHandler),
    (r"/image", ImageHandler),
    (r"/email", EmailHandler),
])

if __name__ == "__main__":
    application.listen(1414)
    tornado.ioloop.IOLoop.instance().start()
