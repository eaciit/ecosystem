var counterpary = {}
counterpary.datadetailgraph = ko.observableArray([])

counterpary.meglobal = [{
    "value": "ASA",
    "text": "ASA"
}, {
    "value": "AME",
    "text": "AME"
}]
counterpary.buyer = [{
    "value": 1,
    "text": "Ibrahim Fibres"
}, {
    "value": 2,
    "text": "Reliance Ind"
}]
counterpary.group = [{
    "value": "ETB",
    "text": "ETB"
}, {
    "value": "NTB",
    "text": "NTB"
}]
counterpary.top = [{
    "value": 5,
    "text": "Top 5"
}, {
    "value": 3,
    "text": "Top 3"
}]
counterpary.flows = [{
    "value": 31,
    "text": "Flows>$30M"
}, {
    "value": 100,
    "text": "Flows>$100M"
}]


counterpary.generateGraph = function() {
 var data = {
  "DOW CHEMICAL INTERNATIONAL PRIVATE LIMITED": [
  {
    cpty_long_name: "DowChemical InternationalPvt. Ltd.",
    cpty_bank: "CITI",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "BUYER",
    total: "100000000"
  },{
    cpty_long_name: "ASIAN PAINTS SUPPLIER PAYMENTS A C",
    cpty_bank: "HDFC",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "BUYER",
    total: "10000000"
  },{
    cpty_long_name: "AKZO NOBEL INDIA LIMITED",
    cpty_bank: "CITI",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "PAYEE",
    total: "80000000"
  },{
    cpty_long_name: "KANSAI NEROLAC PAINT INDIA PRIVATE LIMITED",
    cpty_bank: "DEUT",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "PAYEE",
    total: "80000000"
  },{
    cpty_long_name: "NIPPON PAINT INDIA PRIVATE LIMITED",
    cpty_bank: "UTIB",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "PAYEE",
    total: "80000000"
  }]
}

var nodetitle = data["DOW CHEMICAL INTERNATIONAL PRIVATE LIMITED"];
var nt = {
    cpty_long_name: "DOW CHEMICAL INTERNATIONAL PRIVATE LIMITED",
    target: "DOW CHEMICAL INTERNATIONAL PRIVATE LIMITED",
    cpty_bank: "",
    cpty_coi: "",
    cust_bank: "",
    cust_role: "",
    text: "",
    total: "80000000" 
};
///add item
nodetitle.forEach(function (o) {
  { o.target = "DOW CHEMICAL INTERNATIONAL PRIVATE LIMITED";
   o.text = "";
   o.type = "opportunity";
   o.target2 = o.target;
   o.source2 = o.cpty_long_name; }

  });

for (var i=0; i<nodetitle.length; i++) { 
           if( nodetitle[i]["cust_bank"] = "SCBL" ){
            nodetitle[i]["text"] = "opportunity"
           }
     }

nodetitle.push(nt);

nodetitle.forEach(function (o) {
    Object.keys(o).forEach(function (k) {
        if (k == 'cpty_long_name') {
            o.source = o[k];
            delete o[k];
        }
    });
});

var zip = new Array();
var clone2 = nodetitle.slice();
var clone = _.map(nodetitle, _.clone);
var clone_opportunity = _.map(nodetitle, _.clone);
var clone_payee = _.map(nodetitle, _.clone);

for (var i=0; i<clone2.length; i++) {
                  if( clone2[i]["cust_role"] == "BUYER" ){
                       zip.push(clone2[i])
                   }          
     }



  for (var i=0; i<clone.length; i++) {
                  if( clone[i]["cust_role"] == "BUYER" ){
                        clone[i]["type"] = "flow"   
                        clone[i]["target"] = clone[i]["source2"] 
                        clone[i]["source"] = clone[i]["target2"]  
                        clone[i]["text"] = clone[i]["total"]     
                   }
     }

     for (var i=0; i<clone_payee.length; i++) {
                  if( clone_payee[i]["cust_role"] == "PAYEE" ){
                        clone_payee[i]["type"] = "flow"   
                        clone_payee[i]["text"] = clone_payee[i]["total"]   
                   }
     }

     for (var i=0; i<clone_opportunity.length; i++) {
                  if( clone_opportunity[i]["type"] == "opportunity" ){  
                        clone_opportunity[i]["target"] = clone_opportunity[i]["source2"] 
                        clone_opportunity[i]["source"] = clone_opportunity[i]["target2"] 
                         clone_opportunity[i]["text"] = clone_opportunity[i]["cpty_coi"]+" - "+clone_opportunity[i]["cust_bank"] 
                   }
     }

var min = zip.concat(clone);
var min2 = min.concat(clone_opportunity);
var min3 = min2.concat(clone_payee);
var links = min3;
console.log(min);
console.log(clone2);

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

var w = 600,
  h = 600;

var force = d3.layout.force()
  .nodes(d3.values(nodes))
  .links(links)
  .size([w, h])
  .linkDistance(200)
  .charge(-900)
  .gravity(.05)
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
  .attr("class", "pathText")
  .attr("dx", 75)
  .attr("dy", -3)
  .style("fill", "red")
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
  .on("click", collapse)
  .attr("r", 10)
  .call(force.drag);

var text = svg.append("svg:g").selectAll("g")
  .data(force.nodes())
  .enter().append("svg:g");

// A copy of the text with a thick white stroke for legibility.
text.append("svg:text")
  .attr("x", 14)
  .attr("y", ".31em")
  .attr("class", "shadow")
  .text(function (d) {
    return d.name;
  });

text.append("svg:text")
  .attr("x", 14)
  .attr("y", ".31em")
  .text(function (d) {
    return d.name;
  });

// Use elliptical arc path segments to doubly-encode directionality.
function tick() {
  path.attr("d", function (d) {
    var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = d.type == "opportunity" ? 200 : 400;
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
  });

  circle.attr("transform", function (d) {
    return "translate(" + d.x + "," + d.y + ")";
  });

  text.attr("transform", function (d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
}

  var status = 0
function collapse(d) {
   if (!d3.event.defaultPrevented) {
      //console.log(d);
      //var list1 = d3.selectAll(".mYc").filter(".a101");
      var slc = d.name;
     if (status == 0){
       d3.selectAll("circle").transition().duration(500)
        .style("visibility", function(o) {
        return o.name === slc  ? 1 : "hidden";
        });
        status = 1;
        d3.selectAll("path").transition().duration(500)
        .style("visibility", "hidden")
     
       d3.selectAll("path").transition().duration(500)
        .style("visibility", "hidden")
     
       d3.selectAll("text").transition().duration(500)
        .style("visibility", "hidden")
      }
      else if(status == 1){
         d3.selectAll("circle").transition().duration(500)
        .style("visibility", function(o) {
        return o.name === slc  ? 1 : "visible";
        });
        status = 0;
         d3.selectAll("path").transition().duration(500)
        .style("visibility", "visible")
     
       d3.selectAll("path").transition().duration(500)
        .style("visibility", "visible")
     
       d3.selectAll("text").transition().duration(500)
        .style("visibility", "visible")

      }
           
       // alert(slc);
      }///end event
  }
   


}



$(window).load(function() {
    counterpary.generateGraph()
})