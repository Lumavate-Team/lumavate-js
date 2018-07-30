var jsfeat = require('jsfeat');
var BaseTracker = require('./base-tracker');
//var ShapeDetector = require('shape-detector');
var OrbTracker = (function (){

  var OrbTracker = function(component){
    BaseTracker.call(this, component);

    this.imgTemplate =null;

    this.img_u8 = new jsfeat.matrix_t(640, 480, jsfeat.U8_t | jsfeat.C1_t);
    // after blur
    this.img_u8_smooth = new jsfeat.matrix_t(640, 480, jsfeat.U8_t | jsfeat.C1_t);
    // we wll limit to 500 strongest points
    this.screen_descriptors = new jsfeat.matrix_t(32, 500, jsfeat.U8_t | jsfeat.C1_t);
    this.pattern_descriptors = [];
    this.screen_corners = [];
    this.pattern_corners = [];
    this.matches = [];

    this.num_train_levels = 4;
    // transform matrix
    this.homographyMatrix = new jsfeat.matrix_t(3,3,jsfeat.F32C1_t);
    this.match_mask = new jsfeat.matrix_t(500,1,jsfeat.U8C1_t);

    this.lapThreshold = 60;
    this.eigenThreshold = 10;
    this.patternLoading = false;
//    this.shapeDetector = new ShapeDetector(ShapeDetector.defaultShapes);
  }

  OrbTracker.prototype = Object.create(BaseTracker.prototype);
  OrbTracker.prototype.constructor = OrbTracker;

  OrbTracker.prototype.init = function(videoId, canvas, context){
    BaseTracker.prototype.init.call(this, videoId.replace('#',''), canvas, context);
    document.getElementById(this.videoId).style.display = 'none';
    this.descriptors = new jsfeat.matrix_t(32, 500, jsfeat.U8C1_t);

    var i = 640*480;
    while(--i >= 0) {
      this.screen_corners[i] = new jsfeat.keypoint_t(0,0,0,0,-1);
      this.matches[i] = new helpers.matchT();
    }

    jsfeat.yape06.laplacian_threshold = this.properties.laplacianThreshold|0;
    jsfeat.yape06.min_eigen_value_threshold = this.properties.minEigenValueThreshold|0;
  };

  OrbTracker.prototype.getTracker = function(){
  }

  OrbTracker.prototype.loadPattern = function() {
    this.patternLoading = true;
    var canvas = document.createElement('canvas');
    var ctx    = canvas.getContext('2d');
    var templateImage = document.getElementById('templateImage');
    var width = templateImage.width;
    var height = templateImage.height;

    var scale_size = 640;
    var max_pattern_size = 512;
    var resizeScale = Math.min(scale_size/width, scale_size/height);
    /*
    var scaledWidth = width * resizeScale;
    var scaledHeight = height * resizeScale;
    */
    var scaledWidth = width;
    var scaledHeight = height;
    ctx.drawImage(templateImage, 0, 0, width, height,
                                   0, 0, scaledWidth, scaledHeight);
    var templateImageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);

    this.imgTemplate = new jsfeat.matrix_t(scaledWidth, scaledHeight, jsfeat.U8_t | jsfeat.C1_t);
    this.imgTemplateSmooth = new jsfeat.matrix_t(scaledWidth, scaledHeight, jsfeat.U8_t | jsfeat.C1_t);

    jsfeat.imgproc.grayscale(templateImageData.data, scaledWidth, scaledHeight, this.imgTemplate);

    var lev=0, i=0;
    var sc = 1.0;
    var max_per_level = 300;
    var sc_inc = Math.sqrt(2.0); // magic number ;)

    var lev0_img = new jsfeat.matrix_t(this.imgTemplate.cols, this.imgTemplate.rows, jsfeat.U8_t | jsfeat.C1_t);
    var lev_img = new jsfeat.matrix_t(this.imgTemplate.cols, this.imgTemplate.rows, jsfeat.U8_t | jsfeat.C1_t);
    var new_width=0, new_height=0;
    var lev_corners, lev_descr;
    var corners_num=0;

    var sc0 = Math.min(max_pattern_size/scaledWidth, max_pattern_size/scaledHeight);
    new_width = (this.imgTemplate.cols * sc0)|0;
    new_height = (this.imgTemplate.rows * sc0)|0;

    lev0_img = this.imgTemplate;
    jsfeat.imgproc.resample(this.imgTemplate, lev0_img, new_width, new_height);

    // prepare preview
    this.pattern_preview = new jsfeat.matrix_t(new_width>>1, new_height>>1, jsfeat.U8_t | jsfeat.C1_t);
    jsfeat.imgproc.pyrdown(lev0_img, this.pattern_preview);

    for(lev=0; lev < this.num_train_levels; ++lev) {
        this.pattern_corners[lev] = [];
        lev_corners = this.pattern_corners[lev];

        // preallocate corners array
        i = (new_width*new_height) >> lev;
        while(--i >= 0) {
            lev_corners[i] = new jsfeat.keypoint_t(0,0,0,0,-1);
        }

        this.pattern_descriptors[lev] = new jsfeat.matrix_t(32, max_per_level, jsfeat.U8_t | jsfeat.C1_t);
    }

    // do the first level
    lev_corners = this.pattern_corners[0];
    lev_descr = this.pattern_descriptors[0];

    jsfeat.imgproc.gaussian_blur(lev0_img, lev_img, this.properties.blurRadius|0); // this is more robust
    corners_num = helpers.detectKeypoints(lev_img, lev_corners, max_per_level);
    jsfeat.orb.describe(lev_img, lev_corners, corners_num, lev_descr);

    console.log("train " + lev_img.cols + "x" + lev_img.rows + " points: " + corners_num);

    sc /= sc_inc;

    // lets do multiple scale levels
    // we can use Canvas context draw method for faster resize
    // but its nice to demonstrate that you can do everything with jsfeat
    for(lev = 1; lev < this.num_train_levels; ++lev) {
        lev_corners = this.pattern_corners[lev];
        lev_descr = this.pattern_descriptors[lev];

        new_width = (lev0_img.cols*sc)|0;
        new_height = (lev0_img.rows*sc)|0;

        jsfeat.imgproc.resample(lev0_img, lev_img, new_width, new_height);
        jsfeat.imgproc.gaussian_blur(lev_img, lev_img, this.blurRadius|0);
        corners_num = helpers.detectKeypoints(lev_img, lev_corners, max_per_level);
        jsfeat.orb.describe(lev_img, lev_corners, corners_num, lev_descr);

        // fix the coordinates due to scale level
        for(i = 0; i < corners_num; ++i) {
            lev_corners[i].x *= 1./sc;
            lev_corners[i].y *= 1./sc;
        }

        console.log("train " + lev_img.cols + "x" + lev_img.rows + " points: " + corners_num);

        sc /= sc_inc;
    }
    this.patternLoading = false;
  };

  OrbTracker.prototype.track = function(){
    var video = document.getElementById(this.videoId);
    if(video.readyState !== video.HAVE_ENOUGH_DATA || this.patternLoading) {
      requestAnimationFrame(this.track.bind(this));
      return;
    }

    if(!this.pattern_preview ){
      this.loadPattern();

      requestAnimationFrame(this.track.bind(this));
      return;
    }
    this.context.drawImage(video, 0, 0, 640, 480);
    var imageData = this.context.getImageData(0, 0, 640, 480);
    jsfeat.imgproc.grayscale(imageData.data, 640, 480, this.img_u8);
    jsfeat.imgproc.gaussian_blur(this.img_u8, this.img_u8_smooth, this.properties.blurRadius|0);

    jsfeat.yape06.laplacian_threshold = this.lapThreshold|0;
    jsfeat.yape06.min_eigen_value_threshold = this.eigenThreshold|0;
    var num_corners = helpers.detectKeypoints(this.img_u8_smooth, this.screen_corners, 500);
    jsfeat.orb.describe(this.img_u8_smooth, this.screen_corners, num_corners, this.screen_descriptors);

    var data_u32 = new Uint32Array(imageData.data.buffer);
    helpers.renderCorners(this.screen_corners, num_corners, data_u32, 640);
    var num_matches = 0;
    var good_matches = 0;
    if(this.pattern_preview) {
//      helpers.renderMonoImage(this.pattern_preview.data, data_u32, this.pattern_preview.cols, this.pattern_preview.rows, 640);
      num_matches = this.matchPattern();
      good_matches = this.findTransform(this.matches, num_matches);
    }
    this.context.putImageData(imageData, 0, 0);
    if(num_matches) {
//      this.renderMatches(this.matches, num_matches);
      document.getElementById("matchPoints").innerHTML = "Good match points: " + good_matches;
      if(good_matches > this.properties.goodMatchPoints){
        helpers.renderPatternShape(this.context, this.pattern_preview, this.homographyMatrix, this.shapeDetector);
      }
    }

    requestAnimationFrame(this.track.bind(this));
  }

  OrbTracker.prototype.matchPattern = function(){
    var q_cnt = this.screen_descriptors.rows;
    var query_du8 = this.screen_descriptors.data;
    var query_u32 = this.screen_descriptors.buffer.i32; // cast to integer buffer
    var qd_off = 0;
    var qidx=0,lev=0,pidx=0,k=0;
    var num_matches = 0;

    for(qidx = 0; qidx < q_cnt; ++qidx) {
        var best_dist = 256;
        var best_dist2 = 256;
        var best_idx = -1;
        var best_lev = -1;

        for(lev = 0; lev < this.num_train_levels; ++lev) {
            var lev_descr = this.pattern_descriptors[lev];
            var ld_cnt = lev_descr.rows;
            var ld_i32 = lev_descr.buffer.i32; // cast to integer buffer
            var ld_off = 0;

            for(pidx = 0; pidx < ld_cnt; ++pidx) {

                var curr_d = 0;
                // our descriptor is 32 bytes so we have 8 Integers
                for(k=0; k < 8; ++k) {
                    curr_d += helpers.popcnt32( query_u32[qd_off+k]^ld_i32[ld_off+k] );
                }

                if(curr_d < best_dist) {
                    best_dist2 = best_dist;
                    best_dist = curr_d;
                    best_lev = lev;
                    best_idx = pidx;
                } else if(curr_d < best_dist2) {
                    best_dist2 = curr_d;
                }

                ld_off += 8; // next descriptor
            }
        }

        // filter out by some threshold
        if(best_dist < this.properties.matchThreshold) {
            this.matches[num_matches].screen_idx = qidx;
            this.matches[num_matches].pattern_lev = best_lev;
            this.matches[num_matches].pattern_idx = best_idx;
            num_matches++;
        }

        qd_off += 8; // next query descriptor
    }

    return num_matches;
  }

  OrbTracker.prototype.renderMatches = function(matches, count){
    for(var i = 0; i < count; ++i) {
      var m = matches[i];
      var s_kp = this.screen_corners[m.screen_idx];
      var p_kp = this.pattern_corners[m.pattern_lev][m.pattern_idx];
      if(this.match_mask.data[i]) {
          this.context.strokeStyle = "rgb(0,255,0)";
      } else {
          this.context.strokeStyle = "rgb(255,0,0)";
      }
      this.context.beginPath();
      this.context.moveTo(s_kp.x,s_kp.y);
      this.context.lineTo(p_kp.x*0.5, p_kp.y*0.5); // our preview is downscaled
      this.context.lineWidth=1;
      this.context.stroke();
    }
  }


  // estimate homography transform between matched points
  OrbTracker.prototype.findTransform = function(matches, count){
    // motion kernel
    var mm_kernel = new jsfeat.motion_model.homography2d();
    // ransac params
    var num_model_points = 4;
    var reproj_threshold = 5;
    var ransac_param = new jsfeat.ransac_params_t(num_model_points,
                                                  reproj_threshold, 0.5, 0.99);
    var pattern_xy = [];
    var screen_xy = [];
    // construct correspondences
    for(var i = 0; i < count; ++i) {
        var m = matches[i];
        var s_kp = this.screen_corners[m.screen_idx];
        var p_kp = this.pattern_corners[m.pattern_lev][m.pattern_idx];
        pattern_xy[i] = {"x":p_kp.x, "y":p_kp.y};
        screen_xy[i] =  {"x":s_kp.x, "y":s_kp.y};
    }
    // estimate motion
    var ok = false;
    ok = jsfeat.motion_estimator.ransac(ransac_param, mm_kernel,
                                        pattern_xy, screen_xy, count, this.homographyMatrix, this.match_mask, 1000);
    // extract good matches and re-estimate
    var good_cnt = 0;
    if(ok) {
        for(var i=0; i < count; ++i) {
            if(this.match_mask.data[i]) {
                pattern_xy[good_cnt].x = pattern_xy[i].x;
                pattern_xy[good_cnt].y = pattern_xy[i].y;
                screen_xy[good_cnt].x = screen_xy[i].x;
                screen_xy[good_cnt].y = screen_xy[i].y;
                good_cnt++;
            }
        }
        // run kernel directly with inliers only
        mm_kernel.run(pattern_xy, screen_xy, this.homographyMatrix, good_cnt);
    } else {
        jsfeat.matmath.identity_3x3(this.homographyMatrix, 1.0);
    }
    return good_cnt;
  };

  var helpers = (function () {
    function matchT(screen_idx, pattern_lev, pattern_idx, distance) {
      if (typeof screen_idx === "undefined") { screen_idx=0; }
      if (typeof pattern_lev === "undefined") { pattern_lev=0; }
      if (typeof pattern_idx === "undefined") { pattern_idx=0; }
      if (typeof distance === "undefined") { distance=0; }
      this.screen_idx = screen_idx;
      this.pattern_lev = pattern_lev;
      this.pattern_idx = pattern_idx;
      this.distance = distance;
    }

    function detectKeypoints(img, corners, max_allowed) {
      // detect features
      var count = jsfeat.yape06.detect(img, corners, 17);
      // sort by score and reduce the count if needed
      if(count > max_allowed) {
        jsfeat.math.qsort(corners, 0, count-1, function(a,b){
          return (b.score<a.score);
        });
        count = max_allowed;
      }
      // calculate dominant orientation for each keypoint
      for(var i = 0; i < count; ++i) {
          corners[i].angle = ic_angle(img, corners[i].x, corners[i].y);
      }
      return count;
    }


    var u_max = new Int32Array([15,15,15,15,14,14,14,13,13,12,11,10,9,8,6,3,0]);

    function ic_angle(img, px, py) {
      var half_k = 15; // half patch size
      var m_01 = 0, m_10 = 0;
      var src=img.data, step=img.cols;
      var u=0, v=0, center_off=(py*step + px)|0;
      var v_sum=0,d=0,val_plus=0,val_minus=0;
      // Treat the center line differently, v=0
      for (u = -half_k; u <= half_k; ++u)
          m_10 += u * src[center_off+u];
      // Go line by line in the circular patch
      for (v = 1; v <= half_k; ++v) {
          // Proceed over the two lines
          v_sum = 0;
          d = u_max[v];
          for (u = -d; u <= d; ++u) {
              val_plus = src[center_off+u+v*step];
              val_minus = src[center_off+u-v*step];
              v_sum += (val_plus - val_minus);
              m_10 += u * (val_plus + val_minus);
          }
          m_01 += v * v_sum;
      }
      return Math.atan2(m_01, m_10);
    }


    // non zero bits count
    function popcnt32(n) {
      n -= ((n >> 1) & 0x55555555);
      n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
      return (((n + (n >> 4))& 0xF0F0F0F)* 0x1010101) >> 24;
    }

    // project/transform rectangle corners with 3x3 Matrix
    function tCorners(M, w, h) {
      var pt = [ {'x':0,'y':0}, {'x':w,'y':0}, {'x':w,'y':h}, {'x':0,'y':h} ];
      var z=0.0, i=0, px=0.0, py=0.0;

      for (; i < 4; ++i) {
          px = M[0]*pt[i].x + M[1]*pt[i].y + M[2];
          py = M[3]*pt[i].x + M[4]*pt[i].y + M[5];
          z = M[6]*pt[i].x + M[7]*pt[i].y + M[8];
          pt[i].x = px/z;
          pt[i].y = py/z;
      }

      return pt;
    }
    function renderPatternShape(ctx, pattern_preview, homographyMatrix, detector) {
      // get the projected pattern corners
      let shape_pts = tCorners(homographyMatrix.data, pattern_preview.cols*2, pattern_preview.rows*2);
      let pts = new Array(5);
      for(var i=0;i<4;i++){
        pts[i]=shape_pts[i];
      }
      pts[4] = shape_pts[0];
      /*
      let shape = detector.spot(pts);
      if(shape.pattern != 'square' && shape.pattern != 'rectangle'){
        return false;
      }
      */
      ctx.strokeStyle = "rgb(0,255,0)";
      ctx.beginPath();

      ctx.moveTo(shape_pts[0].x,shape_pts[0].y);
      ctx.lineTo(shape_pts[1].x,shape_pts[1].y);
      ctx.lineTo(shape_pts[2].x,shape_pts[2].y);
      ctx.lineTo(shape_pts[3].x,shape_pts[3].y);
      ctx.lineTo(shape_pts[0].x,shape_pts[0].y);
      ctx.lineWidth=4;
      ctx.stroke();
      return true;
    }

    function renderCorners(corners, count, img, step) {
      var pix = (0xff << 24) | (0x00 << 16) | (0xff << 8) | 0x00;
      for(var i=0; i < count; ++i)
      {
        var x = corners[i].x;
        var y = corners[i].y;
        var off = (x + y * step);
        img[off] = pix;
        img[off-1] = pix;
        img[off+1] = pix;
        img[off-step] = pix;
        img[off+step] = pix;
      }
    }

    function renderMonoImage(src, dst, sw, sh, dw) {
      var alpha = (0xff << 24);
      for(var i = 0; i < sh; ++i) {
        for(var j = 0; j < sw; ++j) {
          var pix = src[i*sw+j];
          dst[i*dw+j] = alpha | (pix << 16) | (pix << 8) | pix;
        }
      }
    }

    return {
      matchT: matchT,
      detectKeypoints: detectKeypoints,
      popcnt32: popcnt32,
      renderPatternShape: renderPatternShape,
      renderCorners: renderCorners,
      renderMonoImage: renderMonoImage


    };
  })();

  return OrbTracker;
})();
module.exports = OrbTracker;

