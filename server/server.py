import tornado.ioloop
import tornado.web
import json
import Image
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
        out.save("image.png")
        url = ""
        for i in range(15):
            url += random.choice("abcdefghijklmnopqrstuvwxyz")
        k = S3Key(s3_Bucket)
        k.key = "valentines-2014/"+url+".png"
        k.set_contents_from_filename("image.png")
        self.write(self.request.body+" "+url)
        pass

application = tornado.web.Application([
    (r"/", MainHandler),
    (r"/image", ImageHandler),
])

if __name__ == "__main__":
    application.listen(1414)
    tornado.ioloop.IOLoop.instance().start()
