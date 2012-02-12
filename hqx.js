// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==

/*
 * Copyright (C) 2003 Maxim Stepin ( maxst@hiend3d.com )
 *
 * Copyright (C) 2010 Cameron Zemek ( grom@zeminvaders.net )
 *
 * Copyright (C) 2010 Dominic Szablewski ( mail@phoboslab.org )
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
 */


(function(window){

var document = window.document,

	YUV1 = 0,
	YUV2 = 0,
	src = [],
	dest = [],

	MASK_2 = 0x00FF00,
	MASK_13 = 0xFF00FF,

	Ymask = 0x00FF0000,
	Umask = 0x0000FF00,
	Vmask = 0x000000FF,
	trY = 0x00300000,
	trU = 0x00000700,
	trV = 0x00000006;

// optimum Math.abs
var MathAbs = function(n) { return n < 0 ? -n : n; };

var RGBtoYUV = function( c ) {
	var r = (c & 0xFF0000) >> 16;
	var g = (c & 0x00FF00) >> 8;
	var b = c & 0x0000FF;
	return ((/*y=*/(0.299*r + 0.587*g + 0.114*b) | 0) << 16) +
		((/*u=*/((-0.169*r - 0.331*g + 0.5*b) + 128) | 0) << 8) + 
		(/*v=*/((0.5*r - 0.419*g - 0.081*b) + 128) | 0);
};

var Diff = function( w1, w2 ) {
	// Mask against RGB_MASK to discard the alpha channel
	YUV1 = RGBtoYUV(w1);
	YUV2 = RGBtoYUV(w2);
	return ( ( MathAbs((YUV1 & Ymask) - (YUV2 & Ymask)) > trY ) ||
			( MathAbs((YUV1 & Umask) - (YUV2 & Umask)) > trU ) ||
			( MathAbs((YUV1 & Vmask) - (YUV2 & Vmask)) > trV ) );
}

/* Interpolate functions */

var Interp1 = function( pc, c1, c2 ) {
    //*pc = (c1*3+c2) >> 2;
    if (c1 === c2) {
        dest[pc] = c1;
        return;
    }
    dest[pc] = ((((c1 & MASK_2) * 3 + (c2 & MASK_2)) >> 2) & MASK_2) +
        ((((c1 & MASK_13) * 3 + (c2 & MASK_13)) >> 2) & MASK_13);

	dest[pc] |= (c1 & 0xFF000000);
};

var Interp2 = function( pc, c1, c2, c3 ) {
    //*pc = (c1*2+c2+c3) >> 2;
    dest[pc] = (((((c1 & MASK_2) << 1) + (c2 & MASK_2) + (c3 & MASK_2)) >> 2) & MASK_2) +
          (((((c1 & MASK_13) << 1) + (c2 & MASK_13) + (c3 & MASK_13)) >> 2) & MASK_13);

	dest[pc] |= (c1 & 0xFF000000);
};

var Interp3 = function( pc, c1, c2 ) {
    //*pc = (c1*7+c2)/8;
    if (c1 === c2) {
        dest[pc] = c1;
        return;
    }
    dest[pc] = ((((c1 & MASK_2) * 7 + (c2 & MASK_2)) >> 3) & MASK_2) +
        ((((c1 & MASK_13) * 7 + (c2 & MASK_13)) >> 3) & MASK_13);

	dest[pc] |= (c1 & 0xFF000000);
};

var Interp4 = function( pc, c1, c2, c3 ) {
    //*pc = (c1*2+(c2+c3)*7)/16;
    dest[pc] = (((((c1 & MASK_2) << 1) + (c2 & MASK_2) * 7 + (c3 & MASK_2) * 7) >> 4) & MASK_2) +
          (((((c1 & MASK_13) << 1) + (c2 & MASK_13) * 7 + (c3 & MASK_13) * 7) >> 4) & MASK_13);

	dest[pc] |= (c1 & 0xFF000000);
};

var Interp5 = function( pc, c1, c2 ) {
    //*pc = (c1+c2) >> 1;
    if (c1 === c2) {
        dest[pc] = c1;
        return;
    }
    dest[pc] = ((((c1 & MASK_2) + (c2 & MASK_2)) >> 1) & MASK_2) +
        ((((c1 & MASK_13) + (c2 & MASK_13)) >> 1) & MASK_13);

	dest[pc] |= (c1 & 0xFF000000);
};

var Interp6 = function( pc, c1, c2, c3 ) {
    //*pc = (c1*5+c2*2+c3)/8;
    dest[pc] = ((((c1 & MASK_2) * 5 + ((c2 & MASK_2) << 1) + (c3 & MASK_2)) >> 3) & MASK_2) +
          ((((c1 & MASK_13) * 5 + ((c2 & MASK_13) << 1) + (c3 & MASK_13)) >> 3) & MASK_13);

	dest[pc] |= (c1 & 0xFF000000);
};

var Interp7 = function( pc, c1, c2, c3 ) {
    //*pc = (c1*6+c2+c3)/8;
    dest[pc] = ((((c1 & MASK_2) * 6 + (c2 & MASK_2) + (c3 & MASK_2)) >> 3) & MASK_2) +
          ((((c1 & MASK_13) * 6 + (c2 & MASK_13) + (c3 & MASK_13)) >> 3) & MASK_13);

	dest[pc] |= (c1 & 0xFF000000);
};

var Interp8 = function( pc, c1, c2 ) {
    //*pc = (c1*5+c2*3)/8;
    if (c1 === c2) {
        dest[pc] = c1;
        return;
    }
    dest[pc] = ((((c1 & MASK_2) * 5 + (c2 & MASK_2) * 3) >> 3) & MASK_2) +
          ((((c1 & MASK_13) * 5 + (c2 & MASK_13) * 3) >> 3) & MASK_13);

	dest[pc] |= (c1 & 0xFF000000);
};

var Interp9 = function( pc, c1, c2, c3 ) {
    //*pc = (c1*2+(c2+c3)*3)/8;
    dest[pc] = (((((c1 & MASK_2) << 1) + (c2 & MASK_2) * 3 + (c3 & MASK_2) * 3) >> 3) & MASK_2) +
          (((((c1 & MASK_13) << 1) + (c2 & MASK_13) * 3 + (c3 & MASK_13) * 3) >> 3) & MASK_13);

	dest[pc] |= (c1 & 0xFF000000);
};

var Interp10 = function( pc, c1, c2, c3 ) {
    //*pc = (c1*14+c2+c3)/16;
    dest[pc] = ((((c1 & MASK_2) * 14 + (c2 & MASK_2) + (c3 & MASK_2)) >> 4) & MASK_2) +
          ((((c1 & MASK_13) * 14 + (c2 & MASK_13) + (c3 & MASK_13)) >> 4) & MASK_13);

	dest[pc] |= (c1 & 0xFF000000);
};


window.hqx = function( img, scale ) {
	// We can only scale with a factor of 2, 3 or 4
	if( [2,3,4].indexOf(scale) === -1 ) {
		return img;
	}

	src = [];
	dest = [];

	var orig, origCtx, scaled;
	if (img instanceof HTMLCanvasElement){
		orig = img;
		origCtx = orig.getContext('2d');
		scaled = orig;
	} else {
		orig = document.createElement('canvas');
		orig.width = img.width;
		orig.height = img.height;
		origCtx = orig.getContext('2d');
		origCtx.drawImage( img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
		scaled = document.createElement('canvas');
	}
	var origPixels = origCtx.getImageData(0, 0, orig.width, orig.height).data;


	// pack RGBA colors into integers
	var count = img.width * img.height;
	var index;
	for( var i = 0; i < count; i++ ) {
		//var index = i * 4; otimized
		index = i << 2;
		src[i] = (origPixels[index+3] << 24) +
				(origPixels[index+2] << 16) +
				(origPixels[index+1] << 8) +
				origPixels[index];
	}

	// This is where the magic happens
	if( scale === 2 ) hq2x( img.width, img.height );
	else if( scale === 3 ) hq3x( img.width, img.height );
	else if( scale === 4 ) hq4x( img.width, img.height );
	// alternative: window['hq'+scale+'x']( img.width, img.height ); 

	scaled.width = orig.width * scale;
	scaled.height = orig.height * scale;
	var scaledCtx = scaled.getContext('2d');
	var scaledPixels = scaledCtx.getImageData( 0, 0, scaled.width, scaled.height );

	var c, a, 
		scaledPixelsData = scaledPixels.data;
	// unpack integers to RGBA
	for( var j = 0; j < dest.length; j++ ) {
		c = dest[j];
		a = (c & 0xFF000000) >> 24;
		//index = j * 4; optimized
		index = j << 2;
		scaledPixelsData[index+3] = a < 0 ? a + 256 : 0; // signed/unsigned :/
		scaledPixelsData[index+2] = (c & 0x00FF0000) >> 16;
		scaledPixelsData[index+1] = (c & 0x0000FF00) >> 8;
		scaledPixelsData[index] = c & 0x000000FF;
	}
	src = [];
	dest = [];
	scaledCtx.putImageData( scaledPixels, 0, 0 );
	return scaled;
};





//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
// hq 2x

var hq2x = function( width, height ) {
	var
		i, j, k,
		prevline, nextline,
		w = [],
		//dpL = width * 2, optimized
		dpL = width << 1,

		dp = 0,
		sp = 0;
		
	// internal to local optimization
	var MathAbs = MathAbs,
		RGBtoYUV = RGBtoYUV,
		Diff = Diff,
		Interp1 = Interp1,
		Interp2 = Interp2,
		Interp3 = Interp3,
		Interp4 = Interp4,
		Interp5 = Interp5,
		Interp6 = Interp6,
		Interp7 = Interp7,
		Interp8 = Interp8,
		Interp9 = Interp9,
		Interp10 = Interp10,
		src = src,
		dest = dest;

    //   +----+----+----+
    //   |    |    |    |
    //   | w1 | w2 | w3 |
    //   +----+----+----+
    //   |    |    |    |
    //   | w4 | w5 | w6 |
    //   +----+----+----+
    //   |    |    |    |
    //   | w7 | w8 | w9 |
    //   +----+----+----+

    for (j=0; j<height; j++)
    {
		prevline = j>0 ? -width : 0;
		nextline = j<height-1 ? width : 0;

        for (i=0; i<width; i++)
        {
            w[2] = src[sp + prevline];
            w[5] = src[sp];
            w[8] = src[sp + nextline];

            if (i>0)
            {
                w[1] = src[sp + prevline - 1];
                w[4] = src[sp - 1];
                w[7] = src[sp + nextline - 1];
            }
            else
            {
                w[1] = w[2];
                w[4] = w[5];
                w[7] = w[8];
            }

            if (i<width-1)
            {
                w[3] = src[sp + prevline + 1];
                w[6] = src[sp + 1];
                w[9] = src[sp + nextline + 1];
            }
            else
            {
                w[3] = w[2];
                w[6] = w[5];
                w[9] = w[8];
            }

            var pattern = 0;
            var flag = 1;

            YUV1 = RGBtoYUV(w[5]);

            //for (k=1; k<=9; k++) optimized
            for (k=1; k < 10; k++) // k<=9
            {
                if (k===5) continue;

                if ( w[k] !== w[5] )
                {
                    YUV2 = RGBtoYUV(w[k]);
                    if ( ( MathAbs((YUV1 & Ymask) - (YUV2 & Ymask)) > trY ) ||
                            ( MathAbs((YUV1 & Umask) - (YUV2 & Umask)) > trU ) ||
                            ( MathAbs((YUV1 & Vmask) - (YUV2 & Vmask)) > trV ) )
                        pattern |= flag;
                }
                flag <<= 1;
            }

            switch (pattern)
            {
                case 0:
                case 1:
                case 4:
                case 32:
                case 128:
                case 5:
                case 132:
                case 160:
                case 33:
                case 129:
                case 36:
                case 133:
                case 164:
                case 161:
                case 37:
                case 165:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 2:
                case 34:
                case 130:
                case 162:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 16:
                case 17:
                case 48:
                case 49:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 64:
                case 65:
                case 68:
                case 69:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 8:
                case 12:
                case 136:
                case 140:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 3:
                case 35:
                case 131:
                case 163:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 6:
                case 38:
                case 134:
                case 166:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        Interp1(dp+1, w[5], w[6]);
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 20:
                case 21:
                case 52:
                case 53:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 144:
                case 145:
                case 176:
                case 177:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 192:
                case 193:
                case 196:
                case 197:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 96:
                case 97:
                case 100:
                case 101:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        Interp1(dp+dpL, w[5], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 40:
                case 44:
                case 168:
                case 172:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 9:
                case 13:
                case 137:
                case 141:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 18:
                case 50:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 80:
                case 81:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 72:
                case 76:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 10:
                case 138:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 66:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 24:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 7:
                case 39:
                case 135:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp1(dp+1, w[5], w[6]);
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 148:
                case 149:
                case 180:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 224:
                case 228:
                case 225:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        Interp1(dp+dpL, w[5], w[4]);
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 41:
                case 169:
                case 45:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 22:
                case 54:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 208:
                case 209:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 104:
                case 108:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 11:
                case 139:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 19:
                case 51:
                    {
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp, w[5], w[4]);
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp6(dp, w[5], w[2], w[4]);
                            Interp9(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 146:
                case 178:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                            Interp1(dp+dpL+1, w[5], w[8]);
                        }
                        else
                        {
                            Interp9(dp+1, w[5], w[2], w[6]);
                            Interp6(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        break;
                    }
                case 84:
                case 85:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+1, w[5], w[2]);
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp6(dp+1, w[5], w[6], w[2]);
                            Interp9(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        break;
                    }
                case 112:
                case 113:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL, w[5], w[4]);
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp6(dp+dpL, w[5], w[8], w[4]);
                            Interp9(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 200:
                case 204:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                            Interp1(dp+dpL+1, w[5], w[6]);
                        }
                        else
                        {
                            Interp9(dp+dpL, w[5], w[8], w[4]);
                            Interp6(dp+dpL+1, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 73:
                case 77:
                    {
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp, w[5], w[2]);
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp6(dp, w[5], w[4], w[2]);
                            Interp9(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp2(dp+1, w[5], w[2], w[6]);
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 42:
                case 170:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                            Interp1(dp+dpL, w[5], w[8]);
                        }
                        else
                        {
                            Interp9(dp, w[5], w[4], w[2]);
                            Interp6(dp+dpL, w[5], w[4], w[8]);
                        }
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 14:
                case 142:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                            Interp1(dp+1, w[5], w[6]);
                        }
                        else
                        {
                            Interp9(dp, w[5], w[4], w[2]);
                            Interp6(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 67:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 70:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        Interp1(dp+1, w[5], w[6]);
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 28:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 152:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 194:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 98:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp1(dp+dpL, w[5], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 56:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 25:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 26:
                case 31:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 82:
                case 214:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 88:
                case 248:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 74:
                case 107:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        Interp2(dp+1, w[5], w[3], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 27:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        Interp1(dp+1, w[5], w[3]);
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 86:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        Interp1(dp+dpL+1, w[5], w[9]);
                        break;
                    }
                case 216:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        Interp1(dp+dpL, w[5], w[7]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 106:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp2(dp+1, w[5], w[3], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 30:
                    {
                        Interp1(dp, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 210:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        Interp1(dp+1, w[5], w[3]);
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 120:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp1(dp+dpL+1, w[5], w[9]);
                        break;
                    }
                case 75:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp1(dp+dpL, w[5], w[7]);
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 29:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 198:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        Interp1(dp+1, w[5], w[6]);
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 184:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 99:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp1(dp+dpL, w[5], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 57:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 71:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp1(dp+1, w[5], w[6]);
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 156:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 226:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp1(dp+dpL, w[5], w[4]);
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 60:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 195:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 102:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        Interp1(dp+1, w[5], w[6]);
                        Interp1(dp+dpL, w[5], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 153:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 58:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                        }
                        else
                        {
                            Interp7(dp, w[5], w[4], w[2]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp7(dp+1, w[5], w[2], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 83:
                    {
                        Interp1(dp, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp7(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp7(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 92:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp7(dp+dpL, w[5], w[8], w[4]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp7(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 202:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                        }
                        else
                        {
                            Interp7(dp, w[5], w[4], w[2]);
                        }
                        Interp2(dp+1, w[5], w[3], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp7(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 78:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                        }
                        else
                        {
                            Interp7(dp, w[5], w[4], w[2]);
                        }
                        Interp1(dp+1, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp7(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 154:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                        }
                        else
                        {
                            Interp7(dp, w[5], w[4], w[2]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp7(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 114:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp7(dp+1, w[5], w[2], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp7(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 89:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp7(dp+dpL, w[5], w[8], w[4]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp7(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 90:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                        }
                        else
                        {
                            Interp7(dp, w[5], w[4], w[2]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp7(dp+1, w[5], w[2], w[6]);
                        }
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp7(dp+dpL, w[5], w[8], w[4]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp7(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 55:
                case 23:
                    {
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp, w[5], w[4]);
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp6(dp, w[5], w[2], w[4]);
                            Interp9(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 182:
                case 150:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                            Interp1(dp+dpL+1, w[5], w[8]);
                        }
                        else
                        {
                            Interp9(dp+1, w[5], w[2], w[6]);
                            Interp6(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        break;
                    }
                case 213:
                case 212:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+1, w[5], w[2]);
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp6(dp+1, w[5], w[6], w[2]);
                            Interp9(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        break;
                    }
                case 241:
                case 240:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp6(dp+dpL, w[5], w[8], w[4]);
                            Interp9(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 236:
                case 232:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                            Interp1(dp+dpL+1, w[5], w[6]);
                        }
                        else
                        {
                            Interp9(dp+dpL, w[5], w[8], w[4]);
                            Interp6(dp+dpL+1, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 109:
                case 105:
                    {
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp, w[5], w[2]);
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp6(dp, w[5], w[4], w[2]);
                            Interp9(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp2(dp+1, w[5], w[2], w[6]);
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 171:
                case 43:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            Interp1(dp+dpL, w[5], w[8]);
                        }
                        else
                        {
                            Interp9(dp, w[5], w[4], w[2]);
                            Interp6(dp+dpL, w[5], w[4], w[8]);
                        }
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 143:
                case 15:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            Interp1(dp+1, w[5], w[6]);
                        }
                        else
                        {
                            Interp9(dp, w[5], w[4], w[2]);
                            Interp6(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 124:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp1(dp+dpL+1, w[5], w[9]);
                        break;
                    }
                case 203:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp1(dp+dpL, w[5], w[7]);
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 62:
                    {
                        Interp1(dp, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 211:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp1(dp+1, w[5], w[3]);
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 118:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[4]);
                        Interp1(dp+dpL+1, w[5], w[9]);
                        break;
                    }
                case 217:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        Interp1(dp+dpL, w[5], w[7]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 110:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp1(dp+1, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 155:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        Interp1(dp+1, w[5], w[3]);
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 188:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 185:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 61:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 157:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 103:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp1(dp+1, w[5], w[6]);
                        Interp1(dp+dpL, w[5], w[4]);
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 227:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp2(dp+1, w[5], w[3], w[6]);
                        Interp1(dp+dpL, w[5], w[4]);
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 230:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        Interp1(dp+1, w[5], w[6]);
                        Interp1(dp+dpL, w[5], w[4]);
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 199:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp1(dp+1, w[5], w[6]);
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 220:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp7(dp+dpL, w[5], w[8], w[4]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 158:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                        }
                        else
                        {
                            Interp7(dp, w[5], w[4], w[2]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 234:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                        }
                        else
                        {
                            Interp7(dp, w[5], w[4], w[2]);
                        }
                        Interp2(dp+1, w[5], w[3], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 242:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp7(dp+1, w[5], w[2], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 59:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp7(dp+1, w[5], w[2], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 121:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp7(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 87:
                    {
                        Interp1(dp, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp7(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 79:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        Interp1(dp+1, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp7(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 122:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                        }
                        else
                        {
                            Interp7(dp, w[5], w[4], w[2]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp7(dp+1, w[5], w[2], w[6]);
                        }
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp7(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 94:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                        }
                        else
                        {
                            Interp7(dp, w[5], w[4], w[2]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp7(dp+dpL, w[5], w[8], w[4]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp7(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 218:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                        }
                        else
                        {
                            Interp7(dp, w[5], w[4], w[2]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp7(dp+1, w[5], w[2], w[6]);
                        }
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp7(dp+dpL, w[5], w[8], w[4]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 91:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp7(dp+1, w[5], w[2], w[6]);
                        }
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp7(dp+dpL, w[5], w[8], w[4]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp7(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 229:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        Interp1(dp+dpL, w[5], w[4]);
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 167:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp1(dp+1, w[5], w[6]);
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 173:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 181:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 186:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                        }
                        else
                        {
                            Interp7(dp, w[5], w[4], w[2]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp7(dp+1, w[5], w[2], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 115:
                    {
                        Interp1(dp, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp7(dp+1, w[5], w[2], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp7(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 93:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp7(dp+dpL, w[5], w[8], w[4]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp7(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 206:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                        }
                        else
                        {
                            Interp7(dp, w[5], w[4], w[2]);
                        }
                        Interp1(dp+1, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp7(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 205:
                case 201:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+dpL, w[5], w[7]);
                        }
                        else
                        {
                            Interp7(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 174:
                case 46:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp1(dp, w[5], w[4]);
                        }
                        else
                        {
                            Interp7(dp, w[5], w[4], w[2]);
                        }
                        Interp1(dp+1, w[5], w[6]);
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 179:
                case 147:
                    {
                        Interp1(dp, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+1, w[5], w[3]);
                        }
                        else
                        {
                            Interp7(dp+1, w[5], w[2], w[6]);
                        }
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 117:
                case 116:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        Interp1(dp+dpL, w[5], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);
                        }
                        else
                        {
                            Interp7(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 189:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 231:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp1(dp+1, w[5], w[6]);
                        Interp1(dp+dpL, w[5], w[4]);
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 126:
                    {
                        Interp1(dp, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp1(dp+dpL+1, w[5], w[9]);
                        break;
                    }
                case 219:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        Interp1(dp+1, w[5], w[3]);
                        Interp1(dp+dpL, w[5], w[7]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 125:
                    {
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp, w[5], w[2]);
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp6(dp, w[5], w[4], w[2]);
                            Interp9(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp1(dp+1, w[5], w[2]);
                        Interp1(dp+dpL+1, w[5], w[9]);
                        break;
                    }
                case 221:
                    {
                        Interp1(dp, w[5], w[2]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+1, w[5], w[2]);
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp6(dp+1, w[5], w[6], w[2]);
                            Interp9(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        Interp1(dp+dpL, w[5], w[7]);
                        break;
                    }
                case 207:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            Interp1(dp+1, w[5], w[6]);
                        }
                        else
                        {
                            Interp9(dp, w[5], w[4], w[2]);
                            Interp6(dp+1, w[5], w[2], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[7]);
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 238:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp1(dp+1, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                            Interp1(dp+dpL+1, w[5], w[6]);
                        }
                        else
                        {
                            Interp9(dp+dpL, w[5], w[8], w[4]);
                            Interp6(dp+dpL+1, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 190:
                    {
                        Interp1(dp, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                            Interp1(dp+dpL+1, w[5], w[8]);
                        }
                        else
                        {
                            Interp9(dp+1, w[5], w[2], w[6]);
                            Interp6(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        Interp1(dp+dpL, w[5], w[8]);
                        break;
                    }
                case 187:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            Interp1(dp+dpL, w[5], w[8]);
                        }
                        else
                        {
                            Interp9(dp, w[5], w[4], w[2]);
                            Interp6(dp+dpL, w[5], w[4], w[8]);
                        }
                        Interp1(dp+1, w[5], w[3]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 243:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp1(dp+1, w[5], w[3]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp6(dp+dpL, w[5], w[8], w[4]);
                            Interp9(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 119:
                    {
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp, w[5], w[4]);
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp6(dp, w[5], w[2], w[4]);
                            Interp9(dp+1, w[5], w[2], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[4]);
                        Interp1(dp+dpL+1, w[5], w[9]);
                        break;
                    }
                case 237:
                case 233:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp2(dp+1, w[5], w[2], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp1(dp+dpL, w[5], w[7]);0
                        }
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 175:
                case 47:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp1(dp, w[5], w[4]);0
                        }
                        Interp1(dp+1, w[5], w[6]);
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        break;
                    }
                case 183:
                case 151:
                    {
                        Interp1(dp, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp+1, w[5], w[3]);0
                        }
                        Interp2(dp+dpL, w[5], w[8], w[4]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 245:
                case 244:
                    {
                        Interp2(dp, w[5], w[4], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        Interp1(dp+dpL, w[5], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);0
                        }
                        break;
                    }
                case 250:
                    {
                        Interp1(dp, w[5], w[4]);
                        Interp1(dp+1, w[5], w[3]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 123:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        Interp1(dp+1, w[5], w[3]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp1(dp+dpL+1, w[5], w[9]);
                        break;
                    }
                case 95:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[7]);
                        Interp1(dp+dpL+1, w[5], w[9]);
                        break;
                    }
                case 222:
                    {
                        Interp1(dp, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[7]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 252:
                    {
                        Interp2(dp, w[5], w[1], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);0
                        }
                        break;
                    }
                case 249:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp2(dp+1, w[5], w[3], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp1(dp+dpL, w[5], w[7]);0
                        }
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 235:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        Interp2(dp+1, w[5], w[3], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp1(dp+dpL, w[5], w[7]);0
                        }
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 111:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp1(dp, w[5], w[4]);0
                        }
                        Interp1(dp+1, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp2(dp+dpL+1, w[5], w[9], w[6]);
                        break;
                    }
                case 63:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp1(dp, w[5], w[4]);0
                        }
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp2(dp+dpL+1, w[5], w[9], w[8]);
                        break;
                    }
                case 159:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp+1, w[5], w[3]);0
                        }
                        Interp2(dp+dpL, w[5], w[7], w[8]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 215:
                    {
                        Interp1(dp, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp+1, w[5], w[3]);0
                        }
                        Interp2(dp+dpL, w[5], w[7], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 246:
                    {
                        Interp2(dp, w[5], w[1], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);0
                        }
                        break;
                    }
                case 254:
                    {
                        Interp1(dp, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);0
                        }
                        break;
                    }
                case 253:
                    {
                        Interp1(dp, w[5], w[2]);
                        Interp1(dp+1, w[5], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp1(dp+dpL, w[5], w[7]);0
                        }
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);0
                        }
                        break;
                    }
                case 251:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        Interp1(dp+1, w[5], w[3]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp1(dp+dpL, w[5], w[7]);0
                        }
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 239:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp1(dp, w[5], w[4]);0
                        }
                        Interp1(dp+1, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp1(dp+dpL, w[5], w[7]);0
                        }
                        Interp1(dp+dpL+1, w[5], w[6]);
                        break;
                    }
                case 127:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp1(dp, w[5], w[4]);0
                        }
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+1, w[5], w[2], w[6]);
                        }
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL, w[5], w[8], w[4]);
                        }
                        Interp1(dp+dpL+1, w[5], w[9]);
                        break;
                    }
                case 191:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp1(dp, w[5], w[4]);0
                        }
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp+1, w[5], w[3]);0
                        }
                        Interp1(dp+dpL, w[5], w[8]);
                        Interp1(dp+dpL+1, w[5], w[8]);
                        break;
                    }
                case 223:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[4], w[2]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp+1, w[5], w[3]);0
                        }
                        Interp1(dp+dpL, w[5], w[7]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp2(dp+dpL+1, w[5], w[6], w[8]);
                        }
                        break;
                    }
                case 247:
                    {
                        Interp1(dp, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp+1, w[5], w[3]);0
                        }
                        Interp1(dp+dpL, w[5], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);0
                        }
                        break;
                    }
                case 255:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp1(dp, w[5], w[4]);0
                        }
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp+1, w[5], w[3]);0
                        }
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp1(dp+dpL, w[5], w[7]);0
                        }
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp+dpL+1, w[5], w[9]);0
                        }
                        break;
                    }
            }
            sp++;
            //dp += 2; optimized
            dp <<= 1;
        }
        dp += dpL;
    }
};














//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
// hq 3x


var hq3x = function( width, height ) {
	var
		i, j, k,
		prevline, nextline,
		w = [],
		dpL = width * 3,

		dp = 0,
		sp = 0;

	// internal to local optimization
	var MathAbs = MathAbs,
		RGBtoYUV = RGBtoYUV,
		Diff = Diff,
		Interp1 = Interp1,
		Interp2 = Interp2,
		Interp3 = Interp3,
		Interp4 = Interp4,
		Interp5 = Interp5,
		Interp6 = Interp6,
		Interp7 = Interp7,
		Interp8 = Interp8,
		Interp9 = Interp9,
		Interp10 = Interp10,
		src = src,
		dest = dest;

	//   +----+----+----+
	//   |	|	|	|
	//   | w1 | w2 | w3 |
	//   +----+----+----+
	//   |	|	|	|
	//   | w4 | w5 | w6 |
	//   +----+----+----+
	//   |	|	|	|
	//   | w7 | w8 | w9 |
	//   +----+----+----+

	for (j=0; j<height; j++)
	{
		prevline = j>0 ? -width : 0;
		nextline = j<height-1 ? width : 0;

		for (i=0; i<width; i++)
		{
			w[2] = src[sp + prevline];
			w[5] = src[sp];
			w[8] = src[sp + nextline];

			if (i>0)
			{
				w[1] = src[sp + prevline - 1];
				w[4] = src[sp - 1];
				w[7] = src[sp + nextline - 1];
			}
			else
			{
				w[1] = w[2];
				w[4] = w[5];
				w[7] = w[8];
			}

			if (i<width-1)
			{
				w[3] = src[sp + prevline + 1];
				w[6] = src[sp + 1];
				w[9] = src[sp + nextline + 1];
			}
			else
			{
				w[3] = w[2];
				w[6] = w[5];
				w[9] = w[8];
			}

			var pattern = 0;
			var flag = 1;

			YUV1 = RGBtoYUV(w[5]);

			//for (k=1; k<=9; k++) optimized
			for (k=1; k< 10; k++) // k<=9
			{
				if (k===5) continue;

				if ( w[k] !== w[5] )
				{
					YUV2 = RGBtoYUV(w[k]);
					if ( ( MathAbs((YUV1 & Ymask) - (YUV2 & Ymask)) > trY ) ||
							( MathAbs((YUV1 & Umask) - (YUV2 & Umask)) > trU ) ||
							( MathAbs((YUV1 & Vmask) - (YUV2 & Vmask)) > trV ) )
						pattern |= flag;
				}
				flag <<= 1;
			}

			switch (pattern)
			{
				case 0:
				case 1:
				case 4:
				case 32:
				case 128:
				case 5:
				case 132:
				case 160:
				case 33:
				case 129:
				case 36:
				case 133:
				case 164:
				case 161:
				case 37:
				case 165:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 2:
				case 34:
				case 130:
				case 162:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 16:
				case 17:
				case 48:
				case 49:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 64:
				case 65:
				case 68:
				case 69:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 8:
				case 12:
				case 136:
				case 140:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 3:
				case 35:
				case 131:
				case 163:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 6:
				case 38:
				case 134:
				case 166:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 20:
				case 21:
				case 52:
				case 53:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 144:
				case 145:
				case 176:
				case 177:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 192:
				case 193:
				case 196:
				case 197:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 96:
				case 97:
				case 100:
				case 101:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 40:
				case 44:
				case 168:
				case 172:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 9:
				case 13:
				case 137:
				case 141:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 18:
				case 50:
					{
						Interp1(dp, w[5], w[1]);
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							Interp1(dp+2, w[5], w[3]);
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp4(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 80:
				case 81:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 72:
				case 76:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 10:
				case 138:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
							dest[dp+1] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 66:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 24:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 7:
				case 39:
				case 135:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 148:
				case 149:
				case 180:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 224:
				case 228:
				case 225:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 41:
				case 169:
				case 45:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 22:
				case 54:
					{
						Interp1(dp, w[5], w[1]);
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp4(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 208:
				case 209:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 104:
				case 108:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 11:
				case 139:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 19:
				case 51:
					{
						if (Diff(w[2], w[6]))
						{
							Interp1(dp, w[5], w[4]);
							dest[dp+1] = w[5];
							Interp1(dp+2, w[5], w[3]);
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
							Interp1(dp+1, w[2], w[5]);
							Interp5(dp+2, w[2], w[6]);
							Interp1(dp+dpL+2, w[5], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 146:
				case 178:
					{
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							Interp1(dp+2, w[5], w[3]);
							dest[dp+dpL+2] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						}
						else
						{
							Interp1(dp+1, w[5], w[2]);
							Interp5(dp+2, w[2], w[6]);
							Interp1(dp+dpL+2, w[6], w[5]);
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						Interp1(dp, w[5], w[1]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						break;
					}
				case 84:
				case 85:
					{
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+2, w[5], w[2]);
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
							Interp1(dp+dpL+2, w[6], w[5]);
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp5(dp+(dpL << 1 /*==dpL * 2*/)+2, w[6], w[8]);
						}
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						break;
					}
				case 112:
				case 113:
					{
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp1(dp+dpL+2, w[5], w[6]);
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[8], w[5]);
							Interp5(dp+(dpL << 1 /*==dpL * 2*/)+2, w[6], w[8]);
						}
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						break;
					}
				case 200:
				case 204:
					{
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						}
						else
						{
							Interp1(dp+dpL, w[5], w[4]);
							Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[8], w[4]);
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[8], w[5]);
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						break;
					}
				case 73:
				case 77:
					{
						if (Diff(w[8], w[4]))
						{
							Interp1(dp, w[5], w[2]);
							dest[dp+dpL] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
							Interp1(dp+dpL, w[4], w[5]);
							Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[8], w[4]);
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 42:
				case 170:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
							dest[dp+1] = w[5];
							dest[dp+dpL] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						}
						else
						{
							Interp5(dp, w[4], w[2]);
							Interp1(dp+1, w[5], w[2]);
							Interp1(dp+dpL, w[4], w[5]);
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 14:
				case 142:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
							dest[dp+1] = w[5];
							Interp1(dp+2, w[5], w[6]);
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp5(dp, w[4], w[2]);
							Interp1(dp+1, w[2], w[5]);
							Interp2(dp+2, w[5], w[2], w[6]);
							Interp1(dp+dpL, w[5], w[4]);
						}
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 67:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 70:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 28:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 152:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 194:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 98:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 56:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 25:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 26:
				case 31:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp4(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 82:
				case 214:
					{
						Interp1(dp, w[5], w[1]);
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp4(dp+2, w[5], w[2], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						if (Diff(w[6], w[8]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 88:
				case 248:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 74:
				case 107:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
						}
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 27:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 86:
					{
						Interp1(dp, w[5], w[1]);
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp4(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 216:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 106:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 30:
					{
						Interp1(dp, w[5], w[1]);
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp4(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 210:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 120:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 75:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 29:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 198:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 184:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 99:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 57:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 71:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 156:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 226:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 60:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 195:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 102:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 153:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 58:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							Interp1(dp+2, w[5], w[3]);
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 83:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							Interp1(dp+2, w[5], w[3]);
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 92:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						if (Diff(w[8], w[4]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 202:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 78:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 154:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							Interp1(dp+2, w[5], w[3]);
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 114:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							Interp1(dp+2, w[5], w[3]);
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 89:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						if (Diff(w[8], w[4]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 90:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							Interp1(dp+2, w[5], w[3]);
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						if (Diff(w[8], w[4]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 55:
				case 23:
					{
						if (Diff(w[2], w[6]))
						{
							Interp1(dp, w[5], w[4]);
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
							Interp1(dp+1, w[2], w[5]);
							Interp5(dp+2, w[2], w[6]);
							Interp1(dp+dpL+2, w[5], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 182:
				case 150:
					{
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						}
						else
						{
							Interp1(dp+1, w[5], w[2]);
							Interp5(dp+2, w[2], w[6]);
							Interp1(dp+dpL+2, w[6], w[5]);
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						Interp1(dp, w[5], w[1]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						break;
					}
				case 213:
				case 212:
					{
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+2, w[5], w[2]);
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
							Interp1(dp+dpL+2, w[6], w[5]);
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp5(dp+(dpL << 1 /*==dpL * 2*/)+2, w[6], w[8]);
						}
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						break;
					}
				case 241:
				case 240:
					{
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp1(dp+dpL+2, w[5], w[6]);
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[8], w[5]);
							Interp5(dp+(dpL << 1 /*==dpL * 2*/)+2, w[6], w[8]);
						}
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						break;
					}
				case 236:
				case 232:
					{
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						}
						else
						{
							Interp1(dp+dpL, w[5], w[4]);
							Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[8], w[4]);
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[8], w[5]);
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						break;
					}
				case 109:
				case 105:
					{
						if (Diff(w[8], w[4]))
						{
							Interp1(dp, w[5], w[2]);
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
							Interp1(dp+dpL, w[4], w[5]);
							Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[8], w[4]);
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 171:
				case 43:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
							dest[dp+dpL] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						}
						else
						{
							Interp5(dp, w[4], w[2]);
							Interp1(dp+1, w[5], w[2]);
							Interp1(dp+dpL, w[4], w[5]);
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 143:
				case 15:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
							Interp1(dp+2, w[5], w[6]);
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp5(dp, w[4], w[2]);
							Interp1(dp+1, w[2], w[5]);
							Interp2(dp+2, w[5], w[2], w[6]);
							Interp1(dp+dpL, w[5], w[4]);
						}
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 124:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 203:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 62:
					{
						Interp1(dp, w[5], w[1]);
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp4(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 211:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 118:
					{
						Interp1(dp, w[5], w[1]);
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp4(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 217:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 110:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 155:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 188:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 185:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 61:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 157:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 103:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 227:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 230:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 199:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 220:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						if (Diff(w[8], w[4]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 158:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp4(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 234:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 242:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							Interp1(dp+2, w[5], w[3]);
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 59:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						if (Diff(w[2], w[6]))
						{
							Interp1(dp+2, w[5], w[3]);
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 121:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 87:
					{
						Interp1(dp, w[5], w[4]);
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp4(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 79:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						Interp1(dp+2, w[5], w[6]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 122:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							Interp1(dp+2, w[5], w[3]);
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 94:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp4(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						if (Diff(w[8], w[4]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 218:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							Interp1(dp+2, w[5], w[3]);
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						if (Diff(w[8], w[4]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 91:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						if (Diff(w[2], w[6]))
						{
							Interp1(dp+2, w[5], w[3]);
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						if (Diff(w[8], w[4]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 229:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 167:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 173:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 181:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 186:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							Interp1(dp+2, w[5], w[3]);
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 115:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							Interp1(dp+2, w[5], w[3]);
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 93:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						if (Diff(w[8], w[4]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 206:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 205:
				case 201:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 174:
				case 46:
					{
						if (Diff(w[4], w[2]))
						{
							Interp1(dp, w[5], w[1]);
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 179:
				case 147:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							Interp1(dp+2, w[5], w[3]);
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 117:
				case 116:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 189:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 231:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 126:
					{
						Interp1(dp, w[5], w[1]);
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp4(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						dest[dp+dpL+1] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 219:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 125:
					{
						if (Diff(w[8], w[4]))
						{
							Interp1(dp, w[5], w[2]);
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
							Interp1(dp+dpL, w[4], w[5]);
							Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[8], w[4]);
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 221:
					{
						if (Diff(w[6], w[8]))
						{
							Interp1(dp+2, w[5], w[2]);
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
							Interp1(dp+dpL+2, w[6], w[5]);
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp5(dp+(dpL << 1 /*==dpL * 2*/)+2, w[6], w[8]);
						}
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						break;
					}
				case 207:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
							Interp1(dp+2, w[5], w[6]);
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp5(dp, w[4], w[2]);
							Interp1(dp+1, w[2], w[5]);
							Interp2(dp+2, w[5], w[2], w[6]);
							Interp1(dp+dpL, w[5], w[4]);
						}
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 238:
					{
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						}
						else
						{
							Interp1(dp+dpL, w[5], w[4]);
							Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[8], w[4]);
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[8], w[5]);
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						break;
					}
				case 190:
					{
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						}
						else
						{
							Interp1(dp+1, w[5], w[2]);
							Interp5(dp+2, w[2], w[6]);
							Interp1(dp+dpL+2, w[6], w[5]);
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						Interp1(dp, w[5], w[1]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						break;
					}
				case 187:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
							dest[dp+dpL] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						}
						else
						{
							Interp5(dp, w[4], w[2]);
							Interp1(dp+1, w[5], w[2]);
							Interp1(dp+dpL, w[4], w[5]);
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 243:
					{
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp1(dp+dpL+2, w[5], w[6]);
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[8], w[5]);
							Interp5(dp+(dpL << 1 /*==dpL * 2*/)+2, w[6], w[8]);
						}
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						break;
					}
				case 119:
					{
						if (Diff(w[2], w[6]))
						{
							Interp1(dp, w[5], w[4]);
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
							Interp1(dp+1, w[2], w[5]);
							Interp5(dp+2, w[2], w[6]);
							Interp1(dp+dpL+2, w[5], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 237:
				case 233:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp2(dp+2, w[5], w[2], w[6]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 175:
				case 47:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						break;
					}
				case 183:
				case 151:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							dest[dp+2] = w[5];
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 245:
				case 244:
					{
						Interp2(dp, w[5], w[4], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 250:
					{
						Interp1(dp, w[5], w[1]);
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 123:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
						}
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 95:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp4(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 222:
					{
						Interp1(dp, w[5], w[1]);
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp4(dp+2, w[5], w[2], w[6]);
						}
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						if (Diff(w[6], w[8]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 252:
					{
						Interp1(dp, w[5], w[1]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 249:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 235:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
						}
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 111:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 63:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp4(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 159:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							dest[dp+2] = w[5];
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 215:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							dest[dp+2] = w[5];
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						if (Diff(w[6], w[8]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 246:
					{
						Interp1(dp, w[5], w[1]);
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp4(dp+2, w[5], w[2], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 254:
					{
						Interp1(dp, w[5], w[1]);
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp4(dp+2, w[5], w[2], w[6]);
						}
						dest[dp+dpL+1] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 253:
					{
						Interp1(dp, w[5], w[2]);
						Interp1(dp+1, w[5], w[2]);
						Interp1(dp+2, w[5], w[2]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 251:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
						}
						Interp1(dp+2, w[5], w[3]);
						dest[dp+dpL+1] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+dpL] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp3(dp+dpL, w[5], w[4]);
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						if (Diff(w[6], w[8]))
						{
							dest[dp+dpL+2] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+dpL+2, w[5], w[6]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 239:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						Interp1(dp+2, w[5], w[6]);
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						Interp1(dp+dpL+2, w[5], w[6]);
						if (Diff(w[8], w[4]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
						break;
					}
				case 127:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+1] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
							Interp3(dp+1, w[5], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						if (Diff(w[2], w[6]))
						{
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp4(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						dest[dp+dpL+1] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						}
						else
						{
							Interp4(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						}
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
						break;
					}
				case 191:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							dest[dp+2] = w[5];
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
						Interp1(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
						break;
					}
				case 223:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
							dest[dp+dpL] = w[5];
						}
						else
						{
							Interp4(dp, w[5], w[4], w[2]);
							Interp3(dp+dpL, w[5], w[4]);
						}
						if (Diff(w[2], w[6]))
						{
							dest[dp+1] = w[5];
							dest[dp+2] = w[5];
							dest[dp+dpL+2] = w[5];
						}
						else
						{
							Interp3(dp+1, w[5], w[2]);
							Interp2(dp+2, w[5], w[2], w[6]);
							Interp3(dp+dpL+2, w[5], w[6]);
						}
						dest[dp+dpL+1] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
						if (Diff(w[6], w[8]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
							Interp4(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 247:
					{
						Interp1(dp, w[5], w[4]);
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							dest[dp+2] = w[5];
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						Interp1(dp+dpL, w[5], w[4]);
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
				case 255:
					{
						if (Diff(w[4], w[2]))
						{
							dest[dp] = w[5];
						}
						else
						{
							Interp2(dp, w[5], w[4], w[2]);
						}
						dest[dp+1] = w[5];
						if (Diff(w[2], w[6]))
						{
							dest[dp+2] = w[5];
						}
						else
						{
							Interp2(dp+2, w[5], w[2], w[6]);
						}
						dest[dp+dpL] = w[5];
						dest[dp+dpL+1] = w[5];
						dest[dp+dpL+2] = w[5];
						if (Diff(w[8], w[4]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8], w[4]);
						}
						dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
						if (Diff(w[6], w[8]))
						{
							dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
						}
						else
						{
							Interp2(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
						}
						break;
					}
			}
			sp++;
			dp += 3;
		}
		//dp += (dpL * 2); optimized
		dp += (dpL << 1);
	}
};














//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
// hq 4x

var hq4x = function( width, height ) {
	var
		i, j, k,
		prevline, nextline,
		w = [],
		//dpL = width * 4, optimized
		dpL = width << 2,

		dp = 0,
		sp = 0;

	// internal to local optimization
	var MathAbs = MathAbs,
		RGBtoYUV = RGBtoYUV,
		Diff = Diff,
		Interp1 = Interp1,
		Interp2 = Interp2,
		Interp3 = Interp3,
		Interp4 = Interp4,
		Interp5 = Interp5,
		Interp6 = Interp6,
		Interp7 = Interp7,
		Interp8 = Interp8,
		Interp9 = Interp9,
		Interp10 = Interp10,
		src = src,
		dest = dest;

    //   +----+----+----+
    //   |    |    |    |
    //   | w1 | w2 | w3 |
    //   +----+----+----+
    //   |    |    |    |
    //   | w4 | w5 | w6 |
    //   +----+----+----+
    //   |    |    |    |
    //   | w7 | w8 | w9 |
    //   +----+----+----+

    for (j=0; j<height; j++)
    {
		prevline = j>0 ? -width : 0;
		nextline = j<height-1 ? width : 0;

        for (i=0; i<width; i++)
        {
            w[2] = src[sp + prevline];
            w[5] = src[sp];
            w[8] = src[sp + nextline];

            if (i>0)
            {
                w[1] = src[sp + prevline - 1];
                w[4] = src[sp - 1];
                w[7] = src[sp + nextline - 1];
            }
            else
            {
                w[1] = w[2];
                w[4] = w[5];
                w[7] = w[8];
            }

            if (i<width-1)
            {
                w[3] = src[sp + prevline + 1];
                w[6] = src[sp + 1];
                w[9] = src[sp + nextline + 1];
            }
            else
            {
                w[3] = w[2];
                w[6] = w[5];
                w[9] = w[8];
            }

            var pattern = 0;
            var flag = 1;

            YUV1 = RGBtoYUV(w[5]);

            //for (k=1; k<=9; k++) optimized
            for (k=1; k < 10; k++) // k<=9
            {
                if (k===5) continue;

                if ( w[k] !== w[5] )
                {
                    YUV2 = RGBtoYUV(w[k]);
                    if ( ( MathAbs((YUV1 & Ymask) - (YUV2 & Ymask)) > trY ) ||
                            ( MathAbs((YUV1 & Umask) - (YUV2 & Umask)) > trU ) ||
                            ( MathAbs((YUV1 & Vmask) - (YUV2 & Vmask)) > trV ) )
                        pattern |= flag;
                }
                flag <<= 1;
            }

            switch (pattern)
            {
                case 0:
                case 1:
                case 4:
                case 32:
                case 128:
                case 5:
                case 132:
                case 160:
                case 33:
                case 129:
                case 36:
                case 133:
                case 164:
                case 161:
                case 37:
                case 165:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 2:
                case 34:
                case 130:
                case 162:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 16:
                case 17:
                case 48:
                case 49:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 64:
                case 65:
                case 68:
                case 69:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 8:
                case 12:
                case 136:
                case 140:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 3:
                case 35:
                case 131:
                case 163:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 6:
                case 38:
                case 134:
                case 166:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 20:
                case 21:
                case 52:
                case 53:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 144:
                case 145:
                case 176:
                case 177:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 192:
                case 193:
                case 196:
                case 197:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 96:
                case 97:
                case 100:
                case 101:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 40:
                case 44:
                case 168:
                case 172:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 9:
                case 13:
                case 137:
                case 141:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 18:
                case 50:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            dest[dp+dpL+2] = w[5];
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 80:
                case 81:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 72:
                case 76:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 10:
                case 138:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                            dest[dp+dpL+1] = w[5];
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 66:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 24:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 7:
                case 39:
                case 135:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 148:
                case 149:
                case 180:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 224:
                case 228:
                case 225:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 41:
                case 169:
                case 45:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 22:
                case 54:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        dest[dp+dpL+2] = w[5];
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 208:
                case 209:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 104:
                case 108:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 11:
                case 139:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 19:
                case 51:
                    {
                        if (Diff(w[2], w[6]))
                        {
                            Interp8(dp, w[5], w[4]);
                            Interp3(dp+1, w[5], w[4]);
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp1(dp, w[5], w[2]);
                            Interp1(dp+1, w[2], w[5]);
                            Interp8(dp+2, w[2], w[6]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp7(dp+dpL+2, w[5], w[6], w[2]);
                            Interp2(dp+dpL+3, w[6], w[5], w[2]);
                        }
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 146:
                case 178:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        }
                        else
                        {
                            Interp2(dp+2, w[2], w[5], w[6]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp7(dp+dpL+2, w[5], w[6], w[2]);
                            Interp8(dp+dpL+3, w[6], w[2]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp1(dp+(dpL * 3)+3, w[5], w[6]);
                        }
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        break;
                    }
                case 84:
                case 85:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp8(dp+2, w[5], w[2]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp8(dp+3, w[5], w[2]);
                            Interp3(dp+dpL+3, w[5], w[2]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            Interp1(dp+3, w[5], w[6]);
                            Interp1(dp+dpL+3, w[6], w[5]);
                            Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                            Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[8]);
                            Interp2(dp+(dpL * 3)+2, w[8], w[5], w[6]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 112:
                case 113:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp8(dp+(dpL * 3), w[5], w[4]);
                            Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                            Interp2(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5], w[8]);
                            Interp1(dp+(dpL * 3), w[5], w[8]);
                            Interp1(dp+(dpL * 3)+1, w[8], w[5]);
                            Interp8(dp+(dpL * 3)+2, w[8], w[6]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        break;
                    }
                case 200:
                case 204:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                            Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        }
                        else
                        {
                            Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5], w[8]);
                            Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp8(dp+(dpL * 3)+1, w[8], w[4]);
                            Interp1(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp1(dp+(dpL * 3)+3, w[5], w[8]);
                        }
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        break;
                    }
                case 73:
                case 77:
                    {
                        if (Diff(w[8], w[4]))
                        {
                            Interp8(dp, w[5], w[2]);
                            Interp3(dp+dpL, w[5], w[2]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp1(dp, w[5], w[4]);
                            Interp1(dp+dpL, w[4], w[5]);
                            Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[8]);
                            Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp2(dp+(dpL * 3)+1, w[8], w[5], w[4]);
                        }
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 42:
                case 170:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                            Interp8(dp+(dpL * 3), w[5], w[8]);
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp2(dp+1, w[2], w[5], w[4]);
                            Interp8(dp+dpL, w[4], w[2]);
                            Interp7(dp+dpL+1, w[5], w[4], w[2]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp1(dp+(dpL * 3), w[5], w[4]);
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 14:
                case 142:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp3(dp+2, w[5], w[6]);
                            Interp8(dp+3, w[5], w[6]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp8(dp+1, w[2], w[4]);
                            Interp1(dp+2, w[2], w[5]);
                            Interp1(dp+3, w[5], w[2]);
                            Interp2(dp+dpL, w[4], w[5], w[2]);
                            Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        }
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 67:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 70:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 28:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 152:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 194:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 98:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 56:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 25:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 26:
                case 31:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        dest[dp+dpL+1] = w[5];
                        dest[dp+dpL+2] = w[5];
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 82:
                case 214:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        dest[dp+dpL+2] = w[5];
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 88:
                case 248:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        break;
                    }
                case 74:
                case 107:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 27:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 86:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        dest[dp+dpL+2] = w[5];
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 216:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 106:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 30:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        dest[dp+dpL+2] = w[5];
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 210:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 120:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 75:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 29:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 198:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 184:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 99:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 57:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 71:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 156:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 226:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 60:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 195:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 102:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 153:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 58:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                            Interp1(dp+1, w[5], w[2]);
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp1(dp+2, w[5], w[2]);
                            Interp2(dp+3, w[5], w[2], w[6]);
                            dest[dp+dpL+2] = w[5];
                            Interp1(dp+dpL+3, w[5], w[6]);
                        }
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 83:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp1(dp+2, w[5], w[2]);
                            Interp2(dp+3, w[5], w[2], w[6]);
                            dest[dp+dpL+2] = w[5];
                            Interp1(dp+dpL+3, w[5], w[6]);
                        }
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[8]);
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 92:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[8]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[8]);
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 202:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                            Interp1(dp+1, w[5], w[2]);
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[8]);
                        }
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 78:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                            Interp1(dp+1, w[5], w[2]);
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[8]);
                        }
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 154:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                            Interp1(dp+1, w[5], w[2]);
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp1(dp+2, w[5], w[2]);
                            Interp2(dp+3, w[5], w[2], w[6]);
                            dest[dp+dpL+2] = w[5];
                            Interp1(dp+dpL+3, w[5], w[6]);
                        }
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 114:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp1(dp+2, w[5], w[2]);
                            Interp2(dp+3, w[5], w[2], w[6]);
                            dest[dp+dpL+2] = w[5];
                            Interp1(dp+dpL+3, w[5], w[6]);
                        }
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[8]);
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        break;
                    }
                case 89:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[8]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[8]);
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 90:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                            Interp1(dp+1, w[5], w[2]);
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp1(dp+2, w[5], w[2]);
                            Interp2(dp+3, w[5], w[2], w[6]);
                            dest[dp+dpL+2] = w[5];
                            Interp1(dp+dpL+3, w[5], w[6]);
                        }
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[8]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[8]);
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 55:
                case 23:
                    {
                        if (Diff(w[2], w[6]))
                        {
                            Interp8(dp, w[5], w[4]);
                            Interp3(dp+1, w[5], w[4]);
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+2] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp1(dp, w[5], w[2]);
                            Interp1(dp+1, w[2], w[5]);
                            Interp8(dp+2, w[2], w[6]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp7(dp+dpL+2, w[5], w[6], w[2]);
                            Interp2(dp+dpL+3, w[6], w[5], w[2]);
                        }
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 182:
                case 150:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+2] = w[5];
                            dest[dp+dpL+3] = w[5];
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        }
                        else
                        {
                            Interp2(dp+2, w[2], w[5], w[6]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp7(dp+dpL+2, w[5], w[6], w[2]);
                            Interp8(dp+dpL+3, w[6], w[2]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp1(dp+(dpL * 3)+3, w[5], w[6]);
                        }
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        break;
                    }
                case 213:
                case 212:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp8(dp+2, w[5], w[2]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp8(dp+3, w[5], w[2]);
                            Interp3(dp+dpL+3, w[5], w[2]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp1(dp+3, w[5], w[6]);
                            Interp1(dp+dpL+3, w[6], w[5]);
                            Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                            Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[8]);
                            Interp2(dp+(dpL * 3)+2, w[8], w[5], w[6]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 241:
                case 240:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            Interp8(dp+(dpL * 3), w[5], w[4]);
                            Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                            Interp2(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5], w[8]);
                            Interp1(dp+(dpL * 3), w[5], w[8]);
                            Interp1(dp+(dpL * 3)+1, w[8], w[5]);
                            Interp8(dp+(dpL * 3)+2, w[8], w[6]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        break;
                    }
                case 236:
                case 232:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                            Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        }
                        else
                        {
                            Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5], w[8]);
                            Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp8(dp+(dpL * 3)+1, w[8], w[4]);
                            Interp1(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp1(dp+(dpL * 3)+3, w[5], w[8]);
                        }
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        break;
                    }
                case 109:
                case 105:
                    {
                        if (Diff(w[8], w[4]))
                        {
                            Interp8(dp, w[5], w[2]);
                            Interp3(dp+dpL, w[5], w[2]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp, w[5], w[4]);
                            Interp1(dp+dpL, w[4], w[5]);
                            Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[8]);
                            Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp2(dp+(dpL * 3)+1, w[8], w[5], w[4]);
                        }
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 171:
                case 43:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                            dest[dp+dpL+1] = w[5];
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                            Interp8(dp+(dpL * 3), w[5], w[8]);
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp2(dp+1, w[2], w[5], w[4]);
                            Interp8(dp+dpL, w[4], w[2]);
                            Interp7(dp+dpL+1, w[5], w[4], w[2]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp1(dp+(dpL * 3), w[5], w[4]);
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 143:
                case 15:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            Interp3(dp+2, w[5], w[6]);
                            Interp8(dp+3, w[5], w[6]);
                            dest[dp+dpL] = w[5];
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp8(dp+1, w[2], w[4]);
                            Interp1(dp+2, w[2], w[5]);
                            Interp1(dp+3, w[5], w[2]);
                            Interp2(dp+dpL, w[4], w[5], w[2]);
                            Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        }
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 124:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 203:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 62:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        dest[dp+dpL+2] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 211:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 118:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        dest[dp+dpL+2] = w[5];
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 217:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 110:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 155:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 188:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 185:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 61:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 157:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 103:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 227:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 230:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 199:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 220:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[8]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        break;
                    }
                case 158:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                            Interp1(dp+1, w[5], w[2]);
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        dest[dp+dpL+2] = w[5];
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 234:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                            Interp1(dp+1, w[5], w[2]);
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 242:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp1(dp+2, w[5], w[2]);
                            Interp2(dp+3, w[5], w[2], w[6]);
                            dest[dp+dpL+2] = w[5];
                            Interp1(dp+dpL+3, w[5], w[6]);
                        }
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        break;
                    }
                case 59:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp1(dp+2, w[5], w[2]);
                            Interp2(dp+3, w[5], w[2], w[6]);
                            dest[dp+dpL+2] = w[5];
                            Interp1(dp+dpL+3, w[5], w[6]);
                        }
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 121:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[8]);
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 87:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        dest[dp+dpL+2] = w[5];
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[8]);
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 79:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[8]);
                        }
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 122:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                            Interp1(dp+1, w[5], w[2]);
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp1(dp+2, w[5], w[2]);
                            Interp2(dp+3, w[5], w[2], w[6]);
                            dest[dp+dpL+2] = w[5];
                            Interp1(dp+dpL+3, w[5], w[6]);
                        }
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[8]);
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 94:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                            Interp1(dp+1, w[5], w[2]);
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        dest[dp+dpL+2] = w[5];
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[8]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[8]);
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 218:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                            Interp1(dp+1, w[5], w[2]);
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp1(dp+2, w[5], w[2]);
                            Interp2(dp+3, w[5], w[2], w[6]);
                            dest[dp+dpL+2] = w[5];
                            Interp1(dp+dpL+3, w[5], w[6]);
                        }
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[8]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        break;
                    }
                case 91:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp1(dp+2, w[5], w[2]);
                            Interp2(dp+3, w[5], w[2], w[6]);
                            dest[dp+dpL+2] = w[5];
                            Interp1(dp+dpL+3, w[5], w[6]);
                        }
                        dest[dp+dpL+1] = w[5];
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[8]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[8]);
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 229:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 167:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 173:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 181:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 186:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                            Interp1(dp+1, w[5], w[2]);
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp1(dp+2, w[5], w[2]);
                            Interp2(dp+3, w[5], w[2], w[6]);
                            dest[dp+dpL+2] = w[5];
                            Interp1(dp+dpL+3, w[5], w[6]);
                        }
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 115:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp1(dp+2, w[5], w[2]);
                            Interp2(dp+3, w[5], w[2], w[6]);
                            dest[dp+dpL+2] = w[5];
                            Interp1(dp+dpL+3, w[5], w[6]);
                        }
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[8]);
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        break;
                    }
                case 93:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[8]);
                        }
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[8]);
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 206:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                            Interp1(dp+1, w[5], w[2]);
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[8]);
                        }
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 205:
                case 201:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                            Interp8(dp+(dpL * 3), w[5], w[7]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        }
                        else
                        {
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                            Interp1(dp+(dpL * 3)+1, w[5], w[8]);
                        }
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 174:
                case 46:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            Interp8(dp, w[5], w[1]);
                            Interp1(dp+1, w[5], w[1]);
                            Interp1(dp+dpL, w[5], w[1]);
                            Interp3(dp+dpL+1, w[5], w[1]);
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                            Interp1(dp+1, w[5], w[2]);
                            Interp1(dp+dpL, w[5], w[4]);
                            dest[dp+dpL+1] = w[5];
                        }
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 179:
                case 147:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        if (Diff(w[2], w[6]))
                        {
                            Interp1(dp+2, w[5], w[3]);
                            Interp8(dp+3, w[5], w[3]);
                            Interp3(dp+dpL+2, w[5], w[3]);
                            Interp1(dp+dpL+3, w[5], w[3]);
                        }
                        else
                        {
                            Interp1(dp+2, w[5], w[2]);
                            Interp2(dp+3, w[5], w[2], w[6]);
                            dest[dp+dpL+2] = w[5];
                            Interp1(dp+dpL+3, w[5], w[6]);
                        }
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 117:
                case 116:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        }
                        else
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                            Interp1(dp+(dpL * 3)+2, w[5], w[8]);
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        break;
                    }
                case 189:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 231:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 126:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        dest[dp+dpL+2] = w[5];
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 219:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 125:
                    {
                        if (Diff(w[8], w[4]))
                        {
                            Interp8(dp, w[5], w[2]);
                            Interp3(dp+dpL, w[5], w[2]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp1(dp, w[5], w[4]);
                            Interp1(dp+dpL, w[4], w[5]);
                            Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[8]);
                            Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp2(dp+(dpL * 3)+1, w[8], w[5], w[4]);
                        }
                        Interp8(dp+1, w[5], w[2]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 221:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp8(dp+2, w[5], w[2]);
                        if (Diff(w[6], w[8]))
                        {
                            Interp8(dp+3, w[5], w[2]);
                            Interp3(dp+dpL+3, w[5], w[2]);
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp1(dp+3, w[5], w[6]);
                            Interp1(dp+dpL+3, w[6], w[5]);
                            Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                            Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[8]);
                            Interp2(dp+(dpL * 3)+2, w[8], w[5], w[6]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 207:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            Interp3(dp+2, w[5], w[6]);
                            Interp8(dp+3, w[5], w[6]);
                            dest[dp+dpL] = w[5];
                            dest[dp+dpL+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp8(dp+1, w[2], w[4]);
                            Interp1(dp+2, w[2], w[5]);
                            Interp1(dp+3, w[5], w[2]);
                            Interp2(dp+dpL, w[4], w[5], w[2]);
                            Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        }
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 238:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                            Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        }
                        else
                        {
                            Interp2(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5], w[8]);
                            Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp8(dp+(dpL * 3)+1, w[8], w[4]);
                            Interp1(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp1(dp+(dpL * 3)+3, w[5], w[8]);
                        }
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        break;
                    }
                case 190:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+2] = w[5];
                            dest[dp+dpL+3] = w[5];
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                            Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        }
                        else
                        {
                            Interp2(dp+2, w[2], w[5], w[6]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp7(dp+dpL+2, w[5], w[6], w[2]);
                            Interp8(dp+dpL+3, w[6], w[2]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp1(dp+(dpL * 3)+3, w[5], w[6]);
                        }
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        break;
                    }
                case 187:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                            dest[dp+dpL+1] = w[5];
                            Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                            Interp8(dp+(dpL * 3), w[5], w[8]);
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp2(dp+1, w[2], w[5], w[4]);
                            Interp8(dp+dpL, w[4], w[2]);
                            Interp7(dp+dpL+1, w[5], w[4], w[2]);
                            Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp1(dp+(dpL * 3), w[5], w[4]);
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 243:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            Interp8(dp+(dpL * 3), w[5], w[4]);
                            Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                            Interp2(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5], w[8]);
                            Interp1(dp+(dpL * 3), w[5], w[8]);
                            Interp1(dp+(dpL * 3)+1, w[8], w[5]);
                            Interp8(dp+(dpL * 3)+2, w[8], w[6]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        break;
                    }
                case 119:
                    {
                        if (Diff(w[2], w[6]))
                        {
                            Interp8(dp, w[5], w[4]);
                            Interp3(dp+1, w[5], w[4]);
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+2] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp1(dp, w[5], w[2]);
                            Interp1(dp+1, w[2], w[5]);
                            Interp8(dp+2, w[2], w[6]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp7(dp+dpL+2, w[5], w[6], w[2]);
                            Interp2(dp+dpL+3, w[6], w[5], w[2]);
                        }
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 237:
                case 233:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[6]);
                        Interp2(dp+3, w[5], w[2], w[6]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp7(dp+dpL+2, w[5], w[6], w[2]);
                        Interp6(dp+dpL+3, w[5], w[6], w[2]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL * 3)] = w[5];
                        }
                        else
                        {
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        }
                        dest[dp+(dpL * 3)+1] = w[5];
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 175:
                case 47:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                        }
                        dest[dp+1] = w[5];
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        dest[dp+dpL] = w[5];
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6], w[8]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[6]);
                        Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        break;
                    }
                case 183:
                case 151:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        dest[dp+2] = w[5];
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+3] = w[5];
                        }
                        else
                        {
                            Interp2(dp+3, w[5], w[2], w[6]);
                        }
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        dest[dp+dpL+2] = w[5];
                        dest[dp+dpL+3] = w[5];
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[8]);
                        Interp7(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[4]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 245:
                case 244:
                    {
                        Interp2(dp, w[5], w[2], w[4]);
                        Interp6(dp+1, w[5], w[2], w[4]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp6(dp+dpL, w[5], w[4], w[2]);
                        Interp7(dp+dpL+1, w[5], w[4], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        dest[dp+(dpL * 3)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 250:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        break;
                    }
                case 123:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 95:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        dest[dp+dpL+1] = w[5];
                        dest[dp+dpL+2] = w[5];
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 222:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        dest[dp+dpL+2] = w[5];
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 252:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp6(dp+1, w[5], w[2], w[1]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                        dest[dp+(dpL * 3)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 249:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp6(dp+2, w[5], w[2], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL * 3)] = w[5];
                        }
                        else
                        {
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        }
                        dest[dp+(dpL * 3)+1] = w[5];
                        break;
                    }
                case 235:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp6(dp+dpL+3, w[5], w[6], w[3]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL * 3)] = w[5];
                        }
                        else
                        {
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        }
                        dest[dp+(dpL * 3)+1] = w[5];
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 111:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                        }
                        dest[dp+1] = w[5];
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        dest[dp+dpL] = w[5];
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 63:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                        }
                        dest[dp+1] = w[5];
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        dest[dp+dpL] = w[5];
                        dest[dp+dpL+1] = w[5];
                        dest[dp+dpL+2] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp6(dp+(dpL * 3)+2, w[5], w[8], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 159:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        dest[dp+2] = w[5];
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+3] = w[5];
                        }
                        else
                        {
                            Interp2(dp+3, w[5], w[2], w[6]);
                        }
                        dest[dp+dpL+1] = w[5];
                        dest[dp+dpL+2] = w[5];
                        dest[dp+dpL+3] = w[5];
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp6(dp+(dpL * 3)+1, w[5], w[8], w[7]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 215:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        dest[dp+2] = w[5];
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+3] = w[5];
                        }
                        else
                        {
                            Interp2(dp+3, w[5], w[2], w[6]);
                        }
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        dest[dp+dpL+2] = w[5];
                        dest[dp+dpL+3] = w[5];
                        Interp6(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 246:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        Interp6(dp+dpL, w[5], w[4], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        dest[dp+dpL+2] = w[5];
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        dest[dp+(dpL * 3)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 254:
                    {
                        Interp8(dp, w[5], w[1]);
                        Interp1(dp+1, w[5], w[1]);
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        Interp1(dp+dpL, w[5], w[1]);
                        Interp3(dp+dpL+1, w[5], w[1]);
                        dest[dp+dpL+2] = w[5];
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                        dest[dp+(dpL * 3)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 253:
                    {
                        Interp8(dp, w[5], w[2]);
                        Interp8(dp+1, w[5], w[2]);
                        Interp8(dp+2, w[5], w[2]);
                        Interp8(dp+3, w[5], w[2]);
                        Interp3(dp+dpL, w[5], w[2]);
                        Interp3(dp+dpL+1, w[5], w[2]);
                        Interp3(dp+dpL+2, w[5], w[2]);
                        Interp3(dp+dpL+3, w[5], w[2]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL * 3)] = w[5];
                        }
                        else
                        {
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        }
                        dest[dp+(dpL * 3)+1] = w[5];
                        dest[dp+(dpL * 3)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 251:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        Interp1(dp+2, w[5], w[3]);
                        Interp8(dp+3, w[5], w[3]);
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+dpL+2, w[5], w[3]);
                        Interp1(dp+dpL+3, w[5], w[3]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL * 3)] = w[5];
                        }
                        else
                        {
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        }
                        dest[dp+(dpL * 3)+1] = w[5];
                        break;
                    }
                case 239:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                        }
                        dest[dp+1] = w[5];
                        Interp3(dp+2, w[5], w[6]);
                        Interp8(dp+3, w[5], w[6]);
                        dest[dp+dpL] = w[5];
                        dest[dp+dpL+1] = w[5];
                        Interp3(dp+dpL+2, w[5], w[6]);
                        Interp8(dp+dpL+3, w[5], w[6]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[6]);
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[6]);
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL * 3)] = w[5];
                        }
                        else
                        {
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        }
                        dest[dp+(dpL * 3)+1] = w[5];
                        Interp3(dp+(dpL * 3)+2, w[5], w[6]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[6]);
                        break;
                    }
                case 127:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                        }
                        dest[dp+1] = w[5];
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+2] = w[5];
                            dest[dp+3] = w[5];
                            dest[dp+dpL+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+2, w[2], w[5]);
                            Interp5(dp+3, w[2], w[6]);
                            Interp5(dp+dpL+3, w[6], w[5]);
                        }
                        dest[dp+dpL] = w[5];
                        dest[dp+dpL+1] = w[5];
                        dest[dp+dpL+2] = w[5];
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                            dest[dp+(dpL * 3)] = w[5];
                            dest[dp+(dpL * 3)+1] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/), w[4], w[5]);
                            Interp5(dp+(dpL * 3), w[8], w[4]);
                            Interp5(dp+(dpL * 3)+1, w[8], w[5]);
                        }
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[9]);
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[9]);
                        Interp1(dp+(dpL * 3)+2, w[5], w[9]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[9]);
                        break;
                    }
                case 191:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                        }
                        dest[dp+1] = w[5];
                        dest[dp+2] = w[5];
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+3] = w[5];
                        }
                        else
                        {
                            Interp2(dp+3, w[5], w[2], w[6]);
                        }
                        dest[dp+dpL] = w[5];
                        dest[dp+dpL+1] = w[5];
                        dest[dp+dpL+2] = w[5];
                        dest[dp+dpL+3] = w[5];
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+2, w[5], w[8]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+3, w[5], w[8]);
                        Interp8(dp+(dpL * 3), w[5], w[8]);
                        Interp8(dp+(dpL * 3)+1, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+2, w[5], w[8]);
                        Interp8(dp+(dpL * 3)+3, w[5], w[8]);
                        break;
                    }
                case 223:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                            dest[dp+1] = w[5];
                            dest[dp+dpL] = w[5];
                        }
                        else
                        {
                            Interp5(dp, w[2], w[4]);
                            Interp5(dp+1, w[2], w[5]);
                            Interp5(dp+dpL, w[4], w[5]);
                        }
                        dest[dp+2] = w[5];
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+3] = w[5];
                        }
                        else
                        {
                            Interp2(dp+3, w[5], w[2], w[6]);
                        }
                        dest[dp+dpL+1] = w[5];
                        dest[dp+dpL+2] = w[5];
                        dest[dp+dpL+3] = w[5];
                        Interp1(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[7]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[7]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                            dest[dp+(dpL * 3)+2] = w[5];
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp5(dp+(dpL << 1 /*==dpL * 2*/)+3, w[6], w[5]);
                            Interp5(dp+(dpL * 3)+2, w[8], w[5]);
                            Interp5(dp+(dpL * 3)+3, w[8], w[6]);
                        }
                        Interp8(dp+(dpL * 3), w[5], w[7]);
                        Interp1(dp+(dpL * 3)+1, w[5], w[7]);
                        break;
                    }
                case 247:
                    {
                        Interp8(dp, w[5], w[4]);
                        Interp3(dp+1, w[5], w[4]);
                        dest[dp+2] = w[5];
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+3] = w[5];
                        }
                        else
                        {
                            Interp2(dp+3, w[5], w[2], w[6]);
                        }
                        Interp8(dp+dpL, w[5], w[4]);
                        Interp3(dp+dpL+1, w[5], w[4]);
                        dest[dp+dpL+2] = w[5];
                        dest[dp+dpL+3] = w[5];
                        Interp8(dp+(dpL << 1 /*==dpL * 2*/), w[5], w[4]);
                        Interp3(dp+(dpL << 1 /*==dpL * 2*/)+1, w[5], w[4]);
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                        Interp8(dp+(dpL * 3), w[5], w[4]);
                        Interp3(dp+(dpL * 3)+1, w[5], w[4]);
                        dest[dp+(dpL * 3)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
                case 255:
                    {
                        if (Diff(w[4], w[2]))
                        {
                            dest[dp] = w[5];
                        }
                        else
                        {
                            Interp2(dp, w[5], w[2], w[4]);
                        }
                        dest[dp+1] = w[5];
                        dest[dp+2] = w[5];
                        if (Diff(w[2], w[6]))
                        {
                            dest[dp+3] = w[5];
                        }
                        else
                        {
                            Interp2(dp+3, w[5], w[2], w[6]);
                        }
                        dest[dp+dpL] = w[5];
                        dest[dp+dpL+1] = w[5];
                        dest[dp+dpL+2] = w[5];
                        dest[dp+dpL+3] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+1] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+2] = w[5];
                        dest[dp+(dpL << 1 /*==dpL * 2*/)+3] = w[5];
                        if (Diff(w[8], w[4]))
                        {
                            dest[dp+(dpL * 3)] = w[5];
                        }
                        else
                        {
                            Interp2(dp+(dpL * 3), w[5], w[8], w[4]);
                        }
                        dest[dp+(dpL * 3)+1] = w[5];
                        dest[dp+(dpL * 3)+2] = w[5];
                        if (Diff(w[6], w[8]))
                        {
                            dest[dp+(dpL * 3)+3] = w[5];
                        }
                        else
                        {
                            Interp2(dp+(dpL * 3)+3, w[5], w[8], w[6]);
                        }
                        break;
                    }
            }
            sp++;
            //dp += 4; optimized
            dp <<= 2;
        }
        dp += (dpL * 3);
    }
}

})(this);