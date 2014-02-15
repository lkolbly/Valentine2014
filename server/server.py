import tornado.ioloop
import tornado.web
import json
import Image, ImageDraw
import random
from boto.s3.connection import S3Connection
from boto.s3.key import Key as S3Key
import tornado.gen
import tornado.httpclient
import boto.ses
import pybars

aws_creds = json.loads(open("aws.config.json").read())
s3_Conn = S3Connection(aws_creds["accessKeyId"], aws_creds["secretAccessKey"])
s3_Bucket = s3_Conn.get_bucket("pillow.rscheme.org")

ses_Conn = boto.ses.connect_to_region("us-east-1", aws_access_key_id=aws_creds["accessKeyId"], aws_secret_access_key=aws_creds["secretAccessKey"])
#ses_Conn.send_email("lane@rscheme.org", "I <3 U", "This is a body!", ["lane@rscheme.org"])

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")

def scale(v, a, b, A, B):
    return (v-a)/(b-a) * (B-A) + A

class ImageHandler(tornado.web.RequestHandler):
    def get(self):
        self.write(open("image.png").read())

    def post(self):
        d = json.loads(self.request.body)
        IMG_SIZE = (512,512)
        out = Image.new("RGB", IMG_SIZE, "white")

        # Pull all the points into two-space
        pnts = []
        for p in d["points"]:
            #print p
            pnts.append((float(-p["z"]), float(-p["y"])))

        # Find the extrema of the points
        min_pnt = [pnts[0][0], pnts[0][1]]
        max_pnt = [pnts[0][0], pnts[0][1]]
        for p in pnts:
            if p[0] < min_pnt[0]:
                min_pnt[0] = p[0]
            if p[0] > max_pnt[0]:
                max_pnt[0] = p[0]
            if p[1] < min_pnt[1]:
                min_pnt[1] = p[1]
            if p[1] > max_pnt[1]:
                max_pnt[1] = p[1]
        min_pnt[0] -= 1
        min_pnt[1] -= 1
        max_pnt[0] += 1
        max_pnt[1] += 1

        # Compute the offset & scale factor
        """offset = [0,0]#min_pnt
        scale = [float(max_pnt[0]-min_pnt[0])/512.0,
                 float(max_pnt[0]-min_pnt[0])/512.0]"""

        # Apply said transform
        """print offset
        print scale"""
        for i in range(len(pnts)):
            pnts[i] = (scale(pnts[i][0], min_pnt[0], max_pnt[0], 0, 512),
                       scale(pnts[i][1], min_pnt[1], max_pnt[1], 0, 512))

        # Render the image
        imdraw = ImageDraw.Draw(out)
        for i in xrange(len(pnts)-1):
            imdraw.line(pnts[i]+pnts[i+1], fill=255)
            #print pnts[i], pnts[i+1]
            pass

        out.save("image.png")
        url = ""
        for i in range(15):
            url += random.choice("0123456789abcdef")
        #open("body_"+url, "w").write(self.request.body)
        k = S3Key(s3_Bucket)
        k.key = "valentines-2014/"+url+".png"
        k.set_contents_from_filename("image.png")
        self.add_header("Access-Control-Allow-Origin", "*");
        self.write(url)
	self.finish()
        print url
        pass

class EmailHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):
        self.add_header("Access-Control-Allow-Origin", "*");
        d = json.loads(self.request.body)
        captcha_token = d["captcha_token"]
        http_client = tornado.httpclient.AsyncHTTPClient()
        captcha_response = yield http_client.fetch("http://pillow.rscheme.org/captcha/verify.php?token=%s"%captcha_token)

        if captcha_response.body == "no":
            self.write("INVALID CAPTCHA")
            return

        to_email = d["to_email"]
        img_hash = d["img_hash"]
        #open("tmp/email_%s"+img_hash, "w").write(self.request.body)
        race_duration = d["time"]
        from_name = d["fullname"]
        to_name = d["toname"]
        message = d["message"]
        compiler = pybars.Compiler()

        source = unicode(open("text-email.hbs").read())
        text_body = str("".join(compiler.compile(source)(d)))
        #text_body = ""

        source = unicode(open("html-email.hbs").read())
        #print source
        html_body2 = compiler.compile(source)
        html_body = str("".join(html_body2(d)))

        #text_body = "Dear %s,\n\nI made this picture in %s seconds! http://pillow.rscheme.org.s3-website-us-east-1.amazonaws.com/valentines-2014/%s.png\n\nWith love,\n%s"%(to_name, race_duration, img_hash, from_name)
        #html_body = "<html><body>%s <img src='http://pillow.rscheme.org.s3-website-us-east-1.amazonaws.com/valentines-2014/%s.png'></img></body></html>"%(text_body, img_hash)
        #print html_body
        ses_Conn.send_email("pillow.computing.consortium@gmail.com", "With <3", None, [to_email], html_body=html_body, text_body=text_body)
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
