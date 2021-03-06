(function (exports) {

    var MultipleSVM = function(samples, lambda) {
      this.classNumber = samples.o;
      this.featureNumber = samples.i + 1;
      this.theta = [];
      this.x = [];
      this.y = [];

      if ( lambda !== undefined ) {
          this.lambda = lambda;
      }

      this._init = function() {
        var i,j;

        for(i = 0; i < samples.d.length; i++) {
          var x = [];
          x.push(1.0);
          x = x.concat( samples.d[i].slice(1));
          this.x.push(x);
          this.y.push( samples.d[i][0] );
        }

        for (i = 0; i < this.classNumber * this.featureNumber; i++) {
            this.theta.push(Math.random() * 0.0001);
        }

      }.bind(this);

      this.pred = function(sample) {
        var x = [];
        x.push(1.0);
        x = x.concat( sample.slice(1) );

        var maxScore = undefined;
        var maxLabel = -1;
        for(var c = 0; c < this.classNumber; c++) {
            var v = this._linear(x, c);
            if ( maxScore === undefined || v > maxScore) {
                maxScore = v;
                maxLabel = c;
            }
        }

        return maxLabel;
      }.bind(this);

      this.cost = function() {
        var sumCost = 0.0;
        var totalMargin = 0;
        var margin = 0;
        var reg = 0.0;

        var i,c;

        var scores = [];
        for (i = 0; i < this.x.length; i++) {
            for (c = 0; c < this.classNumber; c++) {
              scores[c] = this._linear(this.x[i], c);
            }
            for (c = 0; c < this.classNumber; c++) {
              margin = scores[c] - scores[this.y[i]] + 1;
              if (margin > 0.0 && c !== this.y[i]) {
                totalMargin = totalMargin + margin;
              }
            }
        }

        totalMargin = totalMargin / this.x.length;

        reg = 0.0;
        for (i = 0; i < this.classNumber * this.featureNumber; i++) {
          reg = reg + this.theta[i] * this.theta[i];
        }
        totalMargin = totalMargin + 0.5 * this.lambda * reg;

        return totalMargin;
      }.bind(this);

      this.bGrad = function(batch, gtheta) {
        var i, j, c;
        var index;
        var scores = [];

        // 初始化gtheta
        if ( gtheta === undefined) {
          gtheta = [];
        }
        for (i = 0; i < this.classNumber * this.featureNumber; i++) {
            gtheta[i] = this.theta[i] * this.lambda;
        }

        for(i = 0; i < batch.length; i++) {
          index = batch[i];
          for (c = 0; c < this.classNumber; c++) {
              scores[c] = this._linear(this.x[index], c);
          }

          for (c = 0; c < this.classNumber; c++) {
              margin = scores[c] - scores[this.y[index]] + 1;
              if (margin > 0.0 && c !== this.y[index]) {
                  for(i = 0; i < this.featureNumber; i++) {
                      gtheta[c*this.featureNumber + i] = gtheta[c*this.featureNumber + i]
                                                         + this.x[index][i] / this.x.length;

                      gtheta[this.y[index]*this.featureNumber + i] = gtheta[this.y[index]*this.featureNumber + i]
                                                         - this.x[index][i] / this.x.length;
                  }
              }
          }
        }

        return gtheta;
      };

      this.sGrad = function(index) {
        var gtheta = [];
        var scores = [];
        var i,c;
        var margin;

        for (i = 0; i < this.classNumber * this.featureNumber; i++) {
            gtheta.push( this.theta[i] * this.lambda );
        }
        for (c = 0; c < this.classNumber; c++) {
            scores[c] = this._linear(this.x[index], c);
        }

        for (c = 0; c < this.classNumber; c++) {
            margin = scores[c] - scores[this.y[index]] + 1;
            if (margin > 0.0 && c !== this.y[index]) {
                for(i = 0; i < this.featureNumber; i++) {
                    gtheta[c*this.featureNumber + i] = gtheta[c*this.featureNumber + i]
                                                       + this.x[index][i] / this.x.length;

                    gtheta[this.y[index]*this.featureNumber + i] = gtheta[this.y[index]*this.featureNumber + i]
                                                       - this.x[index][i] / this.x.length;
                }
            }
        }

        return gtheta;
      }.bind(this);

      this._linear = function(x, c) {
        var i;
        var sum = 0.0;
        var offset = c*this.featureNumber;
        for(i = 0; i < this.featureNumber; i++) {
          sum = sum + this.theta[offset + i] * x[i];
        }
        return sum;
      }.bind(this);


      this._init();
    };
    exports.MultipleSVM = MultipleSVM;

})( (typeof module != 'undefined' && module.exports) || elj );
