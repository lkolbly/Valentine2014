YUI=../Downloads/yuicompressor-2.4.8.jar

for f in CollapsibleLists.js Detector.js handlebars-v1.3.0.js jquery-ui-1.10.4.custom.js MTLLoader.js OBJMTLLoader.js OrbitControls.js prototype.js spin.js three.js X3DLoader.js
do
	echo $f
	java -jar $YUI js/$f > jsmin/$f
done

java -jar $YUI main.js > jsmin/main.js

for f in jquery.min.js jquery.min.map
do
	echo $f
	cp js/$f jsmin/$f
done
