js-hqx
==========

#### hqx Pixel Art Scaling Algorithm for JavaScript/Canvas ####

This project is a direct port of the C source code for the [hqx scaling algorithm](http://en.wikipedia.org/wiki/Hqx). It uses the HTML5 Canvas element to get an manipulate pixel data of an image.

The source is unoptimized and probably many times slower than it could be. RGBA components are first packed into integers processed by hqx and then unpacked again. The source is pretty large (~400kb), because all 3 hqx scaling algorithms are included, but it can be gzipped quite well (~27kb).

Some basic support for alpha transparency has been added.


### Demo ###

[Simple Test Image](http://www.phoboslab.org/files/js-hqx/)

[Biolab Disaster Scaled With hqx](http://playbiolab.com/hqx.php)



### Usage ###

	var scaledCanvas = hqx( originalImage, 3 );
	
The second argument is the scaling factor. hqx supports 2, 3 and 4. See test.html for an example.