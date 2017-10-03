var dashboard = {}
dashboard.entities = ko.observableArray([])
dashboard.activeEntity = ko.observable()
dashboard.region = [{
  "value": "ASA",
  "text": "ASA"
}, {
  "value": "AME",
  "text": "AME"
}, {
  "value": "GCNA",
  "text": "GCNA"
}]

dashboard.country = [{
  "value": "CN",
  "text": "CHINA"
}, {
  "value": "BT",
  "text": "BHUTAN"
}, {
  "value": "BY",
  "text": "BELARUS"
}]

dashboard.businessmatric = [{
  "value": "CIB",
  "text": "CIB"
}, {
  "value": "TBD",
  "text": "TBD"
}, {
  "value": "NETWORK",
  "text": "NETWORK"
}]

dashboard.payment = [{
  "value": "CASH",
  "text": "Cash"
}, {
  "value": "INSTALLMENT",
  "text": "Installment"
}]

dashboard.mapsdata1 = [{
    _id: 1,
    location: [-7.274879, 111.6099528],
    name: "Jakarta, Indonesia",
    entities: "MEGLOBAL INTERNATIONAL FZE"
  },
  {
    _id: 2,
    location: [1.3440852, 103.6839573],
    name: "Singapore, Singapore",
    entities: "MEGLOBAL INTERNATIONAL FZE"
  }
]
dashboard.mapsdata2 = [{
    _id: 21,
    location: [13.7245601, 100.4930264],
    name: "Bangkok, Thailand",
    entities: "MEGLOBAL INTERNATIONAL FZE"
  },
  {
    _id: 22,
    location: [25.0171608, 121.3662942],
    name: "Taipei, Taiwan",
    entities: "MEGLOBAL INTERNATIONAL FZE"
  }
]
dashboard.mapsdata3 = [{
    _id: 31,
    location: [35.006095, 135.7259306],
    name: "Kyoto, Japan",
    entities: "MEGLOBAL INTERNATIONAL FZE"
  },
  {
    _id: 32,
    location: [37.5650172, 126.8494673],
    name: "Seol, South Korea",
    entities: "MEGLOBAL INTERNATIONAL FZE"
  }
]

var widget = {}

widget.ETB = ko.observable(0)
widget.Buyer = ko.observable(0)
widget.Seller = ko.observable(0)
widget.InFlow = ko.observable(0)
widget.OutFlow = ko.observable(0)
widget.Pipeline = ko.observable(0)

widget.buildChart = function (id, data) {
  $(id).kendoChart({
    title: {
      text: ""
    },
    chartArea: {
      background: ""
    },
    legend: {
      visible: false
    },
    series: [{
      type: "line",
      data: data,
      style: "smooth",
      markers: {
        visible: false
      }
    }],
    categoryAxis: {
      visible: false,
      majorGridLines: {
        visible: false
      }
    },
    valueAxis: {
      visible: false,
      majorGridLines: {
        visible: false
      }
    }
  })
}

widget.generateChart1 = function () {
  var data = [4, 1, 7, 2, 10]
  widget.buildChart("#widgetChart1", data)
}

widget.generateChart2 = function () {
  var data = [1, 5, 1, 2, 11]
  widget.buildChart("#widgetChart2", data)
}

widget.generateChart3 = function () {
  var data = [8, 7, 7, 9, 2]
  widget.buildChart("#widgetChart3", data)
}

widget.generateChart4 = function () {
  var data = [2, 9, 3, 6, 1]
  widget.buildChart("#widgetChart4", data)
}

widget.generateChart5 = function () {
  var data = [1, 1, 1, 2, 10]
  widget.buildChart("#widgetChart5", data)
}

widget.generateChart6 = function () {
  var data = [6, 1, 10, 1, 10]
  widget.buildChart("#widgetChart6", data)
}

widget.generateCharts = function () {
  widget.generateChart1()
  widget.generateChart2()
  widget.generateChart3()
  widget.generateChart4()
  widget.generateChart5()
  widget.generateChart6()
}

widget.loadData = function () {
  viewModel.ajaxPostCallback("/main/dashboard/getetb", {}, function(data) {
    widget.ETB(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getbuyer", {}, function(data) {
    widget.Buyer(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getseller", {}, function(data) {
    widget.Seller(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getinflow", {}, function(data) {
    widget.InFlow(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getoutflow", {}, function(data) {
    widget.OutFlow(data)
  })
}

dashboard.generateMap = function () {
  var template = mapTemplate

  $("#map").kendoMap({
    controls: {
      navigator: false
    },
    center: [18.062312304546726, 108.28125],
    zoom: 3,
    layers: [{
      type: "shape",
      dataSource: {
        data: template.features,
      },
      style: {
        fill: {
          opacity: 0.5
        }
      }
    }, {
      type: "marker",
      dataSource: dashboard.mapsdata1,
      shape: "pinRed",
      locationField: "location",
      titleField: "name"
    }, {
      type: "marker",
      dataSource: dashboard.mapsdata2,
      shape: "pinBlue",
      locationField: "location",
      titleField: "name"
    }, {
      type: "marker",
      dataSource: dashboard.mapsdata3,
      shape: "pinGreen",
      locationField: "location",
      titleField: "name"
    }],
    markerClick: onClickMarker
  });

  $("#map").unbind("mousewheel")
  $("#map").unbind("DOMMouseScroll")

  function onClickMarker(e) {
    dashboard.showMapDetails()
    dashboard.activeEntity(e.marker.dataItem.entities)
    $("#mapDetailModal").modal("show")
  }
}

dashboard.btnTrade = function () {
  $("#groupbuttondetail").hide()
  $("#tradetabs").show()
}

dashboard.showMapDetails = function () {

}

$(window).load(function () {
  widget.loadData()
  widget.generateCharts()
  dashboard.generateMap()
})