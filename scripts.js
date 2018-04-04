var species = {
  B: "Halibut",
  C: "Sablefish",
  D: "Dungeness crab",
  E: "Hair Crab",
  F: "Freshwater fish",
  G: "Herring roe",
  H: "Herring (food/bait)",
  I: "Ling cod",
  J: "Geoduck clams",
  K: "King crab",
  L: "Herring spawn on kelp",
  M: "Misc. saltwater finfish",
  N: "Snails",
  O: "Octopus/squid",
  P: "Shrimp",
  Q: "Sea cucumber",
  R: "Clams",
  S: "Salmon",
  T: "Tanner crab",
  TB: "Tanner Bairdi crab",
  U: "Sea urchin",
  W: "Scallops",
  Y: "Rockfish"
};

var gear = {"1":"PURSE SEINE","2":"VESSEL TO 80'","4":"SET GILLNET","5":"HAND TROLL","6":"LONGLINE VESSEL UNDER 60'","7":"OTTER TRAWL","8":"FISH WHEEL","9":"POT GEAR VESSEL UNDER 60'","10":"RING NET","11":"DIVING GEAR","12":"DIVE/HAND PICK","17":"BEAM TRAWL","18":"SHOVEL","21":"POUND","23":"MECHANICAL DIGGER","25":"DINGLEBAR TROLL","26":"MECHANICAL JIG","34":"GILLNET","37":"PAIR TRAWL","61":"LONGLINE VESSEL 60' OR OVER","77":"GILLNET","91":"POT GEAR VESSEL 60' OR OVER"};

var regions = {"A":"SOUTHEAST","B":"STATEWIDE","D":"YAKUTAT","E":"PRINCE WILLIAM SOUND","J":"WESTWARD","L":"CHIGNIK","M":"ALASKA PENINSULA","Q":"BERING SEA","T":"BRISTOL BAY","X":"KOTZEBUE","H":"COOK INLET","S":"SECURITY COVE","V":"CAPE AVINOF","Z":"NORTON SOUND","K":"KODIAK","O":"DUTCH HARBOR","OA":"ALEUTIAN CDQAPICDA","OB":"ALEUTIAN CDQBBEDC","OC":"ALEUTIAN CDQCBSFA","OD":"ALEUTIAN CDQCVRF","OE":"ALEUTIAN CDQNSEDC","OF":"ALEUTIAN CDQYDFDA","OG":"ALEUTIAN ISLANDS ACAACDC","QA":"BERING SEA CDQAPICDA","QB":"BERING SEA CDQBBEDC","QC":"BERING SEA CDQCBSFA","QD":"BERING SEA CDQCVRF","QE":"BERING SEA CDQNSEDC","QF":"BERING SEA CDQYDFDA","TA":"BRISTOL BAY CDQAPICDA","TB":"BRISTOL BAY CDQBBEDC","TC":"BRISTOL BAY CDQCBSFA","TD":"BRISTOL BAY CDQCVRF","TE":"BRISTOL BAY CDQNSEDC","TF":"BRISTOL BAY CDQYDFDA","ZE":"NORTON SOUND CDQNSEDC","ZF":"NORTON SOUND CDQYDFDA","G":"GOA","AB":"STATEWIDE","AG":"GOA","BB":"STATEWIDE","BG":"GOA","FB":"STATEWIDE","FG":"GOA","GB":"STATEWIDE","GG":"GOA","HB":"STATEWIDE","HG":"GOA","IB":"STATEWIDE","IG":"GOA","F":"ATKA/AMLIA ISLANDS","R":"ADAK","AFW":"FEDERAL WATERS","ASW":"STATE WATERS","BFW":"FEDERAL WATERS","BSW":"STATE WATERS"};

var margin = {top: 30, right: 0, bottom: 10, left: 60},
    width = 850,
    height = 850;

var colors = ['#30653a','#7d4f00','#4e597d','#2a616e','#a3301e','#81447f','#005fa9'];

var x = d3.scale.ordinal().rangeBands([0, width]),
    y = d3.scale.ordinal().rangeBands([0, height]),
    z = d3.scale.pow().exponent(0.2).domain([0,100]).range([0,1]);
    c = d3.scale.category10().domain(d3.range(7));

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    //.style("margin-left", -margin.left + "px")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var fishNodes = null,
    fishLinks = null;

d3.csv('matrix-headers.csv', function(data){
  console.log(data);
  fishLinks = data;
  goGate();
});
d3.csv('fisheries-nodes.csv', function(data){
  console.log(data);
  data.forEach(function(each){
    for (key in each){
      if ( each.hasOwnProperty(key) ){
        console.log(each[key]);
        if ( !isNaN(+each[key]) ){
          each[key] = +each[key];
        }
      }
    }
  });
  fishNodes = data;
  goGate();
});

function goGate(){
  if ( fishNodes !== null && fishLinks !== null ){
    go();
  } else {
    return;
  }
}

var newLinks = [],
network = {};
function go(){
  fishLinks.forEach(function(each,i){
    for (key in each){
      if ( each.hasOwnProperty(key) ){
        //console.log(key);
        let match = fishNodes.find(function(obj){ // find the index of the target
          return obj.name === key;
        });
        let index = match.index;
        if (index !== i && each[key] !== "0" ){ // if source and target are not the same
          newLinks.push({
            source: i,
            target: index,
            value: +each[key]
          });
        }
      }
    }
  });
  network.nodes = fishNodes;
  network.links = newLinks;
  render(network);

}

function render(network) {
  console.log(network);
  var matrix = [],
      nodes = network.nodes,
      n = nodes.length;

  // Compute index per node.
  nodes.forEach(function(node, i) {
    node.index = i;
    node.count = 0;
    matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
  });
  console.log(matrix);
  // Convert links to matrix; count character occurrences.
  network.links.forEach(function(link) {
    matrix[link.source][link.target].z += link.value;
    matrix[link.target][link.source].z += link.value;
    matrix[link.source][link.source].z += link.value;
    matrix[link.target][link.target].z += link.value;
    nodes[link.source].count += link.value;
    nodes[link.target].count += link.value;
  });

  console.log(matrix);

  function setOrder(primary,secondary){
    function returnOrder(field){
      if ( field === 'count'){
        return d3.descending;
      } else {
        return d3.ascending;
      }
    }
    return d3.range(n).sort(function(a, b) { return returnOrder(primary)(nodes[a][primary], nodes[b][primary]) || returnOrder(secondary)(nodes[a][secondary], nodes[b][secondary]);});
  }
  

  // The default sort order.
  x.domain(setOrder('cluster','species'));

  svg.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height);

  var row = svg.selectAll(".row")
      .data(matrix)
      .enter().append("g")
      .attr("class", "row")
      .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
      .each(row);

  row.append("line")
      .attr("x2", width);

  row.append("text")
      .attr("x", -6)
      .attr("y", x.rangeBand() / 2)
      .attr("dy", ".32em")
      .attr("text-anchor", "end")
      .text(function(d, i) { return i + '. ' + nodes[i].name; });

  var column = svg.selectAll(".column")
      .data(matrix)
      .enter().append("g")
      .attr("class", "column")
      .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

  column.append("line")
      .attr("x1", -width);

  column.append("text")
      .attr("x", 2)
      .attr("y", x.rangeBand() / 2)
      .attr("dy", ".32em")
      .attr("text-anchor", "start")
      .text(function(d, i) { return nodes[i].name; });

  function row(row) {
    var cell = d3.select(this).selectAll(".cell")
        .data(row.filter(function(d) { return d.z; }))
        .enter().append("rect")
        .attr("class", "cell")
        .attr("x", function(d) { return x(d.x); })
        .attr("width", x.rangeBand())
        .attr("height", x.rangeBand())
        .style("fill-opacity", function(d) { return z(d.z); })
        .style("fill", function(d) { return nodes[d.x].cluster == nodes[d.y].cluster ? colors[nodes[d.x].cluster - 1] : '#595959'; })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);
  }

  function mouseover(p) {
    d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
    d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
  }

  function mouseout() {
    d3.selectAll("text").classed("active", false);
  }

  d3.select("#order1").on("change", reorder);
  d3.select("#order2").on("change", reorder);

  function reorder() {
    var v1 = d3.select("#order1").node().value;
    var v2 = d3.select("#order2").node().value;
    console.log(v1,v2);
    d3.selectAll("#order2 option[disabled]").attr('disabled', null); 
    d3.select("#order2 option[value=" + v1 + ']').attr('disabled',true);
    if ( v1 === v2 ){
      d3.select("#order2").classed('has-error',true); 
    } else {
      d3.select("#order2").classed('has-error',false);
    }
    order(v1, v2);
  }
  reorder();
  function order(v1,v2) {
    var indexOrder = setOrder(v1,v2);
    x.domain(indexOrder);
    //console.log(setOrder(v1,v2));
    var t = svg.transition().duration(2500);

    var tRow = t.selectAll(".row").delay(function(d, i) { return x(i) * 4; })
        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; });

    tRow
      .selectAll(".cell")
        .delay(function(d) { return x(d.x) * 4; })
        .attr("x", function(d) { return x(d.x); });

    tRow.each(function(d,i){
      d3.select(this).select("text")
        .text(function() { 
          return nodes[i].name + ' (' + ( indexOrder.indexOf(i) + 1 ) + ')';
        });
    });
      

    var tColumn = t.selectAll(".column")
        .delay(function(d, i) { return x(i) * 4; })
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

    tColumn.each(function(d,i){
      d3.select(this).select("text")
        .text(function() { return ( indexOrder.indexOf(i) + 1 ) });
        
    });
  }

  
}