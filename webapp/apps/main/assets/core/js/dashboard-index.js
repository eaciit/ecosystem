var dashboard = {}
dashboard.activeGroup = ko.observable("DOW CHEMICAL GROUP")
dashboard.activeEntities = ko.observable({})
dashboard.activeEntity = ko.observable({})
dashboard.inflow = ko.observable(true)
dashboard.outflow = ko.observable(true)
dashboard.other = ko.observable(true)
dashboard.dataAA = ko.observable()
dashboard.dataBB = ko.observable()
dashboard.activeEntityDetail = {
  noteHeaderModal: ko.observable(),
  dataProductMix: ko.observableArray([]),
  dataProductMixA: ko.observableArray([]),
  dataProductMixB: ko.observableArray([]),
  dataProductMixC: ko.observableArray([]),
  dataInFlow: ko.observableArray([]),
  dataOutFlow: ko.observableArray([]),
  sumInFlow: ko.observable(),
  sumOutFlow: ko.observable(),
}

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

var filter = {}
filter.payload = ko.computed(function () {
  return {
    fromYearMonth: parseInt(moment().subtract(1, "years").format("YYYYMM")),
    toYearMonth: parseInt(moment().format("YYYYMM")),
    groupName: dashboard.activeGroup()
  }
})

dashboard.getMapData = function (callback) {
  viewModel.ajaxPostCallback("/main/dashboard/getmapdata", filter.payload(), function (data) {
    $.getJSON("/main/static/core/js/countries.json", function (countries) {
      var result = _(data)
        .groupBy('country')
        .map(function (items, e) {
          var c = _.find(countries, {
            "country_code": e
          })
          var entities = _.map(items, 'entity')

          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: c.latlng.reverse(),
            },
            properties: {
              country: e,
              name: c.name,
              entities: entities,
              value: entities.length
            }
          }
        })
        .value()

      callback({
        type: "FeatureCollection",
        features: result
      })
    })
  })
}

var activeShape

dashboard.generateMapbox = function () {
  function generate(data) {
    L.mapbox.accessToken = 'pk.eyJ1IjoiYmFndXNjYWh5b25vIiwiYSI6ImNqOWpqbzBjYjByNXEzM2xnZ2ppcDBpN2EifQ.pFc9EQsAK5vd4ZWgCcAPJg'
    var map = L.mapbox.map('map', 'mapbox.light')
      .setView([1.3, 103.8], 3)

    var circles = L.geoJson(null, {
      pointToLayer: function (feature, ll) {
        return L.circle(ll, feature.properties.value * 100000, {
          color: "white",
          weight: 1,
          fillColor: "#428bca",
          fillOpacity: 0.5
        })
      }
    }).addTo(map)

    var texts = L.geoJson(null, {
      pointToLayer: function (feature, ll) {
        return L.marker(ll, {
          icon: L.divIcon({
            className: 'label',
            html: feature.properties.country,
            iconSize: [30, 12]
          })
        })
      }
    }).addTo(map)

    L.mapbox.featureLayer('mapbox.dc-markers')
      .on('ready', function (e) {
        circles.addData(data)
        texts.addData(data)

        circles.eachLayer(function (layer) {
          var prop = layer.feature.properties
          var template = kendo.template($("#tooltip-template").html())

          layer.bindPopup(template(prop))
          layer.on("click", function (e) {
            dashboard.activeEntities(prop)
          })
        })
      })
  }

  dashboard.getMapData(function (data) {
    generate(data)
  })
}

dashboard.showMapDetails = function (i) {
  dashboard.activeEntityDetail.noteHeaderModal("")
  dashboard.getEntityDetail(dashboard.activeEntities().entities[i])

  popup.close()
  popup.element.kendoStop(true, true)
}

dashboard.getEntityDetail = function (entityName) {
  viewModel.ajaxPostCallback("/main/dashboard/getentitydetail", {
    entityName: entityName
  }, function (data) {
    var bank = _(data.bank)
      .groupBy("product_category")
      .mapValues(function (items) {
        return _.groupBy(items, "flow")
      }).value()

    var product = _(data.product)
      .groupBy("product_category")
      .value()

    dashboard.activeEntity({
      name: entityName,
      bank: bank,
      product: product,
      country: dashboard.activeEntities().name
    })

    $("#mapDetailModal").modal("show")
  })
}

dashboard.bm = function (databm, sts) {
  if (databm < 1000000000) {
    var databmr = databm / 1000000
    databmr = currencynum(databmr)
    databmr = databmr + " M"
    return databmr
  } else if (databm >= 1000000000) {
    var databmr = databm / 1000000000
    databmr = currencynum(databmr)
    databmr = databmr + " B"
    return databmr
  }
}

dashboard.btnCash = function () {
  dashboard.activeEntityDetail.noteHeaderModal(" Cash")
  dashboard.activeEntityDetail.dataInFlow([])
  dashboard.activeEntityDetail.dataOutFlow([])
  dashboard.activeEntityDetail.sumInFlow(0)
  dashboard.activeEntityDetail.sumOutFlow(0)
  dashboard.other(false)
  // for trade  
  var data = dashboard.activeEntity().product.Cash
  var AA = []
  AA = dashboard.activeEntity().product.undefined[0].inward;
  var BB = []
  BB = dashboard.activeEntity().product.undefined[0].outward;
  dashboard.activeEntityDetail.dataProductMixA(AA)
  dashboard.activeEntityDetail.dataProductMixB(BB)
  dashboard.activeEntityDetail.dataProductMixC("")
  dashboard.dataAA("Inward")
  dashboard.dataBB("Outward")
  // for flow
  if (dashboard.activeEntity().bank.Cash != undefined) {
    var datainflow = dashboard.activeEntity().bank.Cash.PAYEE
    var dataoutflow = dashboard.activeEntity().bank.Cash.BUYER
  }
  var suminflow = _.sumBy(datainflow, 'value')
  var sumoutflow = _.sumBy(dataoutflow, 'value')
  var colorval = ["#000000", "#0070c0", "#60d5a8", "#8faadc"]
  if (suminflow == 0) {
    dashboard.inflow(false)
  } else {
    dashboard.inflow(true)
  }
  if (sumoutflow == 0) {
    dashboard.outflow(false)
  } else {
    dashboard.outflow(true)
  }

  if (datainflow != undefined) {
    var maxthreein = _.sortBy(datainflow, 'value').reverse().splice(0, 3);
    var summaxthreein = _.sumBy(maxthreein, 'value')
    tempdatain = [];

    _.each(maxthreein, function (v, i) {
      tempdatain.push({
        text: v.bank,
        value: Math.round((v.value / suminflow) * 100),
        color: colorval[i],
        tooltip: dashboard.bm(v.value, "")
      });
    });
    var sumtin = _.sumBy(tempdatain, 'value')
    if (datainflow.length > 3) {
      tempdatain.push({
        text: "Other",
        value: (100 - sumtin),
        color: colorval[3],
        tooltip: dashboard.bm(suminflow - summaxthreein, "")
      });
    }

    dashboard.activeEntityDetail.dataInFlow(tempdatain)
    var suminflowr = dashboard.bm(suminflow, "inflow")
    dashboard.activeEntityDetail.sumInFlow(suminflowr)
  }

  if (dataoutflow != undefined) {
    var maxthreeout = _.sortBy(dataoutflow, 'value').reverse().splice(0, 3);
    var summaxthreeout = _.sumBy(maxthreeout, 'value')
    tempdataout = [];
    _.each(maxthreeout, function (v, i) {
      tempdataout.push({
        text: v.bank,
        value: Math.round((v.value / sumoutflow) * 100),
        color: colorval[i],
        tooltip: dashboard.bm(v.value, "")
      });
    });
    var sumtout = _.sumBy(tempdataout, 'value')
    if (dataoutflow.length > 3) {
      tempdataout.push({
        text: "Other",
        value: (100 - sumtout),
        color: colorval[3],
        tooltip: dashboard.bm(sumoutflow - summaxthreeout, "")
      });
    }
    dashboard.activeEntityDetail.dataOutFlow(tempdataout)
    var sumoutflowr = dashboard.bm(sumoutflow, "outflow")
    dashboard.activeEntityDetail.sumOutFlow(sumoutflowr)
  }
  $("#groupbuttondetail").hide()
  $("#tradetabs").show()
  $(".some").kendoTooltip({
    animation: false,
    width: 180,
    position: "top"
  })
}

dashboard.btnTrade = function () {
  dashboard.activeEntityDetail.noteHeaderModal(" Trade")
  dashboard.activeEntityDetail.dataProductMix([])
  dashboard.activeEntityDetail.dataInFlow([])
  dashboard.activeEntityDetail.dataOutFlow([])
  dashboard.activeEntityDetail.sumInFlow(0)
  dashboard.activeEntityDetail.sumOutFlow(0)
  dashboard.other(true)
  // for trade  

  var AA = []
  AA = dashboard.activeEntity().product.undefined[1].export;
  var BB = []
  BB = dashboard.activeEntity().product.undefined[1].import;
  var CC = []
  CC = dashboard.activeEntity().product.undefined[1].other;
  dashboard.activeEntityDetail.dataProductMixA(AA)
  dashboard.activeEntityDetail.dataProductMixB(BB)
  dashboard.activeEntityDetail.dataProductMixC(CC)
  dashboard.dataAA("Export")
  dashboard.dataBB("Import")

  var data = dashboard.activeEntity().product.Trade
  var maxthree = _.sortBy(data, 'value').reverse().splice(0, 3);
  dashboard.activeEntityDetail.dataProductMix(maxthree)
  // for flow
  if (dashboard.activeEntity().bank.Trade != undefined) {
    var datainflow = dashboard.activeEntity().bank.Trade.PAYEE
    var dataoutflow = dashboard.activeEntity().bank.Trade.BUYER
  }
  var suminflow = _.sumBy(datainflow, 'value')
  var sumoutflow = _.sumBy(dataoutflow, 'value')
  var colorval = ["#000000", "#0070c0", "#60d5a8", "#8faadc"]
  if (suminflow == 0) {
    dashboard.inflow(false)
  } else {
    dashboard.inflow(true)
  }
  if (sumoutflow == 0) {
    dashboard.outflow(false)
  } else {
    dashboard.outflow(true)
  }



  if (datainflow != undefined) {
    var maxthreein = _.sortBy(datainflow, 'value').reverse().splice(0, 3);
    var summaxthreein = _.sumBy(maxthreein, 'value')
    tempdatain = [];
    _.each(maxthreein, function (v, i) {
      tempdatain.push({
        text: v.bank,
        value: Math.round((v.value / suminflow) * 100),
        color: colorval[i],
        tooltip: dashboard.bm(v.value, "")
      });
    });
    var sumtin = _.sumBy(tempdatain, 'value')
    if (datainflow.length > 3) {
      tempdatain.push({
        text: "Other",
        value: (100 - sumtin),
        color: colorval[3],
        tooltip: dashboard.bm(suminflow - summaxthreein, "")
      });
    }
    dashboard.activeEntityDetail.dataInFlow(tempdatain)
    var suminflowr = dashboard.bm(suminflow, "inflow")
    dashboard.activeEntityDetail.sumInFlow(suminflowr)
  }

  if (dataoutflow != undefined) {
    var maxthreeout = _.sortBy(dataoutflow, 'value').reverse().splice(0, 3);
    var summaxthreeout = _.sumBy(maxthreeout, 'value')
    tempdataout = [];
    _.each(maxthreeout, function (v, i) {
      tempdataout.push({
        text: v.bank,
        value: Math.round((v.value / sumoutflow) * 100),
        color: colorval[i],
        tooltip: dashboard.bm(v.value, "")
      });
    });
    var sumtout = _.sumBy(tempdataout, 'value')
    if (dataoutflow.length > 3) {
      tempdataout.push({
        text: "Other",
        value: (100 - sumtout),
        color: colorval[3],
        tooltip: dashboard.bm(sumoutflow - summaxthreeout, "")
      });
    }
    dashboard.activeEntityDetail.dataOutFlow(tempdataout)
    var sumoutflowr = dashboard.bm(sumoutflow, "outflow")
    dashboard.activeEntityDetail.sumOutFlow(sumoutflowr)
  }
  $("#groupbuttondetail").hide()
  $("#tradetabs").show()
  $(".some").kendoTooltip({
    animation: false,
    width: 180,
    position: "top"
  });
}

dashboard.btnBack = function () {
  dashboard.activeEntityDetail.noteHeaderModal("")
  $("#groupbuttondetail").show()
  $("#tradetabs").hide()
}

var widget = {}

widget.etb = ko.observable(0)
widget.buyer = ko.observable(0)
widget.seller = ko.observable(0)
widget.inFlow = ko.observable(0)
widget.outFlow = ko.observable(0)
widget.pipeline = ko.observable(4.01)

widget.etbYearChange = ko.observable(0)
widget.buyerYearChange = ko.observable(0)
widget.sellerYearChange = ko.observable(0)
widget.inFlowYearChange = ko.observable(0)
widget.outFlowYearChange = ko.observable(0)
widget.pipelineYearChange = ko.observable(1.54)

widget.buildChart = function (id, data, unit) {
  var chartParam = {
    dataSource: {
      data: data
    },
    title: {
      text: ""
    },
    chartArea: {
      background: ""
    },
    tooltip: {
      visible: true,
      template: "#= moment(category, 'YYYYMM').format('MMM YY') # : #= value #"
    },
    legend: {
      visible: false
    },
    seriesColors: ["#1e88e5"],
    series: [{
      field: "value",
      type: "line",
      style: "smooth",
      markers: {
        visible: false
      }
    }],
    categoryAxis: {
      field: "category",
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
  }

  if (unit) {
    chartParam.tooltip.template = "#= moment(category, 'YYYYMM').format('MMM YY') # : #= kendo.toString(value, 'n2')#B"
  }

  $(id).kendoChart(chartParam)
}

widget.generateChart1 = function () {
  viewModel.ajaxPostCallback("/main/dashboard/getchartetb", filter.payload(), function (data) {
    widget.buildChart("#widgetChart1", data)
  })
}

widget.generateChart2 = function () {
  viewModel.ajaxPostCallback("/main/dashboard/getchartbuyer", filter.payload(), function (data) {
    widget.buildChart("#widgetChart2", data)
  })
}

widget.generateChart3 = function () {
  viewModel.ajaxPostCallback("/main/dashboard/getchartseller", filter.payload(), function (data) {
    widget.buildChart("#widgetChart3", data)
  })
}

widget.generateChart4 = function () {
  viewModel.ajaxPostCallback("/main/dashboard/getchartinflow", filter.payload(), function (data) {
    data = _.map(data, function (e) {
      e.value = e.value / 1000000000

      return e
    })

    widget.buildChart("#widgetChart4", data, "B")
  })
}

widget.generateChart5 = function () {
  viewModel.ajaxPostCallback("/main/dashboard/getchartoutflow", filter.payload(), function (data) {
    data = _.map(data, function (e) {
      e.value = e.value / 1000000000

      return e
    })

    widget.buildChart("#widgetChart5", data, "B")
  })
}


widget.generateChart6 = function () {
  var data = [6, 1, 10, 1, 10]
  widget.buildChart("#widgetChart6", data)
}

widget.generateCharts = function () {
  // $("#hiden").hide()
  widget.generateChart1()
  widget.generateChart2()
  widget.generateChart3()
  widget.generateChart4()
  widget.generateChart5()
  widget.generateChart6()

}

widget.loadData = function () {
  // Loading current data
  viewModel.ajaxPostCallback("/main/dashboard/getetb", filter.payload(), function (data) {
    widget.etb(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getbuyer", filter.payload(), function (data) {
    widget.buyer(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getseller", filter.payload(), function (data) {
    widget.seller(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getinflow", filter.payload(), function (data) {
    widget.inFlow(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getoutflow", filter.payload(), function (data) {
    widget.outFlow(data)
  })

  // Loading annualy change data
  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeetb", filter.payload(), function (data) {
    widget.etbYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangebuyer", filter.payload(), function (data) {
    widget.buyerYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeseller", filter.payload(), function (data) {
    widget.sellerYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeinflow", filter.payload(), function (data) {
    widget.inFlowYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeoutflow", filter.payload(), function (data) {
    widget.outFlowYearChange(data)
  })
}

$(window).load(function () {
  widget.loadData()
  widget.generateCharts()
  dashboard.generateMapbox()
})