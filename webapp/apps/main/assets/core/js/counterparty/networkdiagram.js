var counterparty = {}
counterparty.detail = ko.observableArray([])

counterparty.meglobal = [{
  "value": "ASA",
  "text": "ASA"
}, {
  "value": "AME",
  "text": "AME"
}]
counterparty.buyer = [{
  "value": 1,
  "text": "Ibrahim Fibres"
}, {
  "value": 2,
  "text": "Reliance Ind"
}]
counterparty.group = [{
  "value": "ETB",
  "text": "ETB"
}, {
  "value": "NTB",
  "text": "NTB"
}]
counterparty.top = [{
  "value": 5,
  "text": "Top 5"
}, {
  "value": 3,
  "text": "Top 3"
}]
counterparty.flows = [{
  "value": 31,
  "text": "Flows>$30M"
}, {
  "value": 100,
  "text": "Flows>$100M"
}]

counterparty.eventclick = function() {
$('#month').data('kendoDatePicker').enable(false);

  $('#radioBtn a').on('click', function(){
    var sel = $(this).data('title');
    var tog = $(this).data('toggle');
    $('#'+tog).prop('value', sel);
    if (sel=="M"){
         $('#year').data('kendoDatePicker').enable(false);
         $('#month').data('kendoDatePicker').enable(true);
      }
    else if(sel== "Y")
      {
        $('#year').data('kendoDatePicker').enable(true);
        $('#month').data('kendoDatePicker').enable(false);
      }
    
    $('a[data-toggle="'+tog+'"]').not('[data-title="'+sel+'"]').removeClass('active').addClass('notActive');
    $('a[data-toggle="'+tog+'"][data-title="'+sel+'"]').removeClass('notActive').addClass('active');
})
}

counterparty.loadNetwork = function() {
  viewModel.ajaxPostCallback("/main/counterparty/getnetworkdiagramdata", {
    entityName: "Lowndesville",
    limit: 5
  }, function (data) {
    counterparty.generateNetwork(data)
    
  })
}

counterparty.loadDetail = function() {
  viewModel.ajaxPostCallback("/main/counterparty/getdetailnetworkdiagramdata",{
    entityName: "Lowndesville",
    counterpartyName: "Enon"
  }, function(data){
    counterparty.detail(data)
    //console.log(data)
  }) 
}

counterparty.generateNetwork = function (data) {
 // console.log(data)
  var links = []
  parent = _.keys(data)[0]
  _.each(data[parent], function (e) {
    if (e.cpty_bank != "SCBL") {
      links.push({
        source: e.cpty_long_name,
        target: parent,
        type: "opportunity",
        text: ""
      })
      links.push({
        target: e.cpty_long_name,
        source: parent,
        type: "opportunity",
        text: ""
      })
    }

    if (e.cust_role == "PAYEE") {
      links.push({
        source: e.cpty_long_name,
        source_bank: e.cpty_bank,
        target: parent,
        target_bank: e.cust_bank,
        total: e.total,
        type: "flow",
        text: kendo.toString(e.total / 1000000, "n2") + "M"
      })
    } else {
      links.push({
        target: e.cpty_long_name,
        target_bank: e.cpty_bank,
        source: parent,
        source_bank: e.cust_bank,
        total: e.total,
        type: "flow",
        text: kendo.toString(e.total / 1000000, "n2") + "M"
      })
    }
  })

  //sort links by source, then target
  links.sort(function (a, b) {
    if (a.source > b.source) {
      return 1;
    } else if (a.source < b.source) {
      return -1;
    } else {
      if (a.target > b.target) {
        return 1;
      }
      if (a.target < b.target) {
        return -1;
      } else {
        return 0;
      }
    }
  });
  var nodes = {};

  // Compute the distinct nodes from the links.
  links.forEach(function (link) {
    link.source = nodes[link.source] || (nodes[link.source] = {
      name: link.source
    });
    link.target = nodes[link.target] || (nodes[link.target] = {
      name: link.target
    });
  });

  var w = $("#graph").width(),
    h = 600;

  var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([w, h])
    .linkDistance(200)
    .charge(-1000)
    .on("tick", tick)
    .start();

  var svg = d3.select("#graph").append("svg:svg")
    .attr("width", w)
    .attr("height", h);

  // Per-type markers, as they don't inherit styles.
  svg.append("svg:defs").selectAll("marker")
    .data(["flow", "missed"])
    .enter().append("svg:marker")
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 20)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

  var path = svg.append("svg:g").selectAll("path")
    .data(force.links())
    .enter().append("svg:path")
    .attr("id", function (d, i) {
      return "linkId_" + i;
    })
    .attr("class", function (d) {
      return "link " + d.type;
    })
    .attr("marker-end", function (d) {
      return "url(#" + d.type + ")";
    });

  var pathText = svg.selectAll(".pathText")
    .data(force.links())
    .enter().append("svg:text")
    .attr("dx", 75)
    .attr("dy", -3)
    .attr("class", function (d, i) {
      return d.type
    })
    .append("textPath")
    .attr("xlink:href", function (d, i) {
      return "#linkId_" + i;
    })
    .text(function (d, i) {
      return d.text
    });

  var circle = svg.append("svg:g").selectAll("circle")
    .data(force.nodes())
    .enter().append("svg:circle")
    .on("click", detail)
    .attr("r", 10)
    .call(force.drag);

  var text = svg.append("svg:g").selectAll("g")
    .data(force.nodes())
    .enter().append("svg:g");

  // A copy of the text with a thick white stroke for legibility.
  text.append("svg:text")
    .tspans(function (d) {
      var comp = d.name.split(" ")
      var top = comp.splice(0, comp.length / 2)
      var bottom = comp.splice(comp.length / 2, comp.length)

      return [top.join(" "), bottom.join(" ")]
    })
    .attr("x", 15)
    .attr("y", -5)
    .attr("class", "shadow")

  text.append("svg:text")
    .tspans(function (d) {
      var comp = d.name.split(" ")
      var top = comp.splice(0, comp.length / 2)
      var bottom = comp.splice(comp.length / 2, comp.length)

      return [top.join(" "), bottom.join(" ")]
    })
    .attr("x", 15)
    .attr("y", -5)

  // Use elliptical arc path segments to doubly-encode directionality.
  function tick() {
    path.attr("d", function (d) {
      var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = d.type == "opportunity" ? 200 : 0;
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    });

    circle.attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

    text.attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  }


function detail(d) {
  if (!d3.event.defaultPrevented) {
   if(d.name != parent){
      counterparty.detail()
       $("#initialform").html(d.name)
       $('#Modal').modal('show')
        }
      }
   }

}



$(window).load(function(){
  counterparty.loadNetwork()
  counterparty.loadDetail()
  counterparty.eventclick()
})