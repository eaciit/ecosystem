var dashboard = {}
dashboard.activeEntities = ko.observable({})
dashboard.activeEntity = ko.observable({})
dashboard.activeEntityDetail = {
  noteHeaderModal: ko.observable(),
  dataProductMix: ko.observableArray([]),
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

dashboard.getMapData = function (callback) {
  viewModel.ajaxPostCallback("/main/dashboard/getmapdata", {}, function (data) {
    $.getJSON("/main/static/core/js/countries.json", function (countries) {
      var result = _(data)
        .groupBy('country')
        .map(function (items, e) {
          var c = _.find(countries, {
            "country_code": e
          })
          var entities = _.map(items, 'entity')

          return {
            country: e,
            location: c.latlng,
            name: c.name,
            entities: entities,
            value: entities.length
          }
        })
        .value()

      callback(result)
    })
  })
}

dashboard.generateMap = function () {
  var activeShape
  var highlightedMapAlpha = 0.8
  var circledMapAlpha = 0.5
  var template = kendo.template($("#tooltip-template").html())
  var popup = $("<div class='bubble-tooltip'>Foo</div>")
    .appendTo(document.body)
    .kendoPopup()
    .data("kendoPopup")

  dashboard.getMapData(function (data) {
    $("#map").kendoMap({
      controls: {
        navigator: false
      },
      center: [18.062312304546726, 108.28125],
      zoom: 3,
      layers: [{
        type: "shape",
        dataSource: {
          data: mapTemplate.features,
        },
        style: {
          fill: {
            opacity: 0.5
          }
        }
      }, {
        type: "bubble",
        dataSource: data,
        style: {
          fill: {
            color: "#19B5FE",
            opacity: circledMapAlpha
          },
          stroke: {
            width: 0
          }
        }
      }],
      shapeMouseEnter: onShapeMouseEnter,
      shapeMouseLeave: onShapeMouseLeave
    })

    $("#map").unbind("mousewheel")
    $("#map").unbind("DOMMouseScroll")
  })

  function onShapeMouseEnter(e) {
    $("#groupbuttondetail").show()
    $("#tradetabs").hide()
    e.shape.options.fill.set("opacity", highlightedMapAlpha)
    activeShape = e.shape
    activeShape.options.set("stroke", {
       width: 3,
       color: "#fff",
    })
    $("#map").css("cursor", "pointer")

    if (e.shape.dataItem === undefined) {
      return
    }
  
    dashboard.activeEntities(e.shape.dataItem)
    var data = e.shape.dataItem
    var arr = data.entities
    var namel = data.name
    var lentity = arr.reduce(function (a, b) { return a.length > b.length ? a : b; });
    var nlength = namel.length*10
    var elength = lentity.length*10
    if(nlength > elength){ 
      $(".bubble-tooltip").css("width", nlength)
    }
    else{
      $(".bubble-tooltip").css("width", elength)
    }
    var oe = e.originalEvent
    var x = oe.pageX || oe.clientX
    var y = oe.pageY || oe.clientY

    popup.element.html(template(data))
    popup.open(x, y)
  }

  function onShapeMouseLeave(e) {
    e.shape.options.set("fill.opacity", circledMapAlpha)
    e.shape.options.set("stroke", {
      // width: 3,
      // color: "#fff",
    })

    $("#map").css("cursor", "inherit")
  
    if (!$(e.originalEvent.relatedTarget).is(".k-popup, .k-animation-container")) {
      popup.close()
      popup.element.kendoStop(true, true)
    }
  }

  dashboard.showMapDetails = function (i) {
    dashboard.getEntityDetail(dashboard.activeEntities().entities[i])

    popup.close()
    popup.element.kendoStop(true, true)
  }
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
      product: product
    })

    $("#mapDetailModal").modal("show")
  })
}

dashboard.btnCash = function () {
  dashboard.activeEntityDetail.noteHeaderModal(" Cash")
  dashboard.activeEntityDetail.dataProductMix([])
  dashboard.activeEntityDetail.dataInFlow([])
  dashboard.activeEntityDetail.dataOutFlow([])
  dashboard.activeEntityDetail.sumInFlow(0)
  dashboard.activeEntityDetail.sumOutFlow(0)
  // for trade  
  var data = dashboard.activeEntity().product.Cash
  var maxthree = _.sortBy(data, 'value').reverse().splice(0, 3);
  dashboard.activeEntityDetail.dataProductMix(maxthree)
  // for flow
  var datainflow = dashboard.activeEntity().bank.Cash.PAYEE
  var dataoutflow = dashboard.activeEntity().bank.Cash.BUYER
  var suminflow = _.sumBy(datainflow, 'value')
  var sumoutflow = _.sumBy(dataoutflow, 'value')
  var colorval = ["#000000", "#0070c0", "#60d5a8", "#8faadc"]

  if (datainflow != undefined) {
    var maxthreein = _.sortBy(datainflow, 'value').reverse().splice(0, 3);
    var summaxthreein = _.sumBy(maxthreein, 'value')
    tempdatain = [];

    _.each(maxthreein, function (v, i) {
      tempdatain.push({
        text: v.bank,
        value: Math.round((v.value / suminflow) * 100),
        color: colorval[i]
      });
    });
    var sumtin = _.sumBy(tempdatain, 'value')
    if (datainflow.length > 3) {
      tempdatain.push({
        text: "Other",
        value: (100 - sumtin),
        color: colorval[3]
      });
    }
    dashboard.activeEntityDetail.dataInFlow(tempdatain)
    dashboard.activeEntityDetail.sumInFlow(currencynum(suminflow))
  }

  if (dataoutflow != undefined) {
    var maxthreeout = _.sortBy(dataoutflow, 'value').reverse().splice(0, 3);
    var summaxthreeout = _.sumBy(maxthreeout, 'value')
    tempdataout = [];
    _.each(maxthreeout, function (v, i) {
      tempdataout.push({
        text: v.bank,
        value: Math.round((v.value / sumoutflow) * 100),
        color: colorval[i]
      });
    });
    var sumtout = _.sumBy(tempdataout, 'value')
    if (dataoutflow.length > 3) {
      tempdataout.push({
        text: "Other",
        value: (100 - sumtout),
        color: colorval[3]
      });
    }
    dashboard.activeEntityDetail.dataOutFlow(tempdataout)
    dashboard.activeEntityDetail.sumOutFlow(currencynum(sumoutflow))
  }
  $("#groupbuttondetail").hide()
  $("#tradetabs").show()
}

dashboard.btnTrade = function () {
  dashboard.activeEntityDetail.noteHeaderModal(" Trade")
  dashboard.activeEntityDetail.dataProductMix([])
  dashboard.activeEntityDetail.dataInFlow([])
  dashboard.activeEntityDetail.dataOutFlow([])
  dashboard.activeEntityDetail.sumInFlow(0)
  dashboard.activeEntityDetail.sumOutFlow(0)
  // for trade  
  var data = dashboard.activeEntity().product.Trade
  var maxthree = _.sortBy(data, 'value').reverse().splice(0, 3);
  dashboard.activeEntityDetail.dataProductMix(maxthree)
  // for flow
  var datainflow = dashboard.activeEntity().bank.Trade.PAYEE
  var dataoutflow = dashboard.activeEntity().bank.Trade.BUYER
  var suminflow = _.sumBy(datainflow, 'value')
  var sumoutflow = _.sumBy(dataoutflow, 'value')
  if (datainflow != undefined) {
    var maxthreein = _.sortBy(datainflow, 'value').reverse().splice(0, 3);
    var summaxthreein = _.sumBy(maxthreein, 'value')
    tempdatain = [];
    var colorval = ["#000000", "#0070c0", "#60d5a8", "#8faadc"]
    _.each(maxthreein, function (v, i) {
      tempdatain.push({
        text: v.bank,
        value: Math.round((v.value / suminflow) * 100),
        color: colorval[i]
      });
    });
    var sumtin = _.sumBy(tempdatain, 'value')
    if (datainflow.length > 3) {
      tempdatain.push({
        text: "Other",
        value: (100 - sumtin),
        color: colorval[3]
      });
    }
    dashboard.activeEntityDetail.dataInFlow(tempdatain)
    dashboard.activeEntityDetail.sumInFlow(currencynum(suminflow))
  }

  if (dataoutflow != undefined) {
    var maxthreeout = _.sortBy(dataoutflow, 'value').reverse().splice(0, 3);
    var summaxthreeout = _.sumBy(maxthreeout, 'value')
    tempdataout = [];
    _.each(maxthreeout, function (v, i) {
      tempdataout.push({
        text: v.bank,
        value: Math.round((v.value / sumoutflow) * 100),
        color: colorval[i]
      });
    });
    var sumtout = _.sumBy(tempdataout, 'value')
    if (dataoutflow.length > 3) {
      tempdataout.push({
        text: "Other",
        value: (100 - sumtout),
        color: colorval[3]
      });
    }
    dashboard.activeEntityDetail.dataOutFlow(tempdataout)
    dashboard.activeEntityDetail.sumOutFlow(currencynum(sumoutflow))
  }
  $("#groupbuttondetail").hide()
  $("#tradetabs").show()
}

dashboard.btnBack = function(){
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
  var param = {
    fromYearMonth: 201509,
    toYearMonth: 201609
  }
  viewModel.ajaxPostCallback("/main/dashboard/getchartetb", param, function (data) {
    widget.buildChart("#widgetChart1", data)
  })
}

widget.generateChart2 = function () {
  var param = {
    fromYearMonth: 201509,
    toYearMonth: 201609
  }
  viewModel.ajaxPostCallback("/main/dashboard/getchartbuyer", param, function (data) {
    widget.buildChart("#widgetChart2", data)
  })
}

widget.generateChart3 = function () {
  var param = {
    fromYearMonth: 201509,
    toYearMonth: 201609
  }
  viewModel.ajaxPostCallback("/main/dashboard/getchartseller", param, function (data) {
    widget.buildChart("#widgetChart3", data)
  })
}

widget.generateChart4 = function () {
  var param = {
    fromYearMonth: 201509,
    toYearMonth: 201609
  }
  viewModel.ajaxPostCallback("/main/dashboard/getchartinflow", param, function (data) {
    data = _.map(data, function (e) {
      e.value = e.value / 1000000000

      return e
    })

    widget.buildChart("#widgetChart4", data, "B")
  })
}

widget.generateChart5 = function () {
  var param = {
    fromYearMonth: 201509,
    toYearMonth: 201609
  }
  viewModel.ajaxPostCallback("/main/dashboard/getchartoutflow", param, function (data) {
    data = _.map(data, function (e) {
      e.value = e.value / 1000000000

      return e
    })

    widget.buildChart("#widgetChart5", data, "B")
  })
}


widget.tes2 = function () {
var ns = 'http://www.w3.org/2000/svg';
var svg = document.querySelector( 'svg' );

var foreignObject = document.createElementNS( ns, 'defs');
foreignObject.setAttribute('height', 300);
foreignObject.setAttribute('width', 300);

var div = document.createElement('div');
div.innerHTML = 'Hello World';
alert(90)

foreignObject.appendChild( div ); 
svg.appendChild(foreignObject); //svg is an already created svg element containing a d3 char
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
  viewModel.ajaxPostCallback("/main/dashboard/getetb", {}, function (data) {
    widget.etb(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getbuyer", {}, function (data) {
    widget.buyer(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getseller", {}, function (data) {
    widget.seller(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getinflow", {}, function (data) {
    widget.inFlow(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getoutflow", {}, function (data) {
    widget.outFlow(data)
  })

  // Loading annualy change data
  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeetb", {}, function (data) {
    widget.etbYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangebuyer", {}, function (data) {
    widget.buyerYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeseller", {}, function (data) {
    widget.sellerYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeinflow", {}, function (data) {
    widget.inFlowYearChange(data)
  })

  viewModel.ajaxPostCallback("/main/dashboard/getyearchangeoutflow", {}, function (data) {
    widget.outFlowYearChange(data)
  })
}

$(window).load(function () {
  widget.loadData()
  widget.generateCharts()
  dashboard.generateMap()
})