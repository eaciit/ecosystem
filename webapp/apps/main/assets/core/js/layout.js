viewModel.appName = ko.observable('Ecosystem')
viewModel.title = ko.observable('Ecosystem')
viewModel.title.subscribe(function (value) {
  var text = viewModel.appName() + (value != '' ? (' | ' + value) : '')
  jQuery('title').text(text)
})
viewModel.isNotLoginPage = ko.observable(true)

viewModel.isLoading = function (show) {
  if (show) {
    $('#loader').css('opacity', 0).show().animate({
      opacity: 1
    }, 'fast')
  } else {
    $('#loader').animate({
      opacity: 0
    }, 'fast', function () {
      $('#loader').hide().css('opacity', 1)
    })
  }
}

viewModel.normalizeData = function (e, dateOrStr) {
  if (dateOrStr == undefined) {
    dateOrStr = 'date'
  }

  Object.keys(e).forEach(function (k) {
    if (typeof e[k] == 'string' && e[k] != null && e[k] != undefined) {
      if (e[k].indexOf('/Date') >= 0) {
        var dt = (dateOrStr == 'str') ? jsonDateStr(e[k]) : jsonDate(e[k])
        e[k] = dt
      }
    } else if (typeof e[k] == 'object') {
      e[k] = normalizeData(e[k])
    }
  })

  return e
}
viewModel.ajaxPost = function (url, data, callbackOK, callbackNope) {
  if (typeof data === 'undefined') data = {}
  if (typeof callbackOK === 'undefined') callbackOK = {}
  if (typeof callbackNope === 'undefined') callbackNope = {}

  return $.ajax({
    url: url,
    type: 'POST',
    data: ko.mapping.toJSON(data),
    contentType: 'application/json charset=utf-8',
    success: function (data) {
      callbackOK(data)
    },
    error: function (error) {
      if (typeof callbackNope !== 'function') {
        alert('There was an error posting the data to the server: ' + error.responseText)
        return
      }

      callbackNope(error)
    }
  })
}

viewModel.randomString = function (len) {
  var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var randomString = ''
  for (var i = 0; i < len; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length)
    randomString += charSet.substring(randomPoz, randomPoz + 1)
  }
  return randomString
}

viewModel.convertHexToRGBA = function (hex, alpha) {
  alpha = alpha || 1
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    var c = hex.substring(1).split('')
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]]
    }
    c = '0x' + c.join('')
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255, alpha].join(',') + ')'
  }

  return hex
}

viewModel.prepareTooltipsterGrid = function (obj) {
  setTimeout(function () {
    viewModel.prepareTooltipster($(obj.element).find('[data-tooltipster]'))
  }, 310)
}

viewModel.prepareTooltipster = function ($o, argConfig) {
  var $tooltipster = (typeof $o === 'undefined') ? $('[data-tooltipster]') : $o

  $tooltipster.each(function (i, e) {
    var position = 'top'

    var config = {
      // theme: 'tooltipster-val',
      animation: 'grow',
      delay: 0,
      offsetY: -5,
      touchDevices: false,
      trigger: 'hover',
      position: position,
      content: $('<div />').html($(e).attr('data-tooltipster'))
    }
    if (typeof argConfig !== 'undefined') {
      config = $.extend(true, config, argConfig)
    }

    $(e).tooltipster(config)
  })
}

viewModel.ajaxPostCallback = function (url, param, callback, config) {
  config = (typeof config === 'undefined') ? {} : config

  if (config.hasOwnProperty('loader') ? config.loader : true) {
    viewModel.isLoading(true)
  }

  ajaxPost(url, param, function (res) {
    setTimeout(function () {
      viewModel.isLoading(false)

      if (res.Status !== 'OK') {
        swal("Error!", res.Message, "error")
        return
      }

      callback(res.Data, res)
    }, 310)
  }, function (res) {
    setTimeout(function () {
      viewModel.isLoading(false)
      swal("Error!", "Unknown error, please try again", "error")
    }, 310)
  })
}

viewModel.computed = function (callback, watchable) {
  return ko.computed(function () {
    return callback()
  }, watchable)
}

viewModel.isFormValid = function ($o) {
  var $validator = ((typeof $o === 'string') ? $($o) : $o).kendoValidator().data("kendoValidator")
  return $validator.validate()
}

viewModel.getQueryString = function (name, url) {
  if (!url) url = window.location.href
  name = name.replace(/[\[\]]/g, "\\$&")
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url)
  if (!results) return ''
  if (!results[2]) return ''

  return decodeURIComponent(results[2].replace(/\+/g, " "))
}

window.normalizeData = viewModel.normalizeData
window.ajaxPost = viewModel.ajaxPost

// ======================== end of reusable library

viewModel.registerSidebarToggle = function () {
  $('.layout-sidebar .navbar-nav li a.toggler').on('click', function () {
    if ($('body').hasClass('close-sidebar')) {
      $('body').removeClass('close-sidebar')
    } else {
      $('body').addClass('close-sidebar')
    }
  })
}

viewModel.dataNavigationMenuTree = ko.observableArray([])

viewModel.getNavigationMenu = function () {
  viewModel.dataNavigationMenuTree([{
    Icon: "bar-chart",
    Title: "Dashboard",
    Url: "/main/dashboard/index"
  },{
    Icon: "sitemap",
    Title: "Counter Party View",
    Url: ""
  },{
    Icon: "random",
    Title: "Missed Flow Analysis",
    Url: ""
  },{
    Icon: "cog",
    Title: "Recommend Engine",
    Url: ""
  }])
}

viewModel.checkLoadedPageAccess = function () {
  var allowanceMessage = viewModel.getQueryString('NotAllowed')
  if (allowanceMessage !== '') {
    swal({
      title: 'Not Authorized',
      text: allowanceMessage,
      type: 'error',
      timer: 2000,
      showConfirmButton: false
    })
  }
}

viewModel.checkActiveMenu = function (path) {
  window.location.pathname == path
}

$(function () {
  viewModel.getNavigationMenu()
  viewModel.registerSidebarToggle()
  viewModel.checkLoadedPageAccess()
})