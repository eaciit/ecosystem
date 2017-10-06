function std(array) {
  var avg = _.sum(array) / array.length;
  return Math.sqrt(_.sum(_.map(array, (i) => Math.pow((i - avg), 2))) / array.length);
};

_.mixin({
  median: function(data) {
    if (data.length < 1) return 0;
    var slot = (data.length + 1) / 2;
    if (slot % 1 === 0) {
      return data[slot - 1];
    } else {
      var lower = Math.floor(slot);
      var upper = Math.ceil(slot);
      return (data[lower - 1] + data[lower - 1]) / 2;
    }
  },
  mean: function(data) {
    if (data.length < 1) return 0;
    return _.reduce(data, function(memo, num) {
      return memo + num;
    }, 0) / data.length;
  },
  var: function(data) {
    if (data.length < 1) return 0;
    var setMean = _.mean(data);
    var totalVariance = _.reduce(data, function(memo, num) {
      return memo + Math.pow(num - setMean, 2);
    }, 0);
    return totalVariance / data.length
  },
  stdev: function(data) {
    if (data.length < 1) return 0;
    return Math.sqrt(_.var(data));
  },
  cov: function(x, y) {
    if (x.length < 1 || y.length < 1) return 0;
    var mx = _.mean(x);
    var my = _.mean(y);
    var s = 0;
    for (var i = 0; i < x.length; i++) {
      s += (x[i] - mx) * (y[i] - my);
    }
    return s / x.length;
  }
});

function currencynum(angka) {
    if (angka >= 0) {
        var TotString = kendo.toString(angka, "n");
        return TotString;
    } else {
        var TotminString = kendo.toString(Math.abs(angka), "n");
        return "(" + TotminString + ")";
    }
}