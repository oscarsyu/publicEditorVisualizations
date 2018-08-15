//This section switches out the existing article for one from a .txt file.
/*
document.getElementById("articleHead").innerHTML = "Public Editor Lorem Ipsum"
d3.text("loremipsum.txt", function(text) {
    document.getElementById("textArticle").innerHTML = text.toString();
});
*/


//This section parses the CSV file into a JSON.
d3.csv("catsheet.csv", function(error, data) {
  if (error) throw error;
  // var json = buildHierarchy(csv);
  // var csv = d3.csv.parseRows(data);
  var articles = buildHierarchy(data);
  var article1 = articles["Article_1"];
  createVisualization(article1);
});

function buildHierarchy(data) {
  var articleID = "Article ID";
  var credCat = "Credibilty Indicator Category";
  var credName = "Credibility Indicator Name";
  var pts = "Points";

  var jsons = {}; //create object of json files
  var currArticle = "Article_" + data[0][articleID];
  var root = {"name": "CATEGORIES", "children": []};
  for (var i = 0; i < data.length; i++) { //article ID column
    if ("Article_" + data[i][articleID] !== currArticle) {
      //adds the current article to jsons, resets root to an empty object
      jsons[currArticle] = root;
      currArticle = "Article_" + data[i][articleID];
      var root = {"name": "CATEGORIES", "children": []};
    }
    if (!checkIn(root["children"], data[i][credCat], "name")) { //credibility column
      //adds a new category to the list of CATEGORIES if it doesn't exist
      root["children"].push({"name": data[i][credCat], "children": []});
    }
    var categoryIndex = findIndex(root["children"], data[i], credCat);

    // .map(function(e) {return e.name}).indexOf(data[i]["Credibilty Indicator Category"]);
    var cin = root["children"][categoryIndex]["children"];
    if (!checkIn(cin, data[i][credName], "name")) { //initializes credibility indicator name and score
      //only adds category if it exists
      cin.push({"name": data[i][credName], "size": 0, "startIndices": [], "endIndices": []});
    }
    var cinIndex = findIndex(cin,data[i],  credName);

    // cin.map(function(e) {return e.name}).indexOf(data[i]["Credibility Indicator Name"]);
    cin[cinIndex]["size"] += parseInt(data[i][pts]); //adds together the net impact of points, has not handled cancellation case, should be calculated based upon absolute value?
    cin[cinIndex]["startIndices"].push(parseInt(data[i]["Start"]));
    cin[cinIndex]["endIndices"].push(parseInt(data[i]["End"]));

  }

  return jsons; //object of json files for each article
};

function checkIn(data, cat, catName) {
  //checks to see if a category exists already
  for (var i = 0; i < data.length; i++) {
    if (data[i][catName] === cat) {
      return true;
    }
  }
  return false;
}

function findIndex(data, currRow, val) {
  /* data takes in the specified information up until the indexing action
  so for example:  if you wanted the Reasoning index, you would put
  root["children"] for data
  currRow is the current row you are on in the CSV.  so for the loop above,
  input data[i], or for row 10, input data[10]
  val is the criteria you want, so "Reasoning", or "Credibilty Indicator Category"
  */
  return data.map(function(e) {return e.name}).indexOf(currRow[val]);
}

function userFindIndex(data, val) {
  /* data:  specified information up until the indexing action
  ex: root["children"]
  val:  criteria desired, ex "Reasoning"
  example:
  userFindIndex(articles["Article_1"]["children"], "Reasoning");
  */
  return data.map(function(e) {return e.name}).indexOf(val);
}



//BEGIN VISUALIZATION
//This is the visualization code.
function createVisualization(article) {
  // Variables
    var chartDiv = document.getElementById("chart"); //resizes with css

    var width = 300;
    var height = 300;
    var radius = Math.min(width, height) / 2;
    var color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create the "graph" element.
    var g = d3.select('svg')
    .attr("preserveAspectRatio", "xMinYMin meet")
        // .attr("viewBox", "0 0 250 250")
        // .classed("svg-content", true)
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    // Partitition
    var partition = d3.partition()
        .size([2 * Math.PI, radius]);

    // Find data root
    var root = d3.hierarchy(article)
        .sum(function (d) { return Math.abs(d.size)});

    // Size arcs
    partition(root);
    var arc = d3.arc()
        .startAngle(function (d) { return d.x0 })
        .endAngle(function (d) { return d.x1 })
        .innerRadius(function (d) { return d.y0 })
        .outerRadius(function (d) { return d.y1 });

    // Put it all together



//COLORING SECTION
//This function determines the color of a category based on its parent, or name.
  function colorFinder(d) {
    if (d.data.children) {
        if (d.data.name === "Reasoning") {
               return d3.rgb(239, 92, 84);
            } else if (d.data.name === "Evidence") {
               return d3.rgb(0, 165, 150);
            } else {
               return d3.rgb(43, 82, 230);
            }
        }   else {
        //The children node colors are based on the colors of their parents.
            if (d.data.size > 0) {
                return d3.rgb(211,211,211);
            }
            if (d.parent.data.name === "Reasoning") {
                return d3.rgb(237, 134, 88);
            } else if (d.parent.data.name === "Evidence") {
                return d3.rgb(53, 201, 136);
            } else {
                return d3.rgb(71, 112, 178);
            }
        }
  }

//This function determines the color of text highlights.
  function textHighlight(d) {
      if (d.parent.data.name === "Reasoning") {
          return "red";
      } else if (d.parent.data.name === "Evidence") {
          return "green";
      } else {
          return "blue";
      }
  }


//CREDIBILITY VALUES
//These variables ensure that the total value is accurate.
  var sum = 0;
  var total = checkTotal(article);

//This function returns the total number of points in the Credibility Report.
  function checkTotal(d) {
    var top = 0;
    for (i = 0; i < d.children.length; i += 1) {
        for (j = 0; j < d.children[i].children.length; j += 1) {
            top += d.children[i].children[j].size;
        }
    }
    return top;
  };

//This function calculates the sum of the child nodes of a category. Used for "Reasoning", "Evidence", "Language".
  function checkSum(d) {
    if (d.data.children) {
        for (i = 0; i < d.data.children.length; i += 1) {
            sum += d.data.children[i].size;
        }
    } else {
        sum = d.data.size;
    }};


//DICTIONARIES
//This dictionary maps data nodes to paths.
var dataToPath = new Map();

//This dictionary maps indices to strings.
var indexToString = new Map();



//CREATE PATHS AND HIGHLIGHTS
//This is the visualization creation in its entirety.
  g.selectAll('g')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr("class", "node")
            .append('path')
            .attr("display", function (d) { return d.depth ? null : "none"; })
            .attr("d", arc)
            //For each path, map it to the corresponding data.
            .each(function(d){
                var curPath = this;
                dataToPath.set(d, curPath);
                if (d.data.children) {
                    return;
                } else {
                    var paragraph = document.getElementById("textArticle").innerHTML;
                    for (i = 0; i < d.data.startIndices.length; i += 1) {
                        var ind = d.data.startIndices[i];
                        var start = (ind + 0);
                        while (paragraph[start] != " " && paragraph[start] != ".") {
                            if (start == 0) {break;}
                                start -= 1;
                        }
                        if (start != 0) {start += 1;}
                        if (start in indexToString.values()) {start += 1};
                        indexToString.set(start, ["o", textHighlight(d), d.data.name]);
                    }
                    for (i = 0; i < d.data.endIndices.length; i += 1) {
                        var ind = d.data.endIndices[i];
                        var end = (ind + 0);
                        while (paragraph[end] != " " && paragraph[end] != ".") {
                            if (end == paragraph.length) {break;}
                                end += 1;
                        }
                        if (end in indexToString.values()) {end -= 1};
                        indexToString.set(end, ["c", textHighlight(d), d.data.name]);
                    }
                    //This completes the creation of the dictionary, with each entry having a unique key.
                }
            })

//This code adds in the highlights as needed.
var unsorted = Array.from(indexToString.keys());
var sorted = unsorted.sort(function(a, b){return a - b});
var indexOffset = 0;
var numactive = 0;
var inputString = "";
var categoryName = "";
var oldest = "transparent";
var oldName = "";
var middle = "transparent";
var midName = "";
var newest = "transparent";
var newName = "";
for (i = 0; i < sorted.length; i += 1) {
    categoryName = indexToString.get(sorted[i])[1];
    if (indexToString.get(sorted[i])[0] == "o") {
        oldest = middle;
        oldName = midName;
        middle = newest;
        midName = newName;
        newest = categoryName;
        newName = indexToString.get(sorted[i])[2];
        if (numactive == 0) {

            inputString = "<" + categoryName + " name='" + newName + "' class='highlighter' style='background: linear-gradient(to bottom, " +
                        newest + " 0%, transparent 20%)" +
                        "; background-position: 0 1.1em; background-repeat: repeat-x; background-size: 2px 13px; padding-bottom: 15px'>";
            numactive = 1;
        } else if (numactive == 1) {
            inputString = "<" + categoryName + " name='" + newName + "' class='highlighter' style='background: linear-gradient(to bottom, " +
                        middle + " 0%, transparent 20%, transparent 35%, " +
                        newest + " 40%, transparent 55%, transparent 70%)" +
                        "; background-position: 0 1.1em; background-repeat: repeat-x; background-size: 2px 13px; padding-bottom: 15px'>";
            numactive = 2;
        } else {
            inputString = "<" + categoryName + " name='" + newName + "' class='highlighter' style='background: linear-gradient(to bottom, " +
                        oldest + " 0%, transparent 20%, transparent 35%, " +
                        middle + " 40%, transparent 55%, transparent 70%, " +
                        newest + " 75%, transparent 90%)" +
                        "; background-position: 0 1.1em; background-repeat: repeat-x; background-size: 2px 13px; padding-bottom: 15px'>";
            numactive = 3;
        }
    } else {
        var continueString = "";
        if (numactive == 1) {
        } else if (numactive == 2) {
            if (newest == categoryName) {
                continueString = "</" + middle + ">" + "<" + middle + " name='" + midName + "' class='highlighter' style='background: linear-gradient(to bottom, " +
                                    middle + " 0%, transparent 20%)" +
                                    "; background-position: 0 1.1em; background-repeat: repeat-x; background-size: 2px 13px; padding-bottom: 15px'>";
            } else if (middle == categoryName) {
                continueString = "</" + newest + ">" + "<" + newest + " name='" + newName + "' class='highlighter' style='background: linear-gradient(to bottom, " +
                                    newest + " 0%, transparent 20%)" +
                                    "; background-position: 0 1.1em; background-repeat: repeat-x; background-size: 2px 13px; padding-bottom: 15px'>";
            }
        } else {
            if (newest == categoryName) {
                continueString = "</" + oldest + ">" + "<" + oldest + " name='" + oldName + "' class='highlighter' style='background: linear-gradient(to bottom, " +
                                    oldest + " 0%, transparent 20%, transparent 35%, " +
                                    middle + " 40%, transparent 55%, transparent 70%)" +
                                    "; background-position: 0 1.1em; background-repeat: repeat-x; background-size: 2px 13px; padding-bottom: 15px'>";
            } else if (middle == categoryName) {
                continueString = "</" + oldest + ">" + "<" + oldest + " name='" + oldName + "' class='highlighter' style='background: linear-gradient(to bottom, " +
                                    oldest + " 0%, transparent 20%, transparent 35%, " +
                                    newest + " 40%, transparent 55%, transparent 70%)" +
                                    "; background-position: 0 1.1em; background-repeat: repeat-x; background-size: 2px 13px; padding-bottom: 15px'>";
            } else {
                continueString = "</" + middle + ">" + "<" + middle + " name='" + midName + "' class='highlighter' style='background: linear-gradient(to bottom, " +
                                    middle + " 0%, transparent 20%, transparent 35%, " +
                                    newest + " 40%, transparent 55%, transparent 70%)" +
                                    "; background-position: 0 1.1em; background-repeat: repeat-x; background-size: 2px 13px; padding-bottom: 15px'>";
            }
        }
        inputString = "<hiText class='highlightertext'>" + indexToString.get(sorted[i])[2] + "</hiText></" + categoryName +">" + continueString;

        if (newest == categoryName) {
            newest = middle;
            middle = oldest;
            oldest = "transparent";
        } else if (middle == categoryName) {
            middle = oldest;
            oldest = "transparent";
        } else {
            oldest = "transparent";
        }
        numactive -= 1;
    }
    var paragraph = document.getElementById("textArticle").innerHTML;
    paragraph = paragraph.substring(0, sorted[i] + indexOffset) + inputString + paragraph.substring(sorted[i] + indexOffset);
    document.getElementById("textArticle").innerHTML = paragraph;
    indexOffset += inputString.length;
}



//VISUALIZATION TEXTBOX
//This section enables the textbox on hover in the article itself.
var hText = document.querySelectorAll('.highlightertext');

window.onmousemove = function (e) {
    var x = (e.clientX + 25) + 'px',
        y = (e.clientY + - 18) + 'px';
    for (var i = 0; i < hText.length; i++) {
        hText[i].style.top = y;
        hText[i].style.left = x;
    }
};
//This section enables the Floating Textbox for the visualization.
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


//VISUALIZATION ANIMATIONS
//This removes the current effects and resets the visualization to default.
var visOn = false;
function resetVis() {
    d3.selectAll("path")
        .transition()
        .duration(200)
        .attr('stroke-width', 2)
        .style("opacity", 1)
    g.selectAll(".center-text")
        .style("display", "none")
    sum = 0;
    g.append("text")
        .attr("class", "center-text")
        .attr("x", 0)
        .attr("y", 13)
        .style("font-size", 50)
        .style("text-anchor", "middle")
        .html((100 + total))
    // g.append("text")
    //     .attr("class", "center-text")
    //     .attr("x", 0)
    //     .attr("y", 25)
    //     .style("font-size", 18)
    //     .style("text-anchor", "middle")
    //     .html("Credibility")
    div.transition()
            .duration(200)
            .style("opacity", 0);
    visOn = false;
    }

resetVis();


//MOUSE ANIMATION
  //This is all the mouse animation code.
  g.selectAll('path')
            //On mouse entering, highlight path, clear old text, create new text.
            .on('mouseover',function(d) {
                g.selectAll(".center-text")
                    .style("display", "none")
                d3.selectAll("path")
                    .transition()
                    .style("opacity", 0.5)
                d3.select(this)
      	            .transition()
      	            .duration(300)
      	            .attr('stroke-width',5)
      	            .style("opacity", 1)
      	        d3.select(dataToPath.get(d.parent))
      	            .transition()
      	            .duration(300)
      	            .attr('stroke-width',5)
      	            .style("opacity", 1)
      	        if (d.height == 0) {
      	            var elems = document.getElementsByName(d.data.name);
      	            for (var i = 0; i < elems.length; i += 1) {
      	                elems[i].style.backgroundColor = colorFinder(d);
      	            }
      	        }
      	        //This code creates the text in the center of the model.
      	        checkSum(d)
                g.append("text")
                    .attr("class", "center-text")
                    .attr("x", -5)
                    .attr("y", 5)
                    .style("font-size", 40)
                    .style("text-anchor", "middle")
                    .html(sum)
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html(d.data.name)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px")
                    .style("width", function() {
                        if (d.data.name.length < 18) {
                            return "80px";
                        } else {
                            return "180px";
                        }
                    })
                visOn = true;
            })
            .on("mousemove", function(){
                if (visOn == true) {
                    div
                        .style("left", (d3.event.pageX)+ "px")
                        .style("top", (d3.event.pageY - 28) + "px")
                } else {
                    div.transition()
                        .duration(10)
                        .style("opacity", 0);
                }})
            //On mouse exiting, remove all highlights and clear all text and display the total value.
            .on('mouseout',function (d) {
                var elems = document.getElementsByName(d.data.name);
                    for (var i = 0; i < elems.length; i += 1) {
                  	    elems[i].style.backgroundColor = "white";
                    }
                resetVis();
            })
            .style('stroke', 'white')
            .attr('stroke-width', 2)
            .style("fill", colorFinder);
}
