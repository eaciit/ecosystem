// Math and Statistics
function std(array) {
  var avg = _.sum(array) / array.length;
  return Math.sqrt(_.sum(_.map(array, (i) => Math.pow((i - avg), 2))) / array.length);
};

_.mixin({
  median: function (data) {
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
  mean: function (data) {
    if (data.length < 1) return 0;
    return _.reduce(data, function (memo, num) {
      return memo + num;
    }, 0) / data.length;
  },
  var: function (data) {
    if (data.length < 1) return 0;
    var setMean = _.mean(data);
    var totalVariance = _.reduce(data, function (memo, num) {
      return memo + Math.pow(num - setMean, 2);
    }, 0);
    return totalVariance / data.length
  },
  stdev: function (data) {
    if (data.length < 1) return 0;
    return Math.sqrt(_.var(data));
  },
  cov: function (x, y) {
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

// Others
$.urlParam = function (name) {
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
  if (results !== null) {
    return decodeURI(results[1]);
  } else {
    return null;
  }
}

function currencynum(angka) {
  if (angka >= 0) {
    var TotString = kendo.toString(angka, "n");
    return TotString;
  } else {
    var TotminString = kendo.toString(Math.abs(angka), "n");
    return "(" + TotminString + ")";
  }
}

function setbm(num) {
     if (num >= 1000000000) {
        return currencynum((num / 1000000000).toFixed(2).replace(/\.0$/, '')) + 'B';
     }
     if (num >= 1000000) {
        return currencynum((num / 1000000).toFixed(2).replace(/\.0$/, '')) + 'M';
     }
     if (num >= 1000) {
        return currencynum((num / 1000).toFixed(2).replace(/\.0$/, '')) + 'K';
     }
     return currencynum(num.toFixed(2));
}

function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// KO Sneaky Update
ko.observable.fn.sneaky = function () {
  this.notifySubscribers = function () {
    if (!this.pauseNotifications) {
      ko.subscribable.fn.notifySubscribers.apply(this, arguments);
    }
  };

  this.sneakyUpdate = function (newValue) {
    this.pauseNotifications = true;
    this(newValue);
    this.pauseNotifications = false;
  };

  return this;
};

// KO beforeAfter
ko.subscribable.fn.subscribeChanged = function (callback) {
  var oldValue;
  this.subscribe(function (_oldValue) {
      oldValue = _oldValue;
  }, this, 'beforeChange');

  this.subscribe(function (newValue) {
      callback(newValue, oldValue);
  });
};